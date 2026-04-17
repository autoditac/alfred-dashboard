/**
 * Sunray AT command client.
 * Talks to the Sunray firmware HTTP server (port 80) using AT commands with CRC.
 */

const OP_NAMES = ['IDLE', 'MOW', 'CHARGE', 'ERROR', 'DOCK'];
const GPS_SOL_NAMES = ['INVALID', 'FLOAT', 'FIX'];

function computeCrc(str) {
  let crc = 0;
  for (let i = 0; i < str.length; i++) {
    crc = (crc + str.charCodeAt(i)) & 0xff;
  }
  return '0x' + crc.toString(16).padStart(2, '0');
}

function addCrc(cmd) {
  const withComma = cmd + ',';
  return withComma + computeCrc(withComma);
}

export class SunrayClient {
  constructor(host, port = 80) {
    this.host = host;
    this.port = port;
    this.baseUrl = `http://${host}:${port}`;
    this.cachedStatus = null;
    this.cachedStats = null;
    this.cachedVersion = null;
    this.connected = false;
    this.pollTimers = [];
  }

  async sendRaw(atCommand) {
    const cmd = addCrc(atCommand);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      const res = await fetch(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: cmd,
        signal: controller.signal,
      });
      clearTimeout(timeout);
      this.connected = true;
      return await res.text();
    } catch (e) {
      clearTimeout(timeout);
      this.connected = false;
      throw e;
    }
  }

  async sendCommand(atCommand) {
    const raw = await this.sendRaw(atCommand);
    return raw.trim();
  }

  parseStatus(raw) {
    const parts = raw.trim().split(',');
    if (parts[0] !== 'S') return null;
    const opCode = parseInt(parts[6]) || 0;
    const gpsSol = parseInt(parts[5]) || 0;
    return {
      battery: parseFloat(parts[1]) || 0,
      x: parseFloat(parts[2]) || 0,
      y: parseFloat(parts[3]) || 0,
      heading: parseFloat(parts[4]) || 0,
      gpsSolution: gpsSol,
      gpsSolutionName: GPS_SOL_NAMES[gpsSol] || 'UNKNOWN',
      operation: opCode,
      operationName: OP_NAMES[opCode] || 'UNKNOWN',
      mowPointIdx: parseInt(parts[7]) || 0,
      dgpsAge: parseFloat(parts[8]) || 0,
      sensor: parseInt(parts[9]) || 0,
      targetX: parseFloat(parts[10]) || 0,
      targetY: parseFloat(parts[11]) || 0,
      gpsAccuracy: parseFloat(parts[12]) || 0,
      satellites: parseInt(parts[13]) || 0,
      current: parseFloat(parts[14]) || 0,
      satellitesDgps: parseInt(parts[15]) || 0,
      mapCrc: parseInt(parts[16]) || 0,
      lateralError: parseFloat(parts[17]) || 0,
      timetableDay: parseInt(parts[18]) ?? -1,
      timetableHour: parseInt(parts[19]) ?? -1,
      timestamp: Date.now(),
    };
  }

  parseStats(raw) {
    const parts = raw.trim().split(',');
    if (parts[0] !== 'T') return null;
    return {
      idleTime: parseInt(parts[1]) || 0,
      chargeTime: parseInt(parts[2]) || 0,
      mowTime: parseInt(parts[3]) || 0,
      mowFloatTime: parseInt(parts[4]) || 0,
      mowFixTime: parseInt(parts[5]) || 0,
      floatToFix: parseInt(parts[6]) || 0,
      mowDistance: parseFloat(parts[7]) || 0,
      maxDgpsAge: parseFloat(parts[8]) || 0,
      imuRecoveries: parseInt(parts[9]) || 0,
      tempMin: parseFloat(parts[10]) || 0,
      tempMax: parseFloat(parts[11]) || 0,
      gpsCheckErrors: parseInt(parts[12]) || 0,
      dgpsCheckErrors: parseInt(parts[13]) || 0,
      maxCtlCycle: parseInt(parts[14]) || 0,
      serialBuffer: parseInt(parts[15]) || 0,
      mowInvalidTime: parseInt(parts[16]) || 0,
      mowInvalidRecov: parseInt(parts[17]) || 0,
      mowObstacles: parseInt(parts[18]) || 0,
      freeMem: parseInt(parts[19]) || 0,
      resetCause: parseInt(parts[20]) || 0,
      gpsJumps: parseInt(parts[21]) || 0,
      sonarCount: parseInt(parts[22]) || 0,
      bumperCount: parseInt(parts[23]) || 0,
      gpsMotionTimeout: parseInt(parts[24]) || 0,
      mowMotorRecovery: parseInt(parts[25]) || 0,
      liftCount: parseInt(parts[26]) || 0,
      gpsNoSpeed: parseInt(parts[27]) || 0,
      tofCount: parseInt(parts[28]) || 0,
      diffImuWheelYaw: parseFloat(parts[29]) || 0,
      imuNoRotSpeed: parseInt(parts[30]) || 0,
      rotTimeout: parseInt(parts[31]) || 0,
      timestamp: Date.now(),
    };
  }

  parseVersion(raw) {
    const parts = raw.trim().split(',');
    if (parts[0] !== 'V') return null;
    return {
      version: parts[1] || '',
      encryptMode: parseInt(parts[2]) || 0,
      challenge: parseInt(parts[3]) || 0,
      board: parts[4] || '',
      driver: parts[5] || '',
      mcuFwName: parts[6] || '',
      mcuFwVer: parts[7] || '',
      robotId: parts[8] || '',
      timestamp: Date.now(),
    };
  }

  getCachedStatus() {
    return this.cachedStatus ? { ...this.cachedStatus, connected: this.connected } : null;
  }

  getCachedStats() {
    return this.cachedStats;
  }

  getCachedVersion() {
    return this.cachedVersion;
  }

  async pollStatus() {
    try {
      const raw = await this.sendRaw('AT+S');
      const parsed = this.parseStatus(raw);
      if (parsed) this.cachedStatus = parsed;
    } catch {
      this.connected = false;
    }
  }

  async pollStats() {
    try {
      const raw = await this.sendRaw('AT+T');
      const parsed = this.parseStats(raw);
      if (parsed) this.cachedStats = parsed;
    } catch {}
  }

  async pollVersion() {
    try {
      const raw = await this.sendRaw('AT+V');
      const parsed = this.parseVersion(raw);
      if (parsed) this.cachedVersion = parsed;
    } catch {}
  }

  startPolling() {
    // Initial fetch
    this.pollVersion();
    this.pollStatus();
    this.pollStats();

    // Status every 2s, stats every 60s, version every 5 min
    this.pollTimers.push(setInterval(() => this.pollStatus(), 2000));
    this.pollTimers.push(setInterval(() => this.pollStats(), 60000));
    this.pollTimers.push(setInterval(() => this.pollVersion(), 300000));

    console.log(`Polling Sunray at ${this.baseUrl}`);
  }

  stopPolling() {
    this.pollTimers.forEach(clearInterval);
    this.pollTimers = [];
  }
}
