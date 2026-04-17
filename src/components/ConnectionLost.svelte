<script>
  let { message } = $props();
</script>

<div class="lost">
  <div class="icon">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
    </svg>
  </div>
  <h2>Connection Lost</h2>
  <p>{message}</p>
  <p class="hint">Retrying automatically…</p>
</div>

<style>
  .lost {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 60px 24px;
    text-align: center;
  }

  .icon {
    width: 56px;
    height: 56px;
    color: var(--red);
    opacity: 0.6;
  }

  h2 {
    font-size: 20px;
    font-weight: 700;
    color: var(--text);
  }

  p {
    font-size: 14px;
    color: var(--text-secondary);
    max-width: 280px;
  }

  .hint {
    font-size: 12px;
    color: var(--text-dim);
    margin-top: 8px;
  }
</style>
