import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { hostname } from 'node:os';

const execFileAsync = promisify(execFile);
import { SunrayClient } from './sunray.js';
import { MockSunrayClient } from './mock.js';

const app = new Hono();

const MOCK = process.env.MOCK === '1' || process.env.MOCK === 'true';
const SUNRAY_HOST = process.env.SUNRAY_HOST || 'localhost';
const SUNRAY_PORT = parseInt(process.env.SUNRAY_PORT || '80', 10);
const SUNRAY_PASS = parseInt(process.env.SUNRAY_PASS || '123456', 10);
const PORT = parseInt(process.env.PORT || '3000', 10);
const DOCK_LON = parseFloat(process.env.DOCK_LON || '0');
const DOCK_LAT = parseFloat(process.env.DOCK_LAT || '0');

const sunray = MOCK ? new MockSunrayClient() : new SunrayClient(SUNRAY_HOST, SUNRAY_PORT, SUNRAY_PASS);

app.use('/api/*', cors());

// --- API routes ---

app.get('/api/status', async (c) => {
  const data = sunray.getCachedStatus();
  if (!data) return c.json({ error: 'No data yet' }, 503);
  if (DOCK_LAT !== 0 && DOCK_LON !== 0) {
    data.lat = data.y / 111111 + DOCK_LAT;
    data.lon = data.x / (111111 * Math.cos(DOCK_LAT * Math.PI / 180)) + DOCK_LON;
  }
  return c.json(data);
});

app.get('/api/stats', async (c) => {
  const data = sunray.getCachedStats();
  if (!data) return c.json({ error: 'No data yet' }, 503);
  return c.json(data);
});

app.get('/api/version', async (c) => {
  const data = sunray.getCachedVersion();
  if (!data) return c.json({ error: 'No data yet' }, 503);
  return c.json({ ...data, hostname: hostname() });
});

app.get('/api/wifi', async (c) => {
  try {
    const { stdout } = await execFileAsync('/usr/sbin/iw', ['dev', 'wlan0', 'link']);
    const freq = parseFloat(stdout.match(/freq:\s*([\d.]+)/)?.[1]) || 0;
    const signal = parseFloat(stdout.match(/signal:\s*(-?\d+)/)?.[1]) || 0;
    const bitrate = parseFloat(stdout.match(/tx bitrate:\s*([\d.]+)/)?.[1]) || 0;
    const band = freq >= 5000 ? '5G' : freq >= 2400 ? '2.4G' : null;
    return c.json({ interface: 'wlan0', freq, band, signal, bitrate });
  } catch {
    return c.json({ error: 'WiFi info unavailable' }, 500);
  }
});

app.post('/api/control', async (c) => {
  const body = await c.req.json();
  const { action, params } = body;

  const commands = {
    stop: 'AT+C,0,0,-1,-1,-1,-1,-1,-1,-1,-1,-1',
    mow: `AT+C,1,1,${params?.speed ?? 0.2},-1,${params?.restart ? 1 : 0},-1,-1,-1,-1,-1,1`,
    dock: 'AT+C,0,4,-1,-1,-1,-1,-1,-1,-1,-1,-1',
    toggleMow: params?.on ? 'AT+C,1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1' : 'AT+C,0,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1',
    speed: `AT+C,-1,-1,${params?.speed ?? 0.2},-1,-1,-1,-1,-1,-1,-1,-1`,
    skipPoint: 'AT+C,-1,-1,-1,-1,-1,-1,1,-1,-1,-1,-1',
    reboot: 'AT+Y',
    rebootGps: 'AT+Y2',
    shutdown: 'AT+Y3',
  };

  const cmd = commands[action];
  if (!cmd) return c.json({ error: `Unknown action: ${action}` }, 400);

  const result = await sunray.sendCommand(cmd);
  return c.json({ ok: true, response: result });
});

// --- Static files (production) ---

app.use('/*', serveStatic({ root: './dist' }));
app.use('/*', serveStatic({ root: './dist', path: 'index.html' }));

// --- Start ---

sunray.startPolling();

serve({ fetch: app.fetch, port: PORT }, (info) => {
  console.log(`Alfred Dashboard running on http://localhost:${info.port}`);
  console.log(`Proxying to Sunray at ${SUNRAY_HOST}:${SUNRAY_PORT}`);
});
