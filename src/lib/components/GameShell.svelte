<script>
  import SoundToggle from '$lib/components/SoundToggle.svelte';
  import { t } from '$lib/stores/locale';

  let { backHref = '/', title = '', children } = $props();
</script>

<div class="shell">
  <header class="bar">
    <a class="icon-btn" href={backHref} aria-label={$t('back')}>←</a>
    <div class="heading">
      <span class="kicker">Kids Games 5–8</span>
      <h1>{title}</h1>
    </div>
    <SoundToggle />
  </header>

  <main class="content">
    {@render children()}
  </main>
</div>

<style>
  .shell {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    overflow: hidden;
  }
  .bar {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: calc(14px + var(--safe-top)) calc(18px + var(--safe-right)) 10px calc(18px + var(--safe-left));
    flex: 0 0 auto;
  }
  .heading {
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
    flex: 1;
  }
  .kicker {
    color: var(--muted);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
  }
  h1 {
    font-size: clamp(20px, 4vw, 28px);
    font-weight: 800;
    letter-spacing: -0.4px;
    line-height: 1.05;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .content {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: 8px calc(18px + var(--safe-right)) calc(30px + var(--safe-bottom)) calc(18px + var(--safe-left));
    scrollbar-width: thin;
    scrollbar-color: rgba(125, 211, 252, 0.35) transparent;
  }
</style>
