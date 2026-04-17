/**
 * Mock Sunray client for local development when the mower isn't reachable.
 */
export class MockSunrayClient {
  constructor() {
    this.connected = true;
    this.operation = 1; // MOW
    this.mowPoint = 0;
    this.cachedStatus = null;
    this.cachedStats = null;
    this.cachedVersion = null;
    this.pollTimers = [];
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

  async sendCommand(cmd) {
    console.log(`[mock] command: ${cmd}`);
    if (cmd.startsWith('AT+C,0,0')) this.operation = 0;
    else if (cmd.startsWith('AT+C,1,1')) this.operation = 1;
    else if (cmd.startsWith('AT+C,0,4')) this.operation = 4;
    return 'OK';
  }

  startPolling() {
    this.cachedVersion = {
      version: '1.0.90',
      encryptMode: 0,
      challenge: 0,
      board: 'Linux',
      driver: 'SerialRobot',
      mcuFwName: 'Alfred',
      mcuFwVer: '1.0.0',
      robotId: 'batman',
      timestamp: Date.now(),
    };

    const tick = () => {
      this.mowPoint += Math.random() > 0.5 ? 1 : 0;
      const heading = (Date.now() / 5000) % (2 * Math.PI);
      this.cachedStatus = {
        battery: 24.2 + Math.sin(Date.now() / 60000) * 0.5,
        x: 2.5 + Math.sin(Date.now() / 10000) * 3,
        y: 1.2 + Math.cos(Date.now() / 10000) * 3,
        heading,
        gpsSolution: 2,
        gpsSolutionName: 'FIX',
        operation: this.operation,
        operationName: ['IDLE', 'MOW', 'CHARGE', 'ERROR', 'DOCK'][this.operation],
        mowPointIdx: this.mowPoint,
        dgpsAge: 0.8 + Math.random() * 0.5,
        sensor: 0,
        targetX: 3.0,
        targetY: 2.0,
        gpsAccuracy: 0.01 + Math.random() * 0.02,
        satellites: 18 + Math.floor(Math.random() * 4),
        current: this.operation === 2 ? -(1.5 + Math.random()) : (0.3 + Math.random() * 0.5),
        satellitesDgps: 14 + Math.floor(Math.random() * 3),
        mapCrc: 12345,
        lateralError: (Math.random() - 0.5) * 0.04,
        timetableDay: -1,
        timetableHour: -1,
        timestamp: Date.now(),
      };

      this.cachedStats = {
        idleTime: 3600,
        chargeTime: 7200,
        mowTime: 18000 + Math.floor(Date.now() / 1000) % 600,
        mowFloatTime: 200,
        mowFixTime: 17800,
        floatToFix: 5,
        mowDistance: 2450 + Math.floor(Date.now() / 1000) % 100,
        maxDgpsAge: 2.1,
        imuRecoveries: 0,
        tempMin: 18.5,
        tempMax: 42.3,
        gpsCheckErrors: 0,
        dgpsCheckErrors: 0,
        maxCtlCycle: 15,
        serialBuffer: 0,
        mowInvalidTime: 0,
        mowInvalidRecov: 0,
        mowObstacles: 3,
        freeMem: 180000,
        resetCause: 0,
        gpsJumps: 1,
        sonarCount: 0,
        bumperCount: 0,
        gpsMotionTimeout: 0,
        mowMotorRecovery: 0,
        liftCount: 0,
        gpsNoSpeed: 0,
        tofCount: 0,
        diffImuWheelYaw: 0.02,
        imuNoRotSpeed: 0,
        rotTimeout: 0,
        timestamp: Date.now(),
      };
    };

    tick();
    this.pollTimers.push(setInterval(tick, 2000));
    console.log('[mock] Polling started with simulated data');
  }

  stopPolling() {
    this.pollTimers.forEach(clearInterval);
    this.pollTimers = [];
  }
}
