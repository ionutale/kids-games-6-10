<script>
  import { onMount } from 'svelte';
  import GameShell from '$lib/components/GameShell.svelte';
  import ShapePreview from '$lib/components/ShapePreview.svelte';
  import { t } from '$lib/stores/locale';
  import { WORLDS, getWorld } from '$lib/frost-breaker/levels.js';
  import {
    emptyProgress,
    isCampaignMastered,
    isWorldUnlocked,
    loadProgress,
    nextLevel,
    worldStars,
  } from '$lib/frost-breaker/progress.js';

  let progress = $state(emptyProgress());
  const current = $derived(nextLevel(progress));
  const currentWorld = $derived(getWorld(current));
  const mastered = $derived(isCampaignMastered(progress));

  onMount(() => {
    progress = loadProgress();
  });
</script>

<svelte:head>
  <title>{$t('frostName')} · {$t('appTitle')}</title>
</svelte:head>

<GameShell backHref="/" title={$t('frostName')}>
  <div class="landing">
    <section class="hero glass">
      <span class="heroicon" aria-hidden="true">❄️</span>
      <div class="herotext">
        <span class="pill">
          {$t('currentLevel')} · {$t(currentWorld.nameKey)}{#if mastered}
            · {$t('mastered')}{/if}
        </span>
        <h2>{$t('frostName')}</h2>
        <p>{$t('frostDesc')}</p>
      </div>
      <a class="btn primary hero-play" href={`/games/frost-breaker/play/${current}`}>
        ▶ {$t('playLevel', { n: current })}
      </a>
    </section>

    <section class="worlds glass">
      <div class="sectionhead">
        <h3>{$t('levelSelect')}</h3>
        {#if mastered}<span class="cap" aria-hidden="true">🎓</span>{/if}
      </div>
      <div class="worldgrid">
        {#each WORLDS as world (world.id)}
          {@const unlocked = isWorldUnlocked(progress, world.id)}
          {@const stars = worldStars(progress, world.id)}
          {@const isCurrent = currentWorld.id === world.id}
          {#if unlocked}
            <a
              class="wcard"
              class:is-current={isCurrent}
              href={`/games/frost-breaker/world/${world.id}`}
              style:--accent={world.accent}
            >
              <span class="num">{String(world.id).padStart(2, '0')}</span>
              <span class="wname">{$t(world.nameKey)}</span>
              <span class="shapes" aria-hidden="true">
                {#each world.shapes as shape (shape)}
                  <ShapePreview shapeId={shape} size={64} />
                {/each}
              </span>
              <span class="pips" aria-hidden="true">
                {#each stars as star}
                  <span class="pip" class:on={star > 0} class:gold={star === 3}></span>
                {/each}
              </span>
              {#if stars.every((s) => s === 3)}<span class="badge" aria-hidden="true">🎓</span>{/if}
            </a>
          {:else}
            <div class="wcard locked" aria-disabled="true" style:--accent={world.accent}>
              <span class="num">{String(world.id).padStart(2, '0')}</span>
              <span class="wname">{$t(world.nameKey)}</span>
              <span class="shapes" aria-hidden="true">
                {#each world.shapes as shape (shape)}
                  <ShapePreview shapeId={shape} size={64} />
                {/each}
              </span>
              <span class="lock" aria-hidden="true">🔒</span>
            </div>
          {/if}
        {/each}
      </div>
    </section>

    <section class="how">
      <article class="howcard glass">
        <span class="howicon" aria-hidden="true">🎯</span>
        <h3>{$t('howToPlay')}</h3>
        <p>{$t('howToDrag')}</p>
        <p class="wallhint">{$t('howToWalls')}</p>
      </article>
      <article class="howcard glass">
        <span class="howicon" aria-hidden="true">💎</span>
        <h3>{$t('spike')} · {$t('ghost')} · {$t('copter')} · {$t('split')}</h3>
        <p>{$t('howToCore')}</p>
        <a class="howlink" href="/games/frost-breaker/guide">{$t('podGuide')} →</a>
      </article>
      <article class="howcard glass">
        <span class="howicon" aria-hidden="true">⭐</span>
        <h3>{$t('goal')}</h3>
        <p>{$t('howToStars')}</p>
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
    gap: 18px;
  }
  .hero {
    display: flex;
    align-items: center;
    gap: 24px;
    padding: 26px;
    border-radius: var(--radius-lg);
  }
  .heroicon {
    font-size: 78px;
    line-height: 1;
    filter: drop-shadow(0 0 22px rgba(125, 211, 252, 0.55));
    flex: 0 0 auto;
  }
  .herotext {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 7px;
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
    padding: 15px 26px;
    font-size: 18px;
  }
  @media (max-width: 680px) {
    .hero {
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 24px 18px;
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
    align-items: center;
    gap: 10px;
    margin-bottom: 14px;
  }
  .sectionhead h3 {
    font-size: 18px;
    letter-spacing: -0.2px;
  }
  .cap {
    font-size: 20px;
    filter: drop-shadow(0 0 8px rgba(251, 191, 36, 0.55));
  }
  .worldgrid {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 12px;
  }
  @media (max-width: 860px) {
    .worldgrid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }
  @media (max-width: 560px) {
    .worldgrid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  .wcard {
    position: relative;
    padding: 12px 10px 14px;
    border-radius: 18px;
    border: 1px solid color-mix(in srgb, var(--accent) 42%, transparent);
    background: linear-gradient(
      168deg,
      color-mix(in srgb, var(--accent) 10%, rgba(6, 24, 40, 0.62)),
      rgba(5, 20, 34, 0.7)
    );
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    text-align: center;
    transition:
      transform 0.14s var(--ease),
      border-color 0.16s ease,
      background 0.16s ease;
  }
  .wcard:hover {
    border-color: var(--accent);
    transform: translateY(-2px);
  }
  .wcard:active {
    transform: scale(0.97);
  }
  .wcard.locked {
    opacity: 0.55;
    filter: grayscale(0.7);
  }
  .wcard.is-current {
    border-color: var(--accent);
    box-shadow:
      0 0 0 2px color-mix(in srgb, var(--accent) 35%, transparent),
      0 0 24px color-mix(in srgb, var(--accent) 35%, transparent);
  }
  .num {
    font-size: 18px;
    font-weight: 800;
    letter-spacing: 1px;
    color: var(--ink-soft);
  }
  .wcard.is-current .num,
  .wcard:hover .num {
    color: var(--ink);
  }
  .wname {
    font-size: 13px;
    font-weight: 700;
    line-height: 1.25;
    color: var(--ink);
  }
  .shapes {
    display: flex;
    gap: 2px;
  }
  .pips {
    display: flex;
    gap: 4px;
  }
  .pip {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.16);
  }
  .pip.on {
    background: var(--mint);
  }
  .pip.gold {
    background: var(--gold);
    box-shadow: 0 0 5px rgba(251, 191, 36, 0.7);
  }
  .badge {
    position: absolute;
    top: 4px;
    right: 8px;
    font-size: 13px;
  }
  .lock {
    position: absolute;
    bottom: 8px;
    right: 8px;
    font-size: 15px;
  }

  .how {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px;
  }
  @media (max-width: 720px) {
    .how {
      grid-template-columns: 1fr;
    }
  }
  .howcard {
    padding: 20px;
    border-radius: var(--radius);
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .howicon {
    font-size: 30px;
    line-height: 1;
    filter: drop-shadow(0 0 10px rgba(125, 211, 252, 0.35));
  }
  .howcard h3 {
    font-size: 15px;
    font-weight: 750;
    line-height: 1.25;
  }
  .howcard p {
    color: var(--ink-soft);
    font-size: 13.5px;
    line-height: 1.45;
  }
  .howcard .wallhint {
    color: var(--mint);
  }
  .howlink {
    display: inline-flex;
    align-items: center;
    align-self: flex-start;
    min-height: 44px;
    margin-top: auto;
    padding: 12px 0;
    color: var(--mint);
    font-size: 13.5px;
    font-weight: 750;
    transition: color 0.15s ease;
  }
  .howlink:hover {
    color: var(--cyan);
  }
  .howlink:active {
    transform: scale(0.97);
  }
</style>
