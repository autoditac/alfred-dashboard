import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { SunrayClient } from './sunray.js';
import { MockSunrayClient } from './mock.js';

const app = new Hono();

const MOCK = process.env.MOCK === '1' || process.env.MOCK === 'true';
const SUNRAY_HOST = process.env.SUNRAY_HOST || 'localhost';
const SUNRAY_PORT = parseInt(process.env.SUNRAY_PORT || '80', 10);
const PORT = parseInt(process.env.PORT || '3000', 10);

const sunray = MOCK ? new MockSunrayClient() : new SunrayClient(SUNRAY_HOST, SUNRAY_PORT);

app.use('/api/*', cors());

// --- API routes ---

app.get('/api/status', async (c) => {
  const data = sunray.getCachedStatus();
  if (!data) return c.json({ error: 'No data yet' }, 503);
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
  return c.json(data);
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
