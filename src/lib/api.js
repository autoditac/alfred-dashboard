const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export function getStatus() {
  return request('/status');
}

export function getStats() {
  return request('/stats');
}

export function getVersion() {
  return request('/version');
}

export function getWifi() {
  return request('/wifi');
}

export function sendControl(action, params = {}) {
  return request('/control', {
    method: 'POST',
    body: JSON.stringify({ action, params }),
  });
}
