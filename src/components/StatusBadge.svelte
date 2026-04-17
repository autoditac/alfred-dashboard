<script>
  let { status } = $props();

  const opColors = {
    IDLE: 'var(--text-secondary)',
    MOW: 'var(--green)',
    CHARGE: 'var(--blue)',
    ERROR: 'var(--red)',
    DOCK: 'var(--amber)',
  };

  let color = $derived(opColors[status?.operationName] || 'var(--text-secondary)');
</script>

{#if status}
  <div class="badge" style="--badge-color: {color}">
    <div class="dot"></div>
    <span class="op-name">{status.operationName}</span>
    {#if status.sensor && status.sensor !== 0}
      <span class="sensor">Sensor: {status.sensor}</span>
    {/if}
  </div>
{/if}

<style>
  .badge {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    background: color-mix(in srgb, var(--badge-color) 10%, var(--bg-card));
    border: 1px solid color-mix(in srgb, var(--badge-color) 25%, transparent);
    border-radius: var(--radius);
  }

  .dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--badge-color);
    flex-shrink: 0;
  }

  .op-name {
    font-size: 15px;
    font-weight: 700;
    color: var(--badge-color);
    letter-spacing: 0.03em;
  }

  .sensor {
    margin-left: auto;
    font-size: 12px;
    color: var(--text-secondary);
    font-variant-numeric: tabular-nums;
  }
</style>
