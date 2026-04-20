<script>
  let { components = [], lastUpdate = null } = $props();

  function getChannelColor(channel) {
    if (channel === 'alpha') return 'var(--blue)';
    return 'var(--green)';
  }

  function getChannelBgColor(channel) {
    if (channel === 'alpha') return 'var(--blue-dim)';
    return 'var(--green-dim)';
  }

  function getChannelLabel(channel) {
    if (channel === 'alpha') return 'Alpha';
    return 'Release';
  }

  function openLink(url) {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }
</script>

<div class="card">
  <div class="card-header">
    <span class="label">Components</span>
  </div>
  <div class="card-body">
    {#if components.length === 0}
      <div class="no-data">No component data available</div>
    {:else}
      <div class="components-list">
        {#each components as component (component.name)}
          <div class="component-item">
            <div class="component-info">
              <div class="component-name">{component.name}</div>
              <div class="component-version-row">
                <span class="version">{component.version}</span>
                <span
                  class="channel-badge"
                  style="--channel-color: {getChannelColor(component.channel)}; --channel-bg: {getChannelBgColor(component.channel)}"
                >
                  {getChannelLabel(component.channel)}
                </span>
                {#if component.sha}
                  <span class="sha">#{component.sha}</span>
                {/if}
              </div>
            </div>
            {#if component.link}
              <button
                class="link-button"
                onclick={() => openLink(component.link)}
                title="View on GitHub"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </button>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
    {#if lastUpdate}
      <div class="last-update">
        Updated: {new Date(lastUpdate).toLocaleTimeString()}
      </div>
    {/if}
  </div>
</div>

<style>
  .card-body {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .no-data {
    color: var(--text-dim);
    font-size: 13px;
    text-align: center;
    padding: 16px;
  }

  .components-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .component-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px;
    border: 1px solid var(--border-light);
    border-radius: var(--radius-sm);
    background: rgba(255, 255, 255, 0.02);
    transition: background 0.15s ease;
  }

  .component-item:active {
    background: rgba(255, 255, 255, 0.05);
  }

  .component-info {
    flex: 1;
    min-width: 0;
  }

  .component-name {
    font-size: 13px;
    font-weight: 600;
    color: var(--text);
    margin-bottom: 4px;
  }

  .component-version-row {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .version {
    font-size: 12px;
    font-family: 'Courier New', monospace;
    color: var(--text-secondary);
    font-weight: 500;
  }

  .channel-badge {
    display: inline-flex;
    align-items: center;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    background: var(--channel-bg);
    color: var(--channel-color);
  }

  .sha {
    font-size: 11px;
    font-family: 'Courier New', monospace;
    color: var(--text-dim);
  }

  .link-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .link-button:hover {
    color: var(--blue);
    border-color: var(--blue);
  }

  .link-button:active {
    background: var(--blue-dim);
  }

  .last-update {
    font-size: 11px;
    color: var(--text-dim);
    text-align: center;
    margin-top: 4px;
  }
</style>
