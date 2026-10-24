<script>
  import { onMount } from 'svelte';
  import { t } from '$lib/stores/locale';
  import { WORLDS, getWorld } from '$lib/frost-breaker/levels.js';
  import {
    emptyProgress,
    isCampaignMastered,
    isWorldComplete,
    isWorldUnlocked,
    loadProgress,
    nextLevel,
  } from '$lib/frost-breaker/progress.js';
  import { AURORA_LEVELS } from '$lib/aurora/levels.js';
  import { emptyAuroraProgress, loadAuroraProgress } from '$lib/aurora/progress.js';

  let progress = $state(emptyProgress());
  let auroraProgress = $state(emptyAuroraProgress());
  const currentWorldId = $derived(getWorld(nextLevel(progress)).id);
  const mastered = $derived(isCampaignMastered(progress));

  onMount(() => {
    progress = loadProgress();
    auroraProgress = loadAuroraProgress();
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
      {#if mastered}<span class="cap" aria-hidden="true">🎓</span>{/if}
      <span class="tileicon" aria-hidden="true">❄️</span>
      <span class="tilename">{$t('frostName')}</span>
      <span class="tiledesc">{$t('frostDesc')}</span>
      <span class="mini" aria-hidden="true">
        {#each WORLDS as world (world.id)}
          <span
            class="dot"
            class:done={isWorldComplete(progress, world.id) && !mastered}
            class:current={currentWorldId === world.id && !mastered}
            class:locked={!isWorldUnlocked(progress, world.id) && !mastered}
            class:mastered
          ></span>
        {/each}
      </span>
    </a>

    <a class="tile aurora" href="/games/aurora-mirrors">
      <span class="tileicon" aria-hidden="true">🪞</span>
      <span class="tilename">{$t('auroraName')}</span>
      <span class="tiledesc">{$t('auroraDesc')}</span>
      <span class="mini" aria-hidden="true">
        {#each AURORA_LEVELS as level (level.id)}
          <span class="dot" class:done={auroraProgress.stars[level.id - 1] > 0}></span>
        {/each}
      </span>
    </a>
  </main>

  <p class="more">{$t('comingSoon')}</p>

  <a class="settings-trigger icon-btn" href="/settings" aria-label={$t('settings')}>⚙️</a>
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
  .tile.aurora:hover {
    transform: translateY(-4px);
    border-color: rgba(94, 234, 212, 0.5);
    box-shadow:
      0 26px 60px rgba(0, 0, 0, 0.4),
      0 0 32px rgba(94, 234, 212, 0.12);
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
  .dot.locked {
    background: rgba(255, 255, 255, 0.07);
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.14);
  }
  .dot.mastered {
    background: var(--gold);
  }
  .more {
    max-width: 760px;
    margin: -8px auto 0;
    color: var(--muted);
    font-size: 11px;
    font-weight: 650;
    letter-spacing: 0.4px;
    text-align: center;
  }

  .settings-trigger {
    position: fixed;
    right: calc(18px + var(--safe-right));
    bottom: calc(20px + var(--safe-bottom));
    z-index: 30;
  }
</style>
