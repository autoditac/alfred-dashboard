<script>
  let { oldVersion, newVersion, onAck } = $props();
  let okBtn;

  $effect(() => {
    // Focus the primary action once the modal is mounted so the user can
    // confirm with Enter/Space without reaching for the mouse.
    okBtn?.focus();
  });

  function fmt(v) {
    if (!v) return '—';
    const fw = v.mcuFwName || v.mcuFwVer ? ` · ${v.mcuFwName ?? ''} ${v.mcuFwVer ?? ''}`.trim() : '';
    return `${v.version ?? '?'}${fw}`;
  }
</script>

<div class="backdrop" role="dialog" aria-modal="true" aria-labelledby="fwu-title">
  <div class="modal">
    <div class="icon">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
        <polyline points="21 3 21 8 16 8"/>
        <polyline points="3 21 3 16 8 16"/>
      </svg>
    </div>
    <h2 id="fwu-title">Firmware updated</h2>
    <div class="versions">
      <div class="row">
        <span class="label">Previous</span>
        <span class="val old">{fmt(oldVersion)}</span>
      </div>
      <div class="arrow">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <polyline points="5 12 12 19 19 12"/>
        </svg>
      </div>
      <div class="row">
        <span class="label">Current</span>
        <span class="val new">{fmt(newVersion)}</span>
      </div>
    </div>
    <button class="ok" onclick={onAck} bind:this={okBtn}>OK</button>
  </div>
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.65);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 16px;
    animation: fade-in 0.2s ease;
  }

  .modal {
    background: var(--card-bg);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 24px 20px;
    width: 100%;
    max-width: 360px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    animation: pop-in 0.25s cubic-bezier(0.2, 0.8, 0.3, 1.2);
  }

  .icon {
    width: 40px;
    height: 40px;
    color: var(--green);
  }

  .icon svg {
    width: 100%;
    height: 100%;
  }

  h2 {
    font-size: 18px;
    font-weight: 700;
    letter-spacing: -0.01em;
    margin: 0;
  }

  .versions {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 6px;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 10px;
    padding: 12px 14px;
  }

  .row {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .label {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-dim);
    font-weight: 600;
  }

  .val {
    font-size: 13px;
    font-family: var(--font-mono, ui-monospace, monospace);
    color: var(--text);
    word-break: break-all;
  }

  .val.old {
    color: var(--text-secondary);
    text-decoration: line-through;
    text-decoration-color: var(--text-dim);
  }

  .val.new {
    color: var(--green);
    font-weight: 600;
  }

  .arrow {
    align-self: center;
    width: 16px;
    height: 16px;
    color: var(--text-dim);
  }

  .arrow svg {
    width: 100%;
    height: 100%;
  }

  .ok {
    margin-top: 4px;
    width: 100%;
    padding: 12px;
    border: none;
    border-radius: 10px;
    background: var(--green);
    color: #000;
    font-size: 15px;
    font-weight: 700;
    letter-spacing: 0.02em;
    cursor: pointer;
    transition: filter 0.15s ease, transform 0.05s ease;
  }

  .ok:hover {
    filter: brightness(1.05);
  }

  .ok:active {
    transform: scale(0.98);
  }

  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes pop-in {
    from { opacity: 0; transform: scale(0.92); }
    to { opacity: 1; transform: scale(1); }
  }
</style>
