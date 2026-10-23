<script>
  import { onMount } from 'svelte';
  import GameShell from '$lib/components/GameShell.svelte';
  import { t } from '$lib/stores/locale';
  import { emptyProgress, loadProgress, nextLevel } from '$lib/frost-breaker/progress.js';

  const PODS = [
    { id: 'spike', icon: '❄️', accent: '#bff3ff' },
    { id: 'ghost', icon: '👻', accent: '#c4b5fd' },
    { id: 'copter', icon: '🚁', accent: '#fbbf24' },
    { id: 'split', icon: '💠', accent: '#fda4af' },
  ];

  let progress = $state(emptyProgress());
  const current = $derived(nextLevel(progress));

  onMount(() => {
    progress = loadProgress();
  });
</script>

<svelte:head>
  <title>{$t('podGuide')} · {$t('frostName')}</title>
</svelte:head>

<GameShell backHref="/games/frost-breaker" title={$t('podGuide')}>
  <div class="guide">
    <section class="hero glass">
      <div class="icons" aria-hidden="true">
        <span class="ic">❄️</span>
        <span class="ic">👻</span>
        <span class="ic">🚁</span>
        <span class="ic">💠</span>
      </div>
      <p class="lead">{$t('podGuideIntro')}</p>
    </section>

    <div class="cards">
      {#each PODS as pod, index (pod.id)}
        <article class="card glass" style:--accent={pod.accent}>
          <div class="cardtop">
            <span class="podtile" aria-hidden="true">{pod.icon}</span>
            <span class="num" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
          </div>
          <h2>{$t(pod.id)}</h2>
          <p class="guide-text">{$t(pod.id + 'Guide')}</p>
          <div class="best">
            <span class="bestlabel">{$t('bestFor')}</span>
            <span class="besttext">{$t(pod.id + 'Best')}</span>
          </div>
        </article>
      {/each}
    </div>

    <section class="note glass">
      <span class="noteicon" aria-hidden="true">🧮</span>
      <p>{$t('podGuideCounts')}</p>
    </section>

    <section class="cta">
      <a class="btn primary play" href={`/games/frost-breaker/play/${current}`}>
        ▶ {$t('playLevel', { n: current })}
      </a>
      <a class="btn ghost select" href="/games/frost-breaker">{$t('levelSelect')}</a>
    </section>
  </div>
</GameShell>

<style>
  .guide {
    width: 100%;
    max-width: 760px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding-top: 4px;
  }
  .hero {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 12px;
    padding: 24px 20px;
    border-radius: var(--radius-lg);
  }
  .icons {
    display: flex;
    gap: 14px;
  }
  .ic {
    font-size: 38px;
    line-height: 1;
    filter: drop-shadow(0 0 14px rgba(125, 211, 252, 0.4));
  }
  .lead {
    color: var(--ink-soft);
    font-size: 15px;
    line-height: 1.5;
    max-width: 480px;
  }
  .cards {
    display: grid;
    grid-template-columns: 1fr;
    gap: 14px;
  }
  @media (min-width: 700px) {
    .cards {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  .card {
    position: relative;
    padding: 18px 20px 20px;
    border-radius: var(--radius);
    border: 1px solid color-mix(in srgb, var(--accent) 35%, transparent);
    display: flex;
    flex-direction: column;
    gap: 10px;
    overflow: hidden;
    transition:
      border-color 0.16s ease,
      box-shadow 0.16s ease;
  }
  .card:hover {
    border-color: var(--accent);
    box-shadow: 0 0 26px color-mix(in srgb, var(--accent) 22%, transparent);
  }
  .card::after {
    content: '';
    position: absolute;
    inset: -40% -20% auto;
    height: 55%;
    background: radial-gradient(
      ellipse at 50% 0%,
      color-mix(in srgb, var(--accent) 14%, transparent),
      transparent 70%
    );
    pointer-events: none;
  }
  .cardtop {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }
  .podtile {
    width: 86px;
    height: 86px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 50px;
    line-height: 1;
    border-radius: 20px;
    border: 1px solid color-mix(in srgb, var(--accent) 40%, transparent);
    background: linear-gradient(
      165deg,
      color-mix(in srgb, var(--accent) 14%, rgba(6, 24, 40, 0.7)),
      rgba(5, 20, 34, 0.7)
    );
    filter: drop-shadow(0 0 12px color-mix(in srgb, var(--accent) 45%, transparent));
  }
  .num {
    font-size: 26px;
    font-weight: 800;
    letter-spacing: 2px;
    color: color-mix(in srgb, var(--accent) 78%, white);
    text-shadow: 0 0 16px color-mix(in srgb, var(--accent) 50%, transparent);
  }
  .card h2 {
    font-size: 24px;
    font-weight: 800;
    letter-spacing: -0.4px;
  }
  .guide-text {
    color: var(--ink-soft);
    font-size: 14.5px;
    line-height: 1.55;
  }
  .best {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: auto;
    min-height: 44px;
    padding: 8px 12px;
    border-radius: 12px;
    border: 1px solid color-mix(in srgb, var(--accent) 22%, transparent);
    background: color-mix(in srgb, var(--accent) 9%, rgba(5, 20, 34, 0.55));
  }
  .bestlabel {
    flex: 0 0 auto;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: var(--accent);
  }
  .besttext {
    color: var(--ink-soft);
    font-size: 13.5px;
    line-height: 1.4;
  }
  .note {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 18px;
    border-radius: var(--radius);
  }
  .noteicon {
    font-size: 24px;
    line-height: 1;
    flex: 0 0 auto;
    filter: drop-shadow(0 0 10px rgba(125, 211, 252, 0.35));
  }
  .note p {
    color: var(--ink-soft);
    font-size: 13.5px;
    line-height: 1.5;
  }
  .cta {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  @media (min-width: 700px) {
    .cta {
      flex-direction: row;
    }
    .cta .btn {
      flex: 1;
    }
  }
  .cta .btn {
    min-height: 48px;
  }
  .play {
    font-size: 17px;
  }
  .select {
    font-size: 15px;
  }
</style>
