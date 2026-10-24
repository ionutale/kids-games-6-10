<script>
  import { onMount } from 'svelte';
  import GameShell from '$lib/components/GameShell.svelte';
  import { t } from '$lib/stores/locale';
  import { AURORA_LEVELS, AURORA_LEVEL_COUNT } from '$lib/aurora/levels.js';
  import {
    auroraStarsTotal,
    emptyAuroraProgress,
    isAuroraComplete,
    loadAuroraProgress,
    nextAuroraLevel,
  } from '$lib/aurora/progress.js';

  let progress = $state(emptyAuroraProgress());
  const current = $derived(nextAuroraLevel(progress));
  const totalStars = $derived(auroraStarsTotal(progress));
  const mastered = $derived(isAuroraComplete(progress));

  onMount(() => {
    progress = loadAuroraProgress();
  });
</script>

<svelte:head>
  <title>{$t('auroraName')} · {$t('appTitle')}</title>
</svelte:head>

<GameShell backHref="/" title={$t('auroraName')}>
  <div class="landing">
    <section class="hero glass">
      <span class="heroicon" aria-hidden="true">🪞</span>
      <div class="herotext">
        <span class="pill">
          {$t('auroraWorld1')} · {$t('currentLevel')}
          {#if mastered}· {$t('mastered')}{/if}
        </span>
        <h2>{$t('auroraName')}</h2>
        <p>{$t('auroraDesc')}</p>
      </div>
      <a class="btn primary hero-play" href={`/games/aurora-mirrors/play/${current}`}>
        ▶ {$t('playLevel', { n: current })}
      </a>
    </section>

    <section class="levels glass">
      <div class="sectionhead">
        <div>
          <h3>{$t('auroraWorld1')}</h3>
          <p>{$t('auroraGoal')}</p>
        </div>
        <span class="starscore">{totalStars} / {AURORA_LEVEL_COUNT * 3} ★</span>
      </div>

      <div class="levelgrid">
        {#each AURORA_LEVELS as level (level.id)}
          <a
            class="level"
            class:done={progress.stars[level.id - 1] > 0}
            href={`/games/aurora-mirrors/play/${level.id}`}
          >
            <span class="num">{String(level.slot).padStart(2, '0')}</span>
            <span class="lname">{$t(level.nameKey)}</span>
            <span class="stars" aria-label={`${progress.stars[level.id - 1]} / 3 stars`}>
              {#each [1, 2, 3] as star (star)}
                <span class:on={star <= progress.stars[level.id - 1]} aria-hidden="true">★</span>
              {/each}
            </span>
            <span class="par">{$t('auroraPar')} {level.par}</span>
          </a>
        {/each}
      </div>
    </section>

    <section class="howrow">
      <article class="howcard glass">
        <span class="howicon" aria-hidden="true">💡</span>
        <h3>{$t('howToPlay')}</h3>
        <p>{$t('auroraHowBody')}</p>
      </article>
      <article class="howcard glass">
        <span class="howicon" aria-hidden="true">⭐</span>
        <h3>{$t('auroraGoal')}</h3>
        <p>{$t('auroraMore')}</p>
      </article>
    </section>
  </div>
</GameShell>

<style>
  .landing {
    width: 100%;
    max-width: 900px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .hero {
    display: flex;
    align-items: center;
    gap: 22px;
    padding: 24px;
    border-radius: var(--radius-lg);
    border-color: rgba(94, 234, 212, 0.26);
  }
  .heroicon {
    font-size: 66px;
    line-height: 1;
    filter: drop-shadow(0 0 22px rgba(94, 234, 212, 0.55));
    flex: 0 0 auto;
  }
  .herotext {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
    flex: 1;
    min-width: 0;
  }
  .herotext .pill {
    text-transform: none;
    letter-spacing: 0.2px;
  }
  .hero h2 {
    font-size: clamp(30px, 5vw, 44px);
    letter-spacing: -1.1px;
    line-height: 1;
  }
  .hero p {
    color: var(--ink-soft);
    font-size: 15px;
    line-height: 1.45;
    max-width: 460px;
  }
  .hero-play {
    flex: 0 0 auto;
    padding: 14px 22px;
    font-size: 17px;
  }
  @media (max-width: 680px) {
    .hero {
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 22px 18px;
    }
    .herotext {
      align-items: center;
    }
    .hero-play {
      width: 100%;
    }
  }
  .levels {
    padding: 18px;
    border-radius: var(--radius-lg);
  }
  .sectionhead {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 12px;
  }
  .sectionhead h3 {
    font-size: 18px;
    letter-spacing: -0.2px;
  }
  .sectionhead p {
    color: var(--muted);
    font-size: 11.5px;
    line-height: 1.4;
    margin-top: 3px;
  }
  .starscore {
    color: var(--gold);
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.8px;
    white-space: nowrap;
    padding-top: 2px;
  }
  .levelgrid {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 8px;
  }
  @media (max-width: 680px) {
    .levelgrid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }
  @media (max-width: 460px) {
    .levelgrid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  .level {
    min-height: 104px;
    padding: 11px 10px;
    border-radius: 15px;
    border: 1px solid rgba(157, 228, 255, 0.16);
    background: linear-gradient(155deg, rgba(94, 234, 212, 0.08), rgba(5, 20, 34, 0.56));
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    gap: 3px;
    transition:
      transform 0.14s var(--ease),
      border-color 0.14s ease,
      background 0.14s ease;
  }
  .level:hover {
    transform: translateY(-2px);
    border-color: rgba(94, 234, 212, 0.55);
    background: linear-gradient(155deg, rgba(94, 234, 212, 0.14), rgba(5, 20, 34, 0.6));
  }
  .level:active {
    transform: scale(0.97);
  }
  .level.done {
    border-color: rgba(94, 234, 212, 0.34);
  }
  .num {
    color: var(--muted);
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 1px;
  }
  .lname {
    font-size: 12.5px;
    font-weight: 750;
    line-height: 1.15;
  }
  .stars {
    display: flex;
    gap: 1px;
    margin-top: 2px;
  }
  .stars span {
    color: rgba(255, 255, 255, 0.15);
    font-size: 11px;
    line-height: 1;
  }
  .stars span.on {
    color: var(--gold);
    text-shadow: 0 0 7px rgba(251, 191, 36, 0.55);
  }
  .par {
    color: var(--muted);
    font-size: 9px;
    font-weight: 650;
  }
  .howrow {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }
  @media (max-width: 620px) {
    .howrow {
      grid-template-columns: 1fr;
    }
  }
  .howcard {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 16px;
    border-radius: var(--radius);
  }
  .howicon {
    font-size: 24px;
    line-height: 1;
  }
  .howcard h3 {
    font-size: 14px;
  }
  .howcard p {
    color: var(--ink-soft);
    font-size: 12.5px;
    line-height: 1.45;
  }
</style>
