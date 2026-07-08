/**
 * Hardware check: timed, self-stopping motor test phases for the lifted mower.
 *
 * Design notes (see alfred-os issue #18 and the 2026-07-08 "alfred" right
 * wheel failure that motivated the thresholds):
 *
 * - Per-wheel isolation uses plain manual-drive commands (AT+M,v,w) with the
 *   unicycle kinematics identity v = ±w*WHEEL_BASE/2, which makes one wheel's
 *   set-speed exactly zero. No firmware changes needed, and unlike AT+E
 *   (Motor::test) it does not block the firmware main loop.
 * - The AT summary (AT+S) only exposes the *combined* motor current
 *   (motorsSenseLP); per-wheel currents exist only in console STEER logs,
 *   which the production dashboard container cannot read (no journal/podman
 *   mounts). Driving one wheel at a time makes the combined reading
 *   attributable to that wheel (minus the idle baseline).
 * - Every phase is hard-capped in duration and stops the motors in a finally
 *   path; a module-level lock prevents concurrent phases.
 */

// WHEEL_BASE_CM = 39 in the Alfred Sunray config (wheel-to-wheel distance).
const WHEEL_BASE_M = 0.39;
// Angular rate for single-wheel phases. Outer wheel speed = OMEGA * WHEEL_BASE
// (~0.23 m/s) - slow enough to observe, fast enough for a meaningful load.
const OMEGA = 0.6;
const V_ONE = (OMEGA * WHEEL_BASE_M) / 2;

const DEFAULT_PHASE_MS = 4000;
const MAX_PHASE_MS = 6000;
const SAMPLE_INTERVAL_MS = 350;
const DRIVE_KEEPALIVE_MS = 900;

// Sunray operation codes (see OP_NAMES in sunray.js)
const OP_MOW = 1;
const OP_DOCK = 4;

const MOW_ON_CMD = 'AT+C,1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1';
const MOW_OFF_CMD = 'AT+C,0,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1';

export const PHASES = {
  baseline: { drive: null, label: 'Baseline (motors idle)' },
  'left-forward': { drive: [V_ONE, -OMEGA], label: 'Left wheel forward' },
  'left-backward': { drive: [-V_ONE, OMEGA], label: 'Left wheel backward' },
  'right-forward': { drive: [V_ONE, OMEGA], label: 'Right wheel forward' },
  'right-backward': { drive: [-V_ONE, -OMEGA], label: 'Right wheel backward' },
  'both-forward': { drive: [0.15, 0], label: 'Both wheels forward' },
  mow: { drive: 'mow', label: 'Mow motor spin-up' },
};

let phaseRunning = false;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sampleStatus(sunray) {
  // Prefer a fresh AT+S round-trip; fall back to the 2s polling cache
  // (e.g. MockSunrayClient, whose sendCommand doesn't return parseable data).
  try {
    const raw = await sunray.sendCommand('AT+S');
    if (typeof sunray.parseStatus === 'function') {
      const parsed = sunray.parseStatus(raw);
      if (parsed) return parsed;
    }
  } catch {
    // fall through to cache
  }
  return sunray.getCachedStatus();
}

async function stopMotors(sunray, phaseDef) {
  // Best effort, never throw from the stop path.
  try {
    if (phaseDef.drive === 'mow') {
      await sunray.sendCommand(MOW_OFF_CMD);
    } else {
      await sunray.sendCommand('AT+M,0,0');
    }
  } catch (e) {
    console.error(`hwcheck: stop command failed: ${e.message}`);
  }
  try {
    // Redundant second stop - cheap insurance against a lost packet.
    await sunray.sendCommand('AT+M,0,0');
  } catch {
    /* ignore */
  }
}

/**
 * Run a single hardware check phase. Returns collected current statistics.
 * Throws with .status set for client errors (400/409/503).
 */
export async function runPhase(sunray, phaseName, { durationMs } = {}) {
  const phaseDef = PHASES[phaseName];
  if (!phaseDef) {
    const err = new Error(`Unknown phase: ${phaseName}`);
    err.status = 400;
    throw err;
  }
  if (phaseRunning) {
    const err = new Error('Another hardware check phase is already running');
    err.status = 409;
    throw err;
  }

  const status = sunray.getCachedStatus();
  if (!status) {
    const err = new Error('Sunray not reachable (no status yet)');
    err.status = 503;
    throw err;
  }
  if (status.operation === OP_MOW || status.operation === OP_DOCK) {
    const err = new Error(
      'Mower must be idle for a hardware check (currently mowing/docking)'
    );
    err.status = 409;
    throw err;
  }

  const duration = Math.min(
    Math.max(parseInt(durationMs, 10) || DEFAULT_PHASE_MS, 1000),
    MAX_PHASE_MS
  );

  phaseRunning = true;
  const samples = [];
  try {
    const startedAt = Date.now();
    let lastKeepalive = 0;

    if (phaseDef.drive === 'mow') {
      await sunray.sendCommand(MOW_ON_CMD);
    }

    while (Date.now() - startedAt < duration) {
      const now = Date.now();
      if (
        Array.isArray(phaseDef.drive) &&
        now - lastKeepalive >= DRIVE_KEEPALIVE_MS
      ) {
        lastKeepalive = now;
        const [v, w] = phaseDef.drive;
        await sunray.sendCommand(`AT+M,${v.toFixed(3)},${w.toFixed(3)}`);
      }
      const s = await sampleStatus(sunray);
      if (s && typeof s.current === 'number') {
        // During OP_CHARGE the firmware reports charging current (negated);
        // exclude those samples rather than skewing the average.
        if (s.operation !== 2) samples.push(Math.abs(s.current));
      }
      await sleep(SAMPLE_INTERVAL_MS);
    }
  } finally {
    await stopMotors(sunray, phaseDef);
    phaseRunning = false;
  }

  if (samples.length === 0) {
    const err = new Error('No current samples collected during phase');
    err.status = 503;
    throw err;
  }

  // Drop the first sample (spin-up transient / stale cache) when we have
  // enough data, then aggregate.
  const usable = samples.length > 3 ? samples.slice(1) : samples;
  const avgCurrent = usable.reduce((a, b) => a + b, 0) / usable.length;
  const maxCurrent = Math.max(...usable);

  return {
    phase: phaseName,
    label: phaseDef.label,
    durationMs: duration,
    samples: usable.length,
    avgCurrent: Number(avgCurrent.toFixed(3)),
    maxCurrent: Number(maxCurrent.toFixed(3)),
  };
}
