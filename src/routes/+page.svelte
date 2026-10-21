<script>
  import { onMount } from 'svelte';
  import { t, locale, setLocale, LOCALES } from '$lib/stores/locale';
  import { loadLevel, loadMastered, MAX_LEVEL } from '$lib/ladder/progress.js';
  import SoundToggle from '$lib/components/SoundToggle.svelte';

  let showSettings = $state(false);
  let progress = $state({ level: 1, mastered: false });

  const dots = Array.from({ length: MAX_LEVEL }, (_, i) => i + 1);

  onMount(() => {
    progress = {
      level: loadLevel('frost-breaker'),
      mastered: loadMastered('frost-breaker'),
    };
  });
</script>

<svelte:head>
  <title>{$t('appTitle')}</title>
  <meta name="description" content={$t('tagline')} />
</svelte:head>

<div class="hub">
  <header class="hero">
    <span class="pill">{$t('bigKids')} · 6–10</span>
    <h1>{$t('appTitle')}</h1>
    <p>{$t('tagline')}</p>
  </header>

  <main class="grid">
    <a class="tile frost" href="/games/frost-breaker">
      {#if progress.mastered}<span class="cap" aria-hidden="true">🎓</span>{/if}
      <span class="tileicon" aria-hidden="true">❄️</span>
      <span class="tilename">{$t('frostName')}</span>
      <span class="tiledesc">{$t('frostDesc')}</span>
      <span class="mini" aria-hidden="true">
        {#each dots as n}
          <span
            class="dot"
            class:done={progress.level > n}
            class:current={progress.level === n}
            class:mastered={progress.mastered}
          ></span>
        {/each}
      </span>
    </a>

    <div class="tile soon">
      <span class="tileicon" aria-hidden="true">✨</span>
      <span class="tilename">{$t('comingSoon')}</span>
    </div>
  </main>

  <button
    class="settings-trigger icon-btn"
    type="button"
    aria-label={$t('settings')}
    onclick={() => (showSettings = true)}
  >
    ⚙️
  </button>

  {#if showSettings}
    <div class="settings-backdrop" role="presentation" onclick={() => (showSettings = false)}></div>
    <div class="settings-panel glass" role="dialog" aria-modal="true" aria-label={$t('settings')}>
      <h2>{$t('settings')}</h2>

      <div class="setting-row">
        <span>{$t('sound')}</span>
        <SoundToggle />
      </div>

      <div class="setting-col">
        <span>{$t('language')}</span>
        <div class="langs">
          {#each LOCALES as l}
            <button
              class="lang"
              class:active={$locale === l.id}
              type="button"
              onclick={() => setLocale(l.id)}
            >
              {l.label}
            </button>
          {/each}
        </div>
      </div>

      <button class="btn primary" type="button" onclick={() => (showSettings = false)}>
        {$t('done')}
      </button>
    </div>
  {/if}
</div>

<style>
  .hub {
    min-height: 100%;
    max-width: 980px;
    margin: 0 auto;
    padding: calc(26px + var(--safe-top)) calc(18px + var(--safe-right)) calc(110px + var(--safe-bottom))
      calc(18px + var(--safe-left));
    display: flex;
    flex-direction: column;
    gap: 24px;
    overflow-y: auto;
    height: 100%;
    scrollbar-width: thin;
    scrollbar-color: rgba(125, 211, 252, 0.35) transparent;
  }
  .hero {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 10px;
    padding: 26px 12px 4px;
  }
  .hero h1 {
    font-size: clamp(38px, 8vw, 64px);
    letter-spacing: -1.6px;
    line-height: 1;
    text-shadow: 0 0 34px rgba(125, 211, 252, 0.28);
  }
  .hero p {
    color: var(--ink-soft);
    font-size: clamp(15px, 2.4vw, 18px);
    font-weight: 550;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 18px;
    width: 100%;
    max-width: 760px;
    margin: 0 auto;
  }
  @media (max-width: 620px) {
    .grid {
      grid-template-columns: 1fr;
    }
  }
  .tile {
    position: relative;
    min-height: 250px;
    padding: 26px 22px 22px;
    border-radius: 28px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    text-align: center;
    border: 1px solid var(--line);
    background: linear-gradient(165deg, rgba(12, 42, 65, 0.86), rgba(5, 20, 34, 0.82));
    box-shadow:
      0 20px 50px rgba(0, 0, 0, 0.34),
      inset 0 1px 0 rgba(255, 255, 255, 0.06);
    transition:
      transform 0.18s var(--ease),
      border-color 0.18s ease,
      box-shadow 0.18s ease;
    overflow: hidden;
  }
  .tile::after {
    content: '';
    position: absolute;
    inset: -40% -20% auto;
    height: 60%;
    background: radial-gradient(ellipse at 50% 0%, rgba(125, 211, 252, 0.2), transparent 70%);
    pointer-events: none;
  }
  .tile.frost:hover {
    transform: translateY(-4px);
    border-color: rgba(125, 211, 252, 0.5);
    box-shadow:
      0 26px 60px rgba(0, 0, 0, 0.4),
      0 0 32px rgba(125, 211, 252, 0.12);
  }
  .tile:active {
    transform: scale(0.985);
  }
  .tileicon {
    font-size: 68px;
    line-height: 1;
    filter: drop-shadow(0 0 16px rgba(125, 211, 252, 0.5));
  }
  .tilename {
    font-size: 28px;
    font-weight: 800;
    letter-spacing: -0.6px;
  }
  .tiledesc {
    max-width: 300px;
    color: var(--ink-soft);
    font-size: 14px;
    line-height: 1.4;
  }
  .cap {
    position: absolute;
    top: 14px;
    right: 16px;
    font-size: 22px;
    filter: drop-shadow(0 0 8px rgba(251, 191, 36, 0.6));
  }
  .mini {
    display: flex;
    gap: 4px;
    margin-top: 8px;
  }
  .dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.16);
  }
  .dot.done {
    background: var(--mint);
  }
  .dot.current {
    background: var(--cyan);
    box-shadow: 0 0 6px var(--cyan);
  }
  .dot.mastered {
    background: var(--gold);
  }
  .soon {
    border-style: dashed;
    opacity: 0.68;
    justify-content: center;
    gap: 12px;
  }
  .soon .tileicon {
    font-size: 46px;
    filter: none;
  }
  .soon .tilename {
    font-size: 16px;
    font-weight: 650;
    color: var(--ink-soft);
    max-width: 240px;
  }

  .settings-trigger {
    position: fixed;
    right: calc(18px + var(--safe-right));
    bottom: calc(20px + var(--safe-bottom));
    z-index: 30;
  }
  .settings-backdrop {
    position: fixed;
    inset: 0;
    z-index: 40;
    background: rgba(1, 7, 14, 0.6);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
  }
  .settings-panel {
    position: fixed;
    z-index: 41;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: min(520px, calc(100vw - 32px));
    padding: 24px;
    border-radius: 26px;
    display: flex;
    flex-direction: column;
    gap: 18px;
  }
  .settings-panel h2 {
    font-size: 24px;
    letter-spacing: -0.4px;
  }
  .setting-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    font-size: 15px;
    font-weight: 650;
    color: var(--ink-soft);
  }
  .setting-col {
    display: flex;
    flex-direction: column;
    gap: 9px;
    font-size: 15px;
    font-weight: 650;
    color: var(--ink-soft);
  }
  .langs {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }
  .lang {
    min-height: 44px;
    border-radius: 12px;
    border: 1px solid var(--line);
    background: rgba(6, 24, 40, 0.7);
    color: var(--ink-soft);
    font-size: 14px;
    font-weight: 750;
  }
  .lang.active {
    border-color: var(--cyan);
    color: #04202e;
    background: linear-gradient(180deg, #a8eeff, #5eead4);
    box-shadow: 0 0 18px rgba(125, 211, 252, 0.28);
  }
</style>
