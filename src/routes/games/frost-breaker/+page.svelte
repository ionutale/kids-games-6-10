<script>
  import { onMount } from 'svelte';
  import GameShell from '$lib/components/GameShell.svelte';
  import { t } from '$lib/stores/locale';
  import { loadLevel, loadMastered, MAX_LEVEL } from '$lib/ladder/progress.js';
  import { loadStars } from '$lib/frost-breaker/progress.js';

  let current = $state(1);
  let mastered = $state(false);
  let stars = $state(Array(MAX_LEVEL).fill(0));

  const levels = Array.from({ length: MAX_LEVEL }, (_, i) => i + 1);

  onMount(() => {
    current = loadLevel('frost-breaker');
    mastered = loadMastered('frost-breaker');
    stars = loadStars();
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
        <span class="pill"
          >{$t('currentLevel')}
          {current}{#if mastered}
            · {$t('mastered')}{/if}</span
        >
        <h2>{$t('frostName')}</h2>
        <p>{$t('frostDesc')}</p>
      </div>
      <a class="btn primary play" href={`/games/frost-breaker/play/${current}`}>
        ▶ {$t('playLevel', { n: current })}
      </a>
    </section>

    <section class="levels glass">
      <div class="sectionhead">
        <h3>{$t('levelSelect')}</h3>
        {#if mastered}<span class="cap" aria-hidden="true">🎓</span>{/if}
      </div>
      <div class="levelgrid">
        {#each levels as n}
          <a
            class="level"
            class:current={n === current}
            class:mastered={n === MAX_LEVEL && mastered}
            href={`/games/frost-breaker/play/${n}`}
            aria-label={`${$t('level', { n })}${stars[n - 1] ? ` · ${stars[n - 1]}★` : ''}`}
          >
            <span class="num">{n}</span>
            <span class="pips" aria-hidden="true">
              {#each [1, 2, 3] as k}
                <span class="pip" class:on={stars[n - 1] >= k}></span>
              {/each}
            </span>
            {#if n === MAX_LEVEL && mastered}<span class="grad" aria-hidden="true">🎓</span>{/if}
          </a>
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
  .play {
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
    .play {
      width: 100%;
    }
  }

  .levels {
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
  .levelgrid {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 10px;
  }
  .level {
    position: relative;
    min-height: 70px;
    border-radius: 16px;
    border: 1px solid var(--line);
    background: rgba(6, 24, 40, 0.62);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 7px;
    transition:
      transform 0.14s var(--ease),
      border-color 0.16s ease,
      background 0.16s ease;
  }
  .level:hover {
    border-color: var(--line-strong);
    background: rgba(12, 42, 65, 0.8);
  }
  .level:active {
    transform: scale(0.96);
  }
  .level.current {
    border-color: rgba(125, 211, 252, 0.9);
    background: rgba(18, 57, 84, 0.9);
    box-shadow:
      0 0 0 2px rgba(125, 211, 252, 0.14),
      0 0 22px rgba(125, 211, 252, 0.22);
  }
  .num {
    font-size: 22px;
    font-weight: 800;
    color: var(--ink);
  }
  .level.current .num {
    color: #d9f7ff;
  }
  .pips {
    display: flex;
    gap: 3px;
  }
  .pip {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.16);
  }
  .pip.on {
    background: var(--gold);
    box-shadow: 0 0 5px rgba(251, 191, 36, 0.7);
  }
  .grad {
    position: absolute;
    top: 4px;
    right: 6px;
    font-size: 13px;
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
</style>
