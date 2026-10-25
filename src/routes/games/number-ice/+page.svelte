<script>
  import { onMount } from 'svelte';
  import GameShell from '$lib/components/GameShell.svelte';
  import { t } from '$lib/stores/locale';
  import {
    NUMBER_ICE_LEVEL_COUNT,
    NUMBER_ICE_WORLDS,
    getNumberIceLevel,
    getNumberIceWorld,
    worldLevels,
  } from '$lib/number-ice/levels.js';
  import {
    emptyNumberIceProgress,
    isNumberIceComplete,
    isNumberIceWorldComplete,
    isNumberIceWorldUnlocked,
    loadNumberIceProgress,
    nextNumberIceLevel,
    numberIceStarsTotal,
    numberIceWorldStars,
  } from '$lib/number-ice/progress.js';

  let progress = $state(emptyNumberIceProgress());
  const current = $derived(nextNumberIceLevel(progress));
  const currentLevel = $derived(getNumberIceLevel(current));
  const currentWorld = $derived(getNumberIceWorld(currentLevel.world));
  const totalStars = $derived(numberIceStarsTotal(progress));
  const mastered = $derived(isNumberIceComplete(progress));

  onMount(() => {
    progress = loadNumberIceProgress();
  });
</script>

<svelte:head>
  <title>{$t('numberIceName')} · {$t('appTitle')}</title>
</svelte:head>

<GameShell backHref="/" title={$t('numberIceName')}>
  <div class="landing">
    <section class="hero glass">
      <span class="heroicon" aria-hidden="true">❄️</span>
      <div class="herotext">
        <span class="pill">
          {$t(currentWorld.nameKey)} · {$t('currentLevel')}
          {#if mastered}· {$t('mastered')}{/if}
        </span>
        <h2>{$t('numberIceName')}</h2>
        <p>{$t('numberIceDesc')}</p>
      </div>
      <a class="btn primary hero-play" href={`/games/number-ice/play/${current}`}>
        ▶ {$t('playLevel', { n: current })}
      </a>
    </section>

    <section class="worlds glass">
      <div class="sectionhead">
        <div>
          <h3>{$t('levelSelect')}</h3>
          <p>{$t('numberIceGoal')}</p>
        </div>
        <span class="starscore">{totalStars} / {NUMBER_ICE_LEVEL_COUNT * 3} ★</span>
      </div>

      <div class="worldgrid">
        {#each NUMBER_ICE_WORLDS as world (world.id)}
          {@const unlocked = isNumberIceWorldUnlocked(progress, world.id)}
          {@const complete = isNumberIceWorldComplete(progress, world.id)}
          {@const isCurrent = currentWorld.id === world.id && !mastered}
          {#if unlocked}
            <a
              class="wcard"
              class:is-current={isCurrent}
              style:--accent={world.accent}
              href={`/games/number-ice/world/${world.id}`}
            >
              <span class="wname">{$t(world.nameKey)}</span>
              <span class="pips" aria-hidden="true">
                {#each worldLevels(world.id) as level (level.id)}
                  <span class:on={progress.stars[level.id - 1] > 0}></span>
                {/each}
              </span>
              <span class="wstars">{numberIceWorldStars(progress, world.id)} / 15 ★</span>
              {#if complete}<span class="badge" aria-hidden="true">🎓</span>{/if}
            </a>
          {:else}
            <div class="wcard locked" style:--accent={world.accent} aria-disabled="true">
              <span class="wname">{$t(world.nameKey)}</span>
              <span class="lockicon" aria-hidden="true">🔒</span>
              <span class="lockmsg">{$t('numberIceLocked')}</span>
            </div>
          {/if}
        {/each}
      </div>
    </section>

    <section class="howrow">
      <article class="howcard glass">
        <span class="howicon" aria-hidden="true">💡</span>
        <h3>{$t('howToPlay')}</h3>
        <p>{$t('numberIceHowBody')}</p>
      </article>
      <article class="howcard glass">
        <span class="howicon" aria-hidden="true">⭐</span>
        <h3>{$t('numberIceGoal')}</h3>
        <p>{$t('numberIceMore')}</p>
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
    border-color: rgba(186, 230, 253, 0.3);
  }
  .heroicon {
    font-size: 66px;
    line-height: 1;
    filter: drop-shadow(0 0 22px rgba(147, 197, 253, 0.6));
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
    min-height: 48px;
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
  .worlds {
    padding: 20px;
    border-radius: var(--radius-lg);
  }
  .sectionhead {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 14px;
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
  .worldgrid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
  }
  @media (max-width: 760px) {
    .worldgrid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (max-width: 460px) {
    .worldgrid {
      grid-template-columns: 1fr;
    }
  }
  .wcard {
    position: relative;
    min-width: 0;
    min-height: 108px;
    padding: 14px 14px 16px;
    border-radius: 18px;
    border: 1px solid color-mix(in srgb, var(--accent) 40%, transparent);
    background: linear-gradient(
      168deg,
      color-mix(in srgb, var(--accent) 10%, rgba(6, 24, 40, 0.62)),
      rgba(5, 20, 34, 0.7)
    );
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    text-align: center;
    transition:
      transform 0.14s var(--ease),
      border-color 0.16s ease,
      box-shadow 0.16s ease;
  }
  .wcard:hover {
    border-color: var(--accent);
    transform: translateY(-2px);
  }
  .wcard:active {
    transform: scale(0.97);
  }
  .wcard.is-current {
    border-color: var(--accent);
    box-shadow:
      0 0 0 2px color-mix(in srgb, var(--accent) 35%, transparent),
      0 0 24px color-mix(in srgb, var(--accent) 35%, transparent);
  }
  .wcard.locked {
    opacity: 0.55;
    filter: grayscale(0.7);
  }
  .wname {
    font-size: 14px;
    font-weight: 800;
    line-height: 1.2;
    letter-spacing: -0.2px;
  }
  .pips {
    display: flex;
    gap: 5px;
  }
  .pips span {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.16);
  }
  .pips span.on {
    background: var(--gold);
    box-shadow: 0 0 6px rgba(251, 191, 36, 0.6);
  }
  .wstars {
    font-size: 11.5px;
    font-weight: 750;
    color: var(--gold);
    letter-spacing: 0.4px;
  }
  .badge {
    position: absolute;
    top: 8px;
    right: 10px;
    font-size: 15px;
    filter: drop-shadow(0 0 8px rgba(251, 191, 36, 0.55));
  }
  .lockicon {
    font-size: 22px;
    line-height: 1;
  }
  .lockmsg {
    font-size: 10.5px;
    font-weight: 650;
    line-height: 1.3;
    color: var(--ink-soft);
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
