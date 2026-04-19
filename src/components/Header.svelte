<script>
  let { version, wifi, connected } = $props();

  // Dashboard build version, injected by vite (see vite.config.js).
  // Falls back to 'dev' for local `npm run dev`.
  // Git sha is 40 chars; show first 7 for readability.
  const UI_VERSION = __APP_VERSION__.length >= 40 ? __APP_VERSION__.slice(0, 7) : __APP_VERSION__;

  const wifiStrength = $derived(() => {
    if (!wifi) return 0;
    const dbm = wifi.signal;
    // Map dBm to 0-4 bars: >-50 = 4, >-60 = 3, >-70 = 2, >-80 = 1, else 0
    if (dbm > -50) return 4;
    if (dbm > -60) return 3;
    if (dbm > -70) return 2;
    if (dbm > -80) return 1;
    return 0;
  });
</script>

<header class="header">
  <div class="brand">
    <div class="logo">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M4 20 L12 4 L20 20 Z" stroke-linejoin="round"/>
        <circle cx="12" cy="16" r="1.5" fill="currentColor" stroke="none"/>
      </svg>
    </div>
    <div class="title-block">
      <h1>{version?.hostname ?? 'Alfred'}</h1>
      {#if version}
        <span class="version">{version.version} · {version.mcuFwName} {version.mcuFwVer}</span>
      {/if}
      <span class="ui-version">ui {UI_VERSION}</span>
    </div>
  </div>
  <div class="indicators">
    {#if wifi}
      <div class="wifi-indicator" title="{wifi.signal} dBm · {wifi.band ?? ''} · {wifi.bitrate} Mbit/s">
        <svg viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round">
          <path d="M1.5 8.5a18 18 0 0 1 21 0" stroke={wifiStrength() >= 4 ? 'var(--green)' : 'var(--text-dim)'} />
          <path d="M5 12a12 12 0 0 1 14 0" stroke={wifiStrength() >= 3 ? 'var(--green)' : 'var(--text-dim)'} />
          <path d="M8.5 15.5a6 6 0 0 1 7 0" stroke={wifiStrength() >= 2 ? 'var(--green)' : 'var(--text-dim)'} />
          <circle cx="12" cy="19" r="1.5" fill={wifiStrength() >= 1 ? 'var(--green)' : 'var(--text-dim)'} stroke="none" />
        </svg>
        <span class="wifi-dbm">{wifi.signal}{#if wifi.band} · {wifi.band}{/if}</span>
      </div>
    {/if}
    <div class="connection-dot" class:online={connected} title={connected ? 'Connected' : 'Disconnected'}></div>
  </div>
</header>

<style>
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid var(--border);
    background: var(--bg);
    position: sticky;
    top: 0;
    z-index: 50;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .logo {
    width: 28px;
    height: 28px;
    color: var(--green);
  }

  h1 {
    font-size: 18px;
    font-weight: 700;
    letter-spacing: -0.02em;
  }

  .version {
    font-size: 11px;
    color: var(--text-secondary);
  }

  .ui-version {
    font-size: 10px;
    color: var(--text-dim);
    font-variant-numeric: tabular-nums;
  }

  .title-block {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .connection-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--red);
    transition: background 0.3s ease;
  }

  .connection-dot.online {
    background: var(--green);
    animation: pulse-green 2s ease-in-out infinite;
  }

  .indicators {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .wifi-indicator {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .wifi-indicator svg {
    width: 20px;
    height: 20px;
  }

  .wifi-dbm {
    font-size: 11px;
    color: var(--text-secondary);
    font-variant-numeric: tabular-nums;
  }
</style>
