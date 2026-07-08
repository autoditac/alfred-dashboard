<script>
  /**
   * Hardware check wizard (alfred-os issue #18, first slice).
   *
   * Guides the user through lifted-mower drive/mow motor tests:
   *  1. Preconditions (connection, idle, battery)
   *  2. Explicit safe-lift confirmation
   *  3. Baseline current, then per-wheel + mow motor phases, each followed
   *     by a visual user confirmation
   *  4. Result summary with pass/warn/fail verdicts
   *
   * Thresholds are derived from the real 2026-07-08 right-wheel failure on
   * "alfred": healthy unloaded wheel ≈0.15 A, blocked wheel ≈0.9 A at
   * near-zero RPM (which stayed below the firmware's own 1.2 A overload
   * threshold and therefore went undetected in the field).
   */
  import { runHwCheckPhase, sendControl } from '../lib/api.js';

  let { status } = $props();

  // Verdict thresholds (delta vs baseline, Amperes)
  const DELTA_PASS = 0.35;
  const DELTA_WARN = 0.6;
  // Left/right asymmetry ratio of deltas
  const ASYM_WARN = 1.5;
  const ASYM_FAIL = 2.5;
  const MIN_BATTERY_V = 22;

  const PHASE_SEQUENCE = [
    {
      id: 'left-forward',
      title: 'Left wheel — forward',
      question: 'Did the LEFT wheel spin forward smoothly (no grinding, no stutter)?',
    },
    {
      id: 'left-backward',
      title: 'Left wheel — backward',
      question: 'Did the LEFT wheel spin backward smoothly?',
    },
    {
      id: 'right-forward',
      title: 'Right wheel — forward',
      question: 'Did the RIGHT wheel spin forward smoothly (no grinding, no stutter)?',
    },
    {
      id: 'right-backward',
      title: 'Right wheel — backward',
      question: 'Did the RIGHT wheel spin backward smoothly?',
    },
    {
      id: 'both-forward',
      title: 'Both wheels — forward',
      question: 'Did BOTH wheels spin forward at the same speed?',
    },
    {
      id: 'mow',
      title: 'Mow motor',
      question:
        'Did the mow blade spin up (this phase runs ~10 s — the blade may take several seconds to start) and stop again?',
    },
  ];

  // step: 'intro' | 'lift' | phase index (0..n-1) | 'summary'
  let step = $state('intro');
  let liftConfirmed = $state(false);
  let running = $state(false);
  let runError = $state(null);
  let baseline = $state(null);
  // per-phase: { measurement, userOk (true/false/null) }
  let results = $state({});

  const preconditions = $derived.by(() => {
    const checks = [];
    checks.push({
      label: 'Mower connection',
      ok: !!status,
      detail: status ? 'Sunray reachable' : 'No status from Sunray',
    });
    checks.push({
      label: 'Mower is idle',
      ok: status ? status.operation !== 1 && status.operation !== 4 : false,
      detail: status ? status.operationName : '—',
    });
    checks.push({
      label: `Battery > ${MIN_BATTERY_V} V`,
      ok: status ? status.battery > MIN_BATTERY_V : false,
      detail: status ? `${status.battery?.toFixed(1)} V` : '—',
    });
    return checks;
  });
  const preconditionsOk = $derived(preconditions.every((c) => c.ok));

  function deltaOf(measurement) {
    if (!measurement || !baseline) return null;
    return Math.max(0, measurement.avgCurrent - baseline.avgCurrent);
  }

  function autoVerdict(measurement) {
    const d = deltaOf(measurement);
    if (d === null) return 'unknown';
    if (d < DELTA_PASS) return 'pass';
    if (d < DELTA_WARN) return 'warn';
    return 'fail';
  }

  function phaseVerdict(phaseId) {
    const r = results[phaseId];
    if (!r?.measurement) return 'unknown';
    if (r.userOk === false) return 'fail';
    return autoVerdict(r.measurement);
  }

  // Left/right asymmetry over the forward phases (most load-representative)
  const asymmetry = $derived.by(() => {
    const l = deltaOf(results['left-forward']?.measurement);
    const r = deltaOf(results['right-forward']?.measurement);
    if (l === null || r === null) return null;
    const lo = Math.min(l, r);
    const hi = Math.max(l, r);
    // Below the pass threshold both wheels are healthy; tiny absolute
    // differences would otherwise produce huge, meaningless ratios.
    if (hi < DELTA_PASS) return { ratio: 1, side: null, verdict: 'pass' };
    const ratio = lo > 0.01 ? hi / lo : Infinity;
    const side = l > r ? 'left' : 'right';
    const verdict = ratio < ASYM_WARN ? 'pass' : ratio < ASYM_FAIL ? 'warn' : 'fail';
    return { ratio, side, verdict };
  });

  const overallVerdict = $derived.by(() => {
    const verdicts = PHASE_SEQUENCE.map((p) => phaseVerdict(p.id));
    if (asymmetry) verdicts.push(asymmetry.verdict);
    if (verdicts.includes('fail')) return 'fail';
    if (verdicts.includes('warn') || verdicts.includes('unknown')) return 'warn';
    return 'pass';
  });

  async function startChecks() {
    running = true;
    runError = null;
    try {
      const res = await runHwCheckPhase('baseline', { durationMs: 3000 });
      baseline = res.result;
      step = 0;
    } catch (e) {
      runError = e.message;
    } finally {
      running = false;
    }
  }

  async function runCurrentPhase() {
    const phase = PHASE_SEQUENCE[step];
    running = true;
    runError = null;
    try {
      const res = await runHwCheckPhase(phase.id, { confirmLifted: true });
      results = { ...results, [phase.id]: { measurement: res.result, userOk: null } };
    } catch (e) {
      runError = e.message;
    } finally {
      running = false;
    }
  }

  function answerUserQuestion(ok) {
    const phase = PHASE_SEQUENCE[step];
    results = {
      ...results,
      [phase.id]: { ...results[phase.id], userOk: ok },
    };
    if (step + 1 < PHASE_SEQUENCE.length) {
      step = step + 1;
    } else {
      step = 'summary';
    }
  }

  async function emergencyStop() {
    try {
      await sendControl('stop');
    } catch {
      /* stop is best effort from the UI; backend stops motors per phase anyway */
    }
  }

  function restart() {
    step = 'intro';
    liftConfirmed = false;
    baseline = null;
    results = {};
    runError = null;
  }

  const verdictColor = { pass: 'var(--green)', warn: 'var(--amber)', fail: 'var(--red)', unknown: 'var(--text-dim)' };
  const verdictLabel = { pass: 'PASS', warn: 'WARN', fail: 'FAIL', unknown: '—' };
</script>

<div class="wizard">
  {#if step === 'intro'}
    <div class="card fade-in">
      <div class="label">Hardware Check</div>
      <p class="intro-text">
        Tests each drive wheel and the mow motor while the mower is lifted,
        measuring motor current against an idle baseline. You will be asked to
        visually confirm each movement.
      </p>
      <div class="checks">
        {#each preconditions as check}
          <div class="check-row">
            <span class="check-dot" style:background={check.ok ? 'var(--green)' : 'var(--red)'}></span>
            <span class="check-label">{check.label}</span>
            <span class="check-detail">{check.detail}</span>
          </div>
        {/each}
      </div>
      <button class="action-btn primary" disabled={!preconditionsOk} onclick={() => (step = 'lift')}>
        Continue
      </button>
      {#if !preconditionsOk}
        <p class="hint">All preconditions must pass before the check can start.</p>
      {/if}
    </div>
  {:else if step === 'lift'}
    <div class="card fade-in">
      <div class="label">Safety — lift the mower</div>
      <div class="lift-figure" aria-hidden="true">
        <svg viewBox="0 0 200 90" fill="none" stroke="currentColor" stroke-width="2">
          <!-- ground -->
          <line x1="0" y1="80" x2="200" y2="80" stroke="var(--text-dim)" />
          <!-- supports -->
          <rect x="45" y="58" width="14" height="22" rx="2" stroke="var(--amber)" />
          <rect x="140" y="58" width="14" height="22" rx="2" stroke="var(--amber)" />
          <!-- mower body -->
          <rect x="30" y="30" width="140" height="28" rx="8" stroke="var(--text)" />
          <!-- wheels, off the ground -->
          <circle cx="60" cy="64" r="12" stroke="var(--green)" />
          <circle cx="140" cy="64" r="12" stroke="var(--green)" />
        </svg>
      </div>
      <ul class="safety-list">
        <li>Place the mower on stable supports so <strong>both rear wheels spin freely</strong>.</li>
        <li>Keep hands, feet and objects clear of the wheels <strong>and the mow blade</strong>.</li>
        <li>The mow motor will briefly spin during the last step.</li>
      </ul>
      <label class="confirm-row">
        <input type="checkbox" bind:checked={liftConfirmed} />
        <span>The mower is safely lifted and the blade area is clear.</span>
      </label>
      {#if runError}
        <p class="error-text">{runError}</p>
      {/if}
      <button class="action-btn primary" disabled={!liftConfirmed || running} onclick={startChecks}>
        {running ? 'Measuring baseline…' : 'Start checks'}
      </button>
    </div>
  {:else if typeof step === 'number'}
    {@const phase = PHASE_SEQUENCE[step]}
    {@const result = results[phase.id]}
    <div class="card fade-in">
      <div class="label">Step {step + 1} / {PHASE_SEQUENCE.length} — {phase.title}</div>

      {#if !result?.measurement}
        <p class="intro-text">
          The motor will run for about 4 seconds. Watch the wheel/blade.
        </p>
        {#if runError}
          <p class="error-text">{runError}</p>
        {/if}
        <div class="btn-row">
          <button class="action-btn primary" disabled={running} onclick={runCurrentPhase}>
            {running ? 'Running…' : 'Run test'}
          </button>
          <button class="action-btn danger" onclick={emergencyStop}>Stop</button>
        </div>
      {:else}
        {@const delta = deltaOf(result.measurement)}
        {@const verdict = autoVerdict(result.measurement)}
        <div class="measure-grid">
          <div>
            <div class="label">Current Δ vs baseline</div>
            <div class="value" style:color={verdictColor[verdict]}>
              {delta?.toFixed(2)}<span class="unit">A</span>
            </div>
          </div>
          <div>
            <div class="label">Avg / Max</div>
            <div class="value small">
              {result.measurement.avgCurrent.toFixed(2)} / {result.measurement.maxCurrent.toFixed(2)}<span class="unit">A</span>
            </div>
          </div>
          <div>
            <div class="label">Telemetry</div>
            <div class="badge" style:color={verdictColor[verdict]} style:border-color={verdictColor[verdict]}>
              {verdictLabel[verdict]}
            </div>
          </div>
        </div>
        <p class="question">{phase.question}</p>
        <div class="btn-row">
          <button class="action-btn confirm-yes" onclick={() => answerUserQuestion(true)}>Yes</button>
          <button class="action-btn confirm-no" onclick={() => answerUserQuestion(false)}>No</button>
          <button class="action-btn" disabled={running} onclick={runCurrentPhase}>
            {running ? 'Running…' : 'Repeat'}
          </button>
        </div>
      {/if}
    </div>
  {:else if step === 'summary'}
    <div class="card fade-in">
      <div class="label">Result</div>
      <div class="overall" style:color={verdictColor[overallVerdict]}>
        {#if overallVerdict === 'pass'}Rover good to go ✓{:else if overallVerdict === 'warn'}Check completed with warnings{:else}Problems detected{/if}
      </div>

      <table class="result-table">
        <tbody>
          <tr>
            <td>Baseline current</td>
            <td class="num">{baseline?.avgCurrent?.toFixed(2)} A</td>
            <td></td>
          </tr>
          {#each PHASE_SEQUENCE as phase}
            {@const r = results[phase.id]}
            {@const v = phaseVerdict(phase.id)}
            <tr>
              <td>{phase.title}</td>
              <td class="num">
                {#if r?.measurement}+{deltaOf(r.measurement)?.toFixed(2)} A{:else}—{/if}
                {#if r?.userOk === false}<span class="user-flag">user: not OK</span>{/if}
              </td>
              <td><span class="badge" style:color={verdictColor[v]} style:border-color={verdictColor[v]}>{verdictLabel[v]}</span></td>
            </tr>
          {/each}
          {#if asymmetry}
            <tr>
              <td>L/R symmetry (forward)</td>
              <td class="num">
                {asymmetry.ratio === Infinity ? '∞' : `${asymmetry.ratio.toFixed(1)}×`}
                {#if asymmetry.side && asymmetry.verdict !== 'pass'}<span class="user-flag">{asymmetry.side} higher</span>{/if}
              </td>
              <td><span class="badge" style:color={verdictColor[asymmetry.verdict]} style:border-color={verdictColor[asymmetry.verdict]}>{verdictLabel[asymmetry.verdict]}</span></td>
            </tr>
          {/if}
        </tbody>
      </table>

      {#if overallVerdict !== 'pass'}
        <div class="guidance">
          <div class="label">Suggested checks</div>
          <ul class="safety-list">
            <li>Spin the flagged wheel by hand and compare resistance with the other side.</li>
            <li>Check the axle for wrapped grass, string or debris.</li>
            <li>If resistance stays high with a clean axle, suspect the gearbox or wheel bearing.</li>
          </ul>
        </div>
      {/if}

      <button class="action-btn primary" onclick={restart}>Run again</button>
    </div>
  {/if}
</div>

<style>
  .wizard {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .intro-text {
    color: var(--text-dim);
    font-size: 14px;
    line-height: 1.5;
    margin: 8px 0 16px;
  }

  .checks {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 16px;
  }

  .check-row {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 14px;
  }

  .check-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .check-label {
    flex: 1;
  }

  .check-detail {
    color: var(--text-dim);
    font-size: 12px;
  }

  .lift-figure {
    color: var(--text);
    margin: 4px 0 8px;
  }

  .lift-figure svg {
    width: 100%;
    max-width: 260px;
    display: block;
    margin: 0 auto;
  }

  .safety-list {
    margin: 8px 0 16px;
    padding-left: 18px;
    color: var(--text-dim);
    font-size: 13px;
    line-height: 1.6;
  }

  .confirm-row {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    font-size: 14px;
    margin-bottom: 16px;
    cursor: pointer;
  }

  .confirm-row input {
    margin-top: 3px;
    accent-color: var(--green);
  }

  .measure-grid {
    display: flex;
    gap: 20px;
    align-items: flex-end;
    margin: 12px 0;
    flex-wrap: wrap;
  }

  .value.small {
    font-size: 18px;
  }

  .question {
    font-size: 15px;
    font-weight: 600;
    margin: 16px 0 12px;
  }

  .btn-row {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .action-btn {
    padding: 10px 20px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
    background: rgba(255, 255, 255, 0.06);
    color: var(--text);
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
  }

  .action-btn:disabled {
    opacity: 0.45;
    cursor: default;
  }

  .action-btn.primary {
    background: rgba(76, 217, 100, 0.12);
    border-color: var(--green);
    color: var(--green);
  }

  .action-btn.danger,
  .action-btn.confirm-no {
    background: rgba(255, 69, 58, 0.12);
    border-color: var(--red);
    color: var(--red);
  }

  .action-btn.confirm-yes {
    background: rgba(76, 217, 100, 0.12);
    border-color: var(--green);
    color: var(--green);
  }

  .hint {
    color: var(--text-dim);
    font-size: 12px;
    margin-top: 8px;
  }

  .error-text {
    color: var(--red);
    font-size: 13px;
    margin: 8px 0;
  }

  .overall {
    font-size: 20px;
    font-weight: 700;
    margin: 8px 0 16px;
  }

  .result-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
    margin-bottom: 16px;
  }

  .result-table td {
    padding: 7px 4px;
    border-bottom: 1px solid var(--border);
  }

  .result-table .num {
    text-align: right;
    font-variant-numeric: tabular-nums;
    color: var(--text-dim);
  }

  .user-flag {
    display: inline-block;
    margin-left: 6px;
    color: var(--red);
    font-size: 11px;
  }

  .badge {
    display: inline-block;
    padding: 2px 8px;
    border: 1px solid;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 700;
  }

  .guidance {
    margin-bottom: 16px;
  }
</style>
