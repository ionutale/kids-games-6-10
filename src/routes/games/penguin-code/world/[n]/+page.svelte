<script>
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import GameShell from '$lib/components/GameShell.svelte';
  import { t } from '$lib/stores/locale';
  import { PENGUIN_WORLD_COUNT, getPenguinWorld, worldLevels } from '$lib/penguin-code/levels.js';
  import {
    emptyPenguinProgress,
    isPenguinWorldUnlocked,
    loadPenguinProgress,
    penguinWorldStars,
  } from '$lib/penguin-code/progress.js';

  const worldId = $derived(Math.min(PENGUIN_WORLD_COUNT, Math.max(1, parseInt(page.params.n, 10) || 1)));
  const world = $derived(getPenguinWorld(worldId));
  const levels = $derived(worldLevels(worldId));

  // ssr-safe: progress loads from localStorage on mount only.
  let progress = $state(emptyPenguinProgress());
  const unlocked = $derived(isPenguinWorldUnlocked(progress, worldId));
  const stars = $derived(penguinWorldStars(progress, worldId));

  onMount(() => {
    progress = loadPenguinProgress();
  });
</script>

<svelte:head>
  <title>{$t(world.nameKey)} · {$t('penguinCodeName')}</title>
</svelte:head>

<GameShell backHref="/games/penguin-code" title={$t(world.nameKey)}>
  <div class="worldpage">
    <section class="header glass" style:--accent={world.accent}>
      <span class="num" aria-hidden="true">{String(world.id).padStart(2, '0')}</span>
      <div class="headtext">
        <h2>{$t(world.nameKey)}</h2>
        <span class="wscore">{stars} / {levels.length * 3} ★</span>
      </div>
      {#if !unlocked}<span class="lock" aria-hidden="true">🔒</span>{/if}
    </section>

    {#if unlocked}
      <section class="nodes">
        {#each levels as level (level.id)}
          {@const levelStars = progress.stars[level.id - 1]}
          <a class="node glass" style:--accent={world.accent} href={`/games/penguin-code/play/${level.id}`}>
            <span class="slotnum">{$t('level', { n: level.slot })}</span>
            <span class="pips" aria-hidden="true">
              {#each [1, 2, 3] as k (k)}
                <span class="pip" class:on={levelStars >= k}></span>
              {/each}
            </span>
            <span class="cmds">{$t('penguinCodeCommands')} · {level.maxCommands}</span>
          </a>
        {/each}
      </section>
    {:else}
      <section class="lockedpanel glass">
        <span class="lockicon" aria-hidden="true">🔒</span>
        <p>{$t('penguinCodeLocked')}</p>
        <a class="btn ghost" href="/games/penguin-code">{$t('levelSelect')}</a>
      </section>
    {/if}

    <section class="backrow">
      <a class="btn ghost back" href="/games/penguin-code">← {$t('levelSelect')}</a>
    </section>
  </div>
</GameShell>

<style>
  .worldpage {
    width: 100%;
    max-width: 780px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding-top: 4px;
  }
  .header {
    position: relative;
    display: flex;
    align-items: center;
    gap: 18px;
    padding: 20px;
    border-radius: var(--radius-lg);
    border-color: color-mix(in srgb, var(--accent) 40%, transparent);
  }
  .num {
    font-size: 40px;
    font-weight: 800;
    letter-spacing: 2px;
    color: color-mix(in srgb, var(--accent) 80%, white);
    text-shadow: 0 0 18px color-mix(in srgb, var(--accent) 55%, transparent);
    flex: 0 0 auto;
  }
  .headtext {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1;
    min-width: 0;
  }
  .headtext h2 {
    font-size: clamp(24px, 4vw, 34px);
    letter-spacing: -0.8px;
    line-height: 1;
  }
  .wscore {
    color: var(--gold);
    font-size: 13px;
    font-weight: 800;
    letter-spacing: 0.6px;
  }
  .lock {
    font-size: 26px;
    filter: drop-shadow(0 0 8px rgba(0, 0, 0, 0.4));
    flex: 0 0 auto;
  }
  @media (max-width: 620px) {
    .header {
      flex-direction: column;
      text-align: center;
      padding: 18px 14px;
    }
    .headtext {
      align-items: center;
    }
  }
  .nodes {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 12px;
  }
  @media (max-width: 700px) {
    .nodes {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (max-width: 460px) {
    .nodes {
      grid-template-columns: 1fr;
    }
  }
  .node {
    min-height: 108px;
    padding: 14px 10px 16px;
    border-radius: 18px;
    border: 1px solid color-mix(in srgb, var(--accent) 35%, transparent);
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
  .node:hover {
    border-color: var(--accent);
    transform: translateY(-2px);
    box-shadow: 0 0 20px color-mix(in srgb, var(--accent) 25%, transparent);
  }
  .node:active {
    transform: scale(0.97);
  }
  .slotnum {
    font-size: 15px;
    font-weight: 800;
    color: var(--ink);
    letter-spacing: 0.4px;
  }
  .pips {
    display: flex;
    gap: 4px;
  }
  .pip {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.16);
  }
  .pip.on {
    background: var(--gold);
    box-shadow: 0 0 5px rgba(251, 191, 36, 0.7);
  }
  .cmds {
    font-size: 11.5px;
    font-weight: 650;
    color: var(--muted);
    letter-spacing: 0.3px;
  }
  .lockedpanel {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 30px 20px;
    border-radius: var(--radius-lg);
    text-align: center;
  }
  .lockicon {
    font-size: 34px;
    line-height: 1;
  }
  .lockedpanel p {
    color: var(--ink-soft);
    font-size: 14px;
    line-height: 1.5;
    max-width: 320px;
  }
  .backrow {
    display: flex;
    justify-content: center;
  }
  .back {
    min-height: 48px;
  }
</style>
