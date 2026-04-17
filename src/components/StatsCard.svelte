<script>
  let { stats } = $props();
  let showDiag = $state(false);

  function formatDuration(seconds) {
    if (!seconds) return '0m';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  }

  const diagNav = $derived([
    { label: 'IMU recoveries', value: stats.imuRecoveries },
    { label: 'GPS check errors', value: stats.gpsCheckErrors },
    { label: 'DGPS check errors', value: stats.dgpsCheckErrors },
    { label: 'Float→Fix', value: stats.floatToFix },
    { label: 'GPS no motion', value: stats.gpsNoSpeed },
    { label: 'GPS motion timeout', value: stats.gpsMotionTimeout },
    { label: 'GPS jumps', value: stats.gpsJumps },
  ]);

  const diagSafety = $derived([
    { label: 'Bumper hits', value: stats.bumperCount },
    { label: 'Lift events', value: stats.liftCount },
    { label: 'Sonar triggers', value: stats.sonarCount },
    { label: 'Mow motor recovery', value: stats.mowMotorRecovery },
    { label: 'Obstacles', value: stats.mowObstacles },
  ]);

  const diagTotal = $derived(
    diagNav.reduce((s, d) => s + (d.value || 0), 0) +
    diagSafety.reduce((s, d) => s + (d.value || 0), 0)
  );
</script>

<div class="card">
  <div class="card-header">
    <span class="label">Session Stats</span>
  </div>

  <div class="stat-grid">
    <div class="stat">
      <span class="stat-value">{formatDuration(stats.mowTime)}</span>
      <span class="stat-label">Mow time</span>
    </div>
    <div class="stat">
      <span class="stat-value">{stats.mowDistance?.toFixed(0) ?? 0}<span class="unit">m</span></span>
      <span class="stat-label">Distance</span>
    </div>
    <div class="stat">
      <span class="stat-value">{stats.tempMin?.toFixed(0)}° / {stats.tempMax?.toFixed(0)}°</span>
      <span class="stat-label">Temp min/max</span>
    </div>
    <div class="stat">
      <span class="stat-value">{formatDuration(stats.chargeTime)}</span>
      <span class="stat-label">Charge time</span>
    </div>
    <div class="stat">
      <span class="stat-value">{formatDuration(stats.mowFixTime)}</span>
      <span class="stat-label">RTK Fix time</span>
    </div>
    <div class="stat">
      <span class="stat-value">{formatDuration(stats.mowFloatTime)}</span>
      <span class="stat-label">RTK Float time</span>
    </div>
  </div>

  <button class="diag-toggle" onclick={() => showDiag = !showDiag}>
    <span>Diagnostics</span>
    {#if diagTotal > 0}
      <span class="diag-badge">{diagTotal}</span>
    {/if}
    <svg class="chevron" class:open={showDiag} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  </button>

  {#if showDiag}
    <div class="diag-section">
      <div class="diag-group-label">Navigation</div>
      <div class="diag-grid">
        {#each diagNav as d}
          <div class="diag-row" class:warn={d.value > 0}>
            <span class="diag-label">{d.label}</span>
            <span class="diag-value">{d.value ?? 0}</span>
          </div>
        {/each}
      </div>
      <div class="diag-group-label">Safety</div>
      <div class="diag-grid">
        {#each diagSafety as d}
          <div class="diag-row" class:warn={d.value > 0}>
            <span class="diag-label">{d.label}</span>
            <span class="diag-value">{d.value ?? 0}</span>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .card-header {
    margin-bottom: 12px;
  }

  .stat-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 12px;
  }

  .stat {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .stat-value {
    font-size: 16px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  .stat-label {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-secondary);
  }

  .diag-toggle {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    margin-top: 12px;
    padding: 8px 0 0;
    border: none;
    border-top: 1px solid var(--border);
    background: none;
    color: var(--text-dim);
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    cursor: pointer;
  }

  .diag-badge {
    background: var(--amber, #f59e0b);
    color: #000;
    font-size: 10px;
    font-weight: 700;
    padding: 1px 6px;
    border-radius: 8px;
    min-width: 18px;
    text-align: center;
  }

  .chevron {
    width: 16px;
    height: 16px;
    margin-left: auto;
    transition: transform 0.2s;
  }

  .chevron.open {
    transform: rotate(180deg);
  }

  .diag-section {
    padding-top: 8px;
  }

  .diag-group-label {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-dim);
    margin: 8px 0 4px;
  }

  .diag-grid {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .diag-row {
    display: flex;
    justify-content: space-between;
    padding: 3px 0;
    font-size: 12px;
    color: var(--text-dim);
  }

  .diag-row.warn {
    color: var(--amber, #f59e0b);
  }

  .diag-label {
    font-weight: 500;
  }

  .diag-value {
    font-variant-numeric: tabular-nums;
    font-weight: 600;
  }
</style>
