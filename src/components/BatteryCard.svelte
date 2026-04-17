<script>
  let { status } = $props();

  let voltage = $derived(status?.battery?.toFixed(1) ?? '--');
  let isCharging = $derived(status?.current < 0);
  let currentDisplay = $derived(
    status ? Math.abs(status.current).toFixed(1) : '--'
  );

  // Estimate battery percentage (25.2V = 100%, 21V = 0% for 6S Li-ion)
  let percentage = $derived(() => {
    if (!status) return 0;
    const v = status.battery;
    const pct = Math.round(((v - 21) / (25.2 - 21)) * 100);
    return Math.max(0, Math.min(100, pct));
  });

  let barColor = $derived(() => {
    const pct = percentage();
    if (pct > 50) return 'var(--green)';
    if (pct > 20) return 'var(--amber)';
    return 'var(--red)';
  });
</script>

<div class="card">
  <div class="card-header">
    <span class="label">Battery</span>
    {#if isCharging}
      <span class="charging-badge">
        <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12"><polygon points="13,2 3,14 12,14 11,22 21,10 12,10"/></svg>
        Charging
      </span>
    {/if}
  </div>
  <div class="card-body">
    <div class="main-value">
      <span class="value">{voltage}</span>
      <span class="unit">V</span>
    </div>
    <div class="meta">
      <span class="pct">{percentage()}%</span>
      <span class="current">{currentDisplay}<span class="unit">A</span></span>
    </div>
  </div>
  <div class="bar-track">
    <div class="bar-fill" style="width: {percentage()}%; background: {barColor()}"></div>
  </div>
</div>

<style>
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .charging-badge {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    font-weight: 600;
    color: var(--blue);
    padding: 2px 8px;
    background: var(--blue-dim);
    border-radius: 100px;
  }

  .charging-badge svg {
    width: 12px;
    height: 12px;
  }

  .card-body {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 10px;
  }

  .main-value {
    display: flex;
    align-items: baseline;
  }

  .meta {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 2px;
  }

  .pct {
    font-size: 18px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  .current {
    font-size: 13px;
    color: var(--text-secondary);
    font-variant-numeric: tabular-nums;
  }

  .bar-track {
    height: 6px;
    background: var(--border);
    border-radius: 3px;
    overflow: hidden;
  }

  .bar-fill {
    height: 100%;
    border-radius: 3px;
    transition: width 0.5s ease, background 0.5s ease;
  }
</style>
