<script>
  let { status } = $props();

  let headingDeg = $derived(
    status ? ((status.heading * 180 / Math.PI + 360) % 360).toFixed(0) : '--'
  );

  let lateralErr = $derived(
    status ? (status.lateralError * 100).toFixed(1) : '--'
  );
</script>

<div class="card">
  <div class="card-header">
    <span class="label">Navigation</span>
  </div>

  <div class="metrics">
    <div class="metric">
      <div class="compass" style="--heading: {status?.heading ?? 0}rad">
        <svg viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="18" fill="none" stroke="var(--border)" stroke-width="1"/>
          <line x1="20" y1="20" x2="20" y2="6" stroke="var(--green)" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </div>
      <span class="metric-value">{headingDeg}°</span>
      <span class="metric-label">Heading</span>
    </div>
    <div class="metric">
      <span class="metric-value big">{lateralErr}</span>
      <span class="metric-label">Lat. Error (cm)</span>
    </div>
    <div class="metric">
      <span class="metric-value big">{status?.mowPointIdx ?? '--'}</span>
      <span class="metric-label">Mow Point</span>
    </div>
  </div>
</div>

<style>
  .card-header {
    margin-bottom: 12px;
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
    gap: 4px;
  }

  .metric-value {
    font-size: 16px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  .metric-value.big {
    font-size: 22px;
  }

  .metric-label {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-secondary);
    text-align: center;
  }

  .compass {
    width: 44px;
    height: 44px;
  }

  .compass svg {
    transform: rotate(var(--heading));
    transition: transform 0.5s ease;
  }
</style>
