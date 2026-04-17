<script>
  let { status } = $props();

  const solColors = {
    FIX: 'var(--green)',
    FLOAT: 'var(--amber)',
    INVALID: 'var(--red)',
  };

  let solColor = $derived(solColors[status?.gpsSolutionName] || 'var(--text-secondary)');
</script>

<div class="card">
  <div class="card-header">
    <span class="label">GPS</span>
    <span class="sol-badge" style="color: {solColor}; background: color-mix(in srgb, {solColor} 15%, transparent);">
      {status?.gpsSolutionName ?? '--'}
    </span>
  </div>

  <div class="metrics">
    <div class="metric">
      <span class="metric-value">{status?.satellites ?? '--'}</span>
      <span class="metric-label">SVs</span>
    </div>
    <div class="divider"></div>
    <div class="metric">
      <span class="metric-value">{status?.satellitesDgps ?? '--'}</span>
      <span class="metric-label">DGPS</span>
    </div>
    <div class="divider"></div>
    <div class="metric">
      <span class="metric-value">{status?.gpsAccuracy?.toFixed(2) ?? '--'}</span>
      <span class="metric-label">Acc (m)</span>
    </div>
    <div class="divider"></div>
    <div class="metric">
      <span class="metric-value">{status?.dgpsAge?.toFixed(0) ?? '--'}</span>
      <span class="metric-label">Age (s)</span>
    </div>
  </div>

  <div class="position">
    <span class="pos-label">Position</span>
    <span class="pos-value">
      {status?.x?.toFixed(2) ?? '--'}, {status?.y?.toFixed(2) ?? '--'}
    </span>
  </div>
</div>

<style>
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .sol-badge {
    font-size: 11px;
    font-weight: 700;
    padding: 3px 10px;
    border-radius: 100px;
    letter-spacing: 0.04em;
  }

  .metrics {
    display: flex;
    align-items: center;
    gap: 0;
  }

  .metric {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }

  .metric-value {
    font-size: 20px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  .metric-label {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-secondary);
  }

  .divider {
    width: 1px;
    height: 28px;
    background: var(--border);
  }

  .position {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 12px;
    padding-top: 10px;
    border-top: 1px solid var(--border);
  }

  .pos-label {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-secondary);
  }

  .pos-value {
    font-size: 13px;
    font-variant-numeric: tabular-nums;
    color: var(--text-secondary);
  }
</style>
