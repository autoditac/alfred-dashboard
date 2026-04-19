<script>
  import './app.css';
  import { getStatus, getStats, getVersion, getWifi } from './lib/api.js';
  import Header from './components/Header.svelte';
  import StatusBadge from './components/StatusBadge.svelte';
  import BatteryCard from './components/BatteryCard.svelte';
  import GpsCard from './components/GpsCard.svelte';
  import OperationCard from './components/OperationCard.svelte';
  import StatsCard from './components/StatsCard.svelte';
  import ControlPanel from './components/ControlPanel.svelte';
  import MapCard from './components/MapCard.svelte';
  import ConnectionLost from './components/ConnectionLost.svelte';

  let status = $state(null);
  let stats = $state(null);
  let version = $state(null);
  let wifi = $state(null);
  let error = $state(null);
  let tab = $state('status');

  async function pollStatus() {
    try {
      status = await getStatus();
      error = null;
    } catch (e) {
      error = e.message;
    }
  }

  async function pollStats() {
    try {
      stats = await getStats();
    } catch {}
  }

  async function pollVersion() {
    try {
      version = await getVersion();
    } catch {}
  }

  async function pollWifi() {
    try {
      wifi = await getWifi();
    } catch {}
  }

  $effect(() => {
    pollStatus();
    pollStats();
    pollVersion();
    pollWifi();
    const si = setInterval(pollStatus, 2000);
    const ti = setInterval(pollStats, 30000);
    const wi = setInterval(pollWifi, 10000);
    const vi = setInterval(pollVersion, 60000);
    return () => { clearInterval(si); clearInterval(ti); clearInterval(wi); clearInterval(vi); };
  });
</script>

<div class="shell">
  <Header {version} {wifi} connected={status?.connected ?? false} />

  {#if error && !status}
    <ConnectionLost message={error} />
  {:else}
    <main class="content">
      {#if tab === 'status'}
        <div class="grid fade-in">
          <StatusBadge {status} />
          <BatteryCard {status} />
          {#if status?.lat}
            <MapCard {status} />
          {/if}
          {#if stats}
            <StatsCard {stats} />
          {/if}
          <GpsCard {status} />
          <OperationCard {status} />
        </div>
      {:else if tab === 'control'}
        <ControlPanel {status} />
      {/if}
    </main>
  {/if}

  <nav class="tab-bar">
    <button class="tab" class:active={tab === 'status'} onclick={() => tab = 'status'}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
      <span>Status</span>
    </button>
    <button class="tab" class:active={tab === 'control'} onclick={() => tab = 'control'}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="10,8 16,12 10,16" fill="currentColor" stroke="none"/></svg>
      <span>Control</span>
    </button>
  </nav>
</div>

<style>
  .shell {
    display: flex;
    flex-direction: column;
    min-height: 100dvh;
  }

  .content {
    flex: 1;
    padding: 12px;
    padding-bottom: 80px;
    max-width: 600px;
    margin: 0 auto;
    width: 100%;
  }

  .grid {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .tab-bar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    justify-content: center;
    gap: 4px;
    padding: 8px 16px calc(8px + env(safe-area-inset-bottom));
    background: rgba(10, 10, 10, 0.85);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-top: 1px solid var(--border);
    z-index: 100;
  }

  .tab {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 6px 24px;
    border: none;
    background: none;
    color: var(--text-dim);
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.02em;
    cursor: pointer;
    border-radius: var(--radius-sm);
    transition: color 0.15s ease, background 0.15s ease;
  }

  .tab svg {
    width: 22px;
    height: 22px;
  }

  .tab.active {
    color: var(--green);
  }

  .tab:active {
    background: rgba(255,255,255,0.05);
  }
</style>
