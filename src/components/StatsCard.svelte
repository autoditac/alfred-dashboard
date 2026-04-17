<script>
  let { stats } = $props();

  function formatDuration(seconds) {
    if (!seconds) return '0m';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  }
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
      <span class="stat-value">{stats.mowObstacles}</span>
      <span class="stat-label">Obstacles</span>
    </div>
    <div class="stat">
      <span class="stat-value">{stats.gpsJumps}</span>
      <span class="stat-label">GPS jumps</span>
    </div>
  </div>
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
</style>
