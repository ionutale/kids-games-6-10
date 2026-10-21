<script>
  import { page } from '$app/state';
  import GameShell from '$lib/components/GameShell.svelte';
  import ShapePreview from '$lib/components/ShapePreview.svelte';
  import { t } from '$lib/stores/locale';
  import { WORLDS, worldLevels } from '$lib/frost-breaker/levels.js';
  import { loadProgress, isWorldUnlocked } from '$lib/frost-breaker/progress.js';

  const worldId = $derived(Math.min(10, Math.max(1, parseInt(page.params.n, 10) || 1)));
  const world = $derived(WORLDS[worldId - 1]);
  const levels = $derived(worldLevels(worldId));

  // ssr = false on this route, so localStorage is always available here.
  let progress = $state(loadProgress());
  const unlocked = $derived(isWorldUnlocked(progress, worldId));
</script>

<svelte:head>
  <title>{$t(world.nameKey)} · {$t('frostName')}</title>
</svelte:head>

<GameShell backHref="/games/frost-breaker" title={$t(world.nameKey)}>
  <div class="worldpage">
    <section class="header glass" style:--accent={world.accent}>
      <span class="num" aria-hidden="true">{String(world.id).padStart(2, '0')}</span>
      <div class="headtext">
        <h2>{$t(world.nameKey)}</h2>
        <div class="strip" aria-hidden="true">
          {#each levels as level (level.slot)}
            <span class="slot" class:on={progress.stars[level.level - 1] > 0}></span>
          {/each}
        </div>
      </div>
      <span class="shapes" aria-hidden="true">
        {#each world.shapes as shape (shape)}
          <ShapePreview shapeId={shape} size={140} />
        {/each}
      </span>
      {#if !unlocked}<span class="lock" aria-hidden="true">🔒</span>{/if}
    </section>

    <section class="nodes">
      {#each levels as level (level.slot)}
        {@const stars = progress.stars[level.level - 1]}
        {#if unlocked}
          <a
            class="node glass"
            href={`/games/frost-breaker/play/${level.level}`}
            style:--accent={world.accent}
          >
            <span class="slotnum">{$t('level', { n: level.slot })}</span>
            <ShapePreview shapeId={level.shape} scale={level.scale} coreCount={level.coreCount} size={54} />
            <span class="pips" aria-hidden="true">
              {#each [1, 2, 3] as k}
                <span class="pip" class:on={stars >= k}></span>
              {/each}
            </span>
          </a>
        {:else}
          <div class="node glass locked" aria-disabled="true" style:--accent={world.accent}>
            <span class="slotnum">{$t('level', { n: level.slot })}</span>
            <ShapePreview shapeId={level.shape} scale={level.scale} coreCount={level.coreCount} size={54} />
            <span class="pips" aria-hidden="true">
              {#each [1, 2, 3] as k}
                <span class="pip" class:on={stars >= k}></span>
              {/each}
            </span>
            <span class="lock" aria-hidden="true">🔒</span>
          </div>
        {/if}
      {/each}
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
  .strip {
    display: flex;
    gap: 6px;
  }
  .slot {
    width: 26px;
    height: 6px;
    border-radius: 3px;
    background: rgba(255, 255, 255, 0.14);
  }
  .slot.on {
    background: var(--gold);
    box-shadow: 0 0 6px rgba(251, 191, 36, 0.6);
  }
  .shapes {
    display: flex;
    gap: 4px;
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
  .lock {
    font-size: 20px;
    filter: drop-shadow(0 0 8px rgba(0, 0, 0, 0.4));
  }
  .header .lock {
    position: absolute;
    top: 10px;
    right: 12px;
  }

  .nodes {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 12px;
  }
  @media (max-width: 620px) {
    .nodes {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  .node {
    position: relative;
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
      background 0.16s ease;
  }
  .node:hover {
    border-color: var(--accent);
    transform: translateY(-2px);
  }
  .node:active {
    transform: scale(0.97);
  }
  .node.locked {
    opacity: 0.55;
    filter: grayscale(0.7);
  }
  .node .lock {
    position: absolute;
    top: 6px;
    right: 8px;
    font-size: 13px;
  }
  .slotnum {
    font-size: 12.5px;
    font-weight: 700;
    color: var(--ink-soft);
    letter-spacing: 0.4px;
  }
  .pips {
    display: flex;
    gap: 3px;
  }
  .pip {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.16);
  }
  .pip.on {
    background: var(--gold);
    box-shadow: 0 0 5px rgba(251, 191, 36, 0.7);
  }
</style>
