<script>
  import { sendControl } from '../lib/api.js';

  let { status } = $props();
  let busy = $state(false);
  let feedback = $state(null);

  let isMowing = $derived(status?.operation === 1);
  let isCharging = $derived(status?.operation === 2);
  let isDocking = $derived(status?.operation === 4);

  async function exec(action, params = {}) {
    busy = true;
    feedback = null;
    try {
      await sendControl(action, params);
      feedback = { type: 'ok', text: `${action} sent` };
    } catch (e) {
      feedback = { type: 'error', text: e.message };
    } finally {
      busy = false;
      setTimeout(() => feedback = null, 3000);
    }
  }
</script>

<div class="control-panel fade-in">
  <h2 class="section-title">Quick Actions</h2>

  <div class="action-grid">
    <button
      class="action-btn primary"
      disabled={busy || isMowing}
      onclick={() => exec('mow', { speed: 0.2, restart: false })}
    >
      <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="8,5 19,12 8,19"/></svg>
      <span>Mow</span>
    </button>

    <button
      class="action-btn danger"
      disabled={busy}
      onclick={() => exec('stop')}
    >
      <svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
      <span>Stop</span>
    </button>

    <button
      class="action-btn accent"
      disabled={busy || isDocking || isCharging}
      onclick={() => exec('dock')}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
      <span>Dock</span>
    </button>

    <button
      class="action-btn subtle"
      disabled={busy}
      onclick={() => exec('toggleMow', { on: !isMowing })}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
      <span>{isMowing ? 'Blade Off' : 'Blade On'}</span>
    </button>
  </div>

  <h2 class="section-title">Navigation</h2>

  <div class="action-grid narrow">
    <button
      class="action-btn subtle"
      disabled={busy}
      onclick={() => exec('skipPoint')}
    >
      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M5 5v14l11-7zm14 0v14h-2V5z"/></svg>
      <span>Skip Point</span>
    </button>
  </div>

  <h2 class="section-title">System</h2>

  <div class="action-grid narrow">
    <button
      class="action-btn subtle"
      disabled={busy}
      onclick={() => exec('rebootGps')}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 4v6h6M23 20v-6h-6"/><path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/></svg>
      <span>GPS Reboot</span>
    </button>
    <button
      class="action-btn danger-subtle"
      disabled={busy}
      onclick={() => exec('reboot')}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 4v6h6M23 20v-6h-6"/><path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/></svg>
      <span>Reboot</span>
    </button>
  </div>

  {#if feedback}
    <div class="feedback" class:error={feedback.type === 'error'}>
      {feedback.text}
    </div>
  {/if}
</div>

<style>
  .control-panel {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .section-title {
    font-size: 13px;
    font-weight: 700;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin-top: 8px;
  }

  .action-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .action-grid.narrow {
    grid-template-columns: 1fr 1fr;
  }

  .action-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 20px 12px;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--bg-card);
    color: var(--text);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
    -webkit-tap-highlight-color: transparent;
  }

  .action-btn svg {
    width: 28px;
    height: 28px;
  }

  .action-btn:active:not(:disabled) {
    transform: scale(0.96);
  }

  .action-btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  .action-btn.primary {
    background: var(--green-dim);
    border-color: color-mix(in srgb, var(--green) 30%, transparent);
    color: var(--green);
  }
  .action-btn.primary:active:not(:disabled) {
    background: color-mix(in srgb, var(--green) 25%, var(--bg-card));
  }

  .action-btn.danger {
    background: var(--red-dim);
    border-color: color-mix(in srgb, var(--red) 30%, transparent);
    color: var(--red);
  }
  .action-btn.danger:active:not(:disabled) {
    background: color-mix(in srgb, var(--red) 25%, var(--bg-card));
  }

  .action-btn.accent {
    background: var(--amber-dim);
    border-color: color-mix(in srgb, var(--amber) 30%, transparent);
    color: var(--amber);
  }
  .action-btn.accent:active:not(:disabled) {
    background: color-mix(in srgb, var(--amber) 25%, var(--bg-card));
  }

  .action-btn.subtle {
    color: var(--text-secondary);
  }
  .action-btn.subtle:active:not(:disabled) {
    background: var(--bg-card-hover);
  }

  .action-btn.danger-subtle {
    color: var(--red);
  }
  .action-btn.danger-subtle:active:not(:disabled) {
    background: var(--red-dim);
  }

  .feedback {
    text-align: center;
    font-size: 13px;
    font-weight: 600;
    padding: 8px;
    border-radius: var(--radius-sm);
    color: var(--green);
    background: var(--green-dim);
    animation: fade-in 0.2s ease-out;
  }

  .feedback.error {
    color: var(--red);
    background: var(--red-dim);
  }
</style>
