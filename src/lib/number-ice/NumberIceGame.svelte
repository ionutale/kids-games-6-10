<script>
  import { onMount } from 'svelte';
  import { t } from '$lib/stores/locale';
  import {
    NUMBER_ICE_LEVELS_PER_WORLD,
    NUMBER_ICE_WORLD_COUNT,
    getNumberIceWorld,
  } from '$lib/number-ice/levels.js';
  import {
    createBoard,
    createRng,
    dropAndRefill,
    ensureSelection,
    starsForNumberIceMoves,
    sumSelection,
  } from '$lib/number-ice/board.js';

  let { level, onComplete } = $props();

  const MAX_SELECTION = 4;
  const MELT_MS = 460;

  const world = $derived(getNumberIceWorld(level.world));

  // The route mounts a fresh game for each level id, so the seed only has to be
  // read once for the first board.
  // svelte-ignore state_referenced_locally
  let rng = createRng(level.seed);
  // svelte-ignore state_referenced_locally
  let board = $state(ensureSelection(createBoard(level.size, rng), level.target, rng));

  let selected = $state([]);
  let cleared = $state(0);
  let movesUsed = $state(0);
  let outcome = $state('playing'); // playing | win | fail
  let recorded = $state(false);
  let melting = $state([]);
  let meltTick = $state(0);

  let meltTimer = null;

  const selectedSum = $derived(sumSelection(board, selected));
  const canMelt = $derived(
    outcome === 'playing' &&
      selected.length >= 2 &&
      selected.length <= MAX_SELECTION &&
      selectedSum === level.target,
  );
  const stars = $derived(starsForNumberIceMoves(movesUsed, level.par));

  // Slot 5 ends the world: continue on another level, otherwise go back to the
  // world page (or the landing after the final world).
  const nextHref = $derived.by(() => {
    if (level.slot < NUMBER_ICE_LEVELS_PER_WORLD) return `/games/number-ice/play/${level.id + 1}`;
    if (world.id < NUMBER_ICE_WORLD_COUNT) return `/games/number-ice/world/${world.id}`;
    return '/games/number-ice';
  });
  const nextLabel = $derived(level.slot < NUMBER_ICE_LEVELS_PER_WORLD ? 'nextLevel' : 'levelSelect');

  $effect(() => {
    if (outcome !== 'win' || recorded) return;
    recorded = true;
    onComplete?.(level.id, stars);
  });

  onMount(() => () => clearMeltTimer());

  function clearMeltTimer() {
    if (meltTimer) clearTimeout(meltTimer);
    meltTimer = null;
  }

  /** Replay the level from its seed: a brand new board and fresh counters. */
  function newGame() {
    clearMeltTimer();
    rng = createRng(level.seed);
    board = ensureSelection(createBoard(level.size, rng), level.target, rng);
    selected = [];
    cleared = 0;
    movesUsed = 0;
    outcome = 'playing';
    recorded = false;
    melting = [];
  }

  function toggle(index) {
    if (outcome !== 'playing') return;
    if (selected.includes(index)) {
      selected = selected.filter((value) => value !== index);
      return;
    }
    if (selected.length >= MAX_SELECTION) return;
    selected = [...selected, index];
  }

  function melt() {
    if (!canMelt) return;
    const indices = selected;
    cleared += indices.length;
    movesUsed += 1;
    board = dropAndRefill(board, indices, level.size, rng);
    board = ensureSelection(board, level.target, rng);
    selected = [];
    flashMelt(indices);
    if (cleared >= level.goal) outcome = 'win';
    else if (movesUsed >= level.moves) outcome = 'fail';
  }

  // The highlight is purely decorative and never blocks input, so a dropped
  // timer can leave a glow behind but can never lock the board.
  function flashMelt(indices) {
    clearMeltTimer();
    melting = [...indices];
    meltTick += 1;
    meltTimer = setTimeout(() => {
      meltTimer = null;
      melting = [];
    }, MELT_MS);
  }

  function cellPosition(index, size) {
    const column = (index % size) + 1;
    const row = Math.floor(index / size) + 1;
    return `grid-column: ${column}; grid-row: ${row};`;
  }
</script>

<section class="game glass" style:--accent={world.accent}>
  <div class="gamehead">
    <div>
      <span class="kicker">{$t('numberIceName')} · {$t(world.nameKey)}</span>
      <h2>{$t('level', { n: level.slot })}</h2>
    </div>
    <span class="par">{$t('numberIcePar')} {level.par} ★</span>
  </div>

  <dl class="stats">
    <div>
      <dt>{$t('numberIceTarget')}</dt>
      <dd>{level.target}</dd>
    </div>
    <div>
      <dt>{$t('numberIceCleared')}</dt>
      <dd>{cleared}/{level.goal}</dd>
    </div>
    <div>
      <dt>{$t('numberIceMoves')}</dt>
      <dd>{movesUsed}/{level.moves}</dd>
    </div>
    <div class="sum" class:match={canMelt}>
      <dt>{$t('numberIceSelected')}</dt>
      <dd aria-live="polite">{selectedSum}/{level.target}</dd>
    </div>
  </dl>

  <div class="board-wrap">
    <div
      class="board"
      class:won={outcome === 'win'}
      style={`--size: ${level.size}; grid-template-columns: repeat(${level.size}, minmax(0, 1fr));`}
      role="group"
      aria-label={$t('numberIceName')}
    >
      {#each board as value, index (index)}
        <button
          class="tile"
          class:selected={selected.includes(index)}
          type="button"
          onclick={() => toggle(index)}
          aria-pressed={selected.includes(index)}
          disabled={outcome !== 'playing'}
        >
          {value}
        </button>
      {/each}

      {#if melting.length}
        {#key meltTick}
          <div class="melt-layer" aria-hidden="true">
            {#each melting as index (index)}
              <span class="melt-cell" style={cellPosition(index, level.size)}></span>
            {/each}
          </div>
        {/key}
      {/if}
    </div>
  </div>

  {#if outcome === 'win'}
    <div class="result win">
      <p class="resulttitle">{$t('numberIceWin')}</p>
      <div class="stars" aria-label={`${stars} ★`}>
        {#each [1, 2, 3] as star (star)}
          <span class:on={star <= stars} aria-hidden="true">★</span>
        {/each}
      </div>
      <p class="resultmeta">{$t('numberIceCleared')} {cleared} · {$t('numberIceMoves')} {movesUsed}</p>
      <div class="resultactions">
        <a class="btn primary" href={nextHref}>{$t(nextLabel)}</a>
        <button class="btn ghost" type="button" onclick={newGame}>{$t('retry')}</button>
      </div>
    </div>
  {:else if outcome === 'fail'}
    <div class="result fail">
      <p class="resulttitle">{$t('numberIceFail')}</p>
      <div class="resultactions">
        <button class="btn primary" type="button" onclick={newGame}>{$t('retry')}</button>
        <a class="btn ghost" href="/games/number-ice">{$t('levelSelect')}</a>
      </div>
    </div>
  {:else}
    <p class="status" aria-live="polite">{$t('numberIceHowBody')}</p>

    <div class="controls">
      <button class="mini" type="button" onclick={newGame}>{$t('reset')}</button>
      <button class="btn primary melt" type="button" onclick={melt} disabled={!canMelt}>
        {$t('numberIceMelt')}
      </button>
    </div>
  {/if}
</section>

<style>
  .game {
    max-width: 620px;
    margin: 0 auto;
    padding: 16px;
    border-radius: var(--radius);
    border-color: rgba(186, 230, 253, 0.28);
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .gamehead {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }
  .kicker {
    color: var(--mint);
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 1.2px;
    text-transform: uppercase;
  }
  h2 {
    margin-top: 3px;
    font-size: clamp(22px, 5vw, 28px);
    letter-spacing: -0.5px;
  }
  .par {
    color: var(--gold);
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.4px;
    white-space: nowrap;
    padding-top: 3px;
  }
  .stats {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 6px;
    margin: 0;
  }
  .stats div {
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
    padding: 6px 8px;
    border-radius: 12px;
    border: 1px solid var(--line);
    background: rgba(125, 211, 252, 0.05);
  }
  .stats dt {
    color: var(--muted);
    font-size: 9px;
    font-weight: 750;
    letter-spacing: 0.3px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .stats dd {
    margin: 0;
    color: var(--ink);
    font-size: clamp(13px, 3.6vw, 17px);
    font-weight: 800;
    line-height: 1.15;
    font-variant-numeric: tabular-nums;
  }
  .stats .sum {
    border-color: rgba(186, 230, 253, 0.3);
  }
  .stats .sum.match {
    border-color: var(--accent);
    background: color-mix(in srgb, var(--accent) 18%, transparent);
    box-shadow: 0 0 18px color-mix(in srgb, var(--accent) 30%, transparent);
  }
  .stats .sum.match dd {
    color: var(--mint);
  }
  .board-wrap {
    display: flex;
    justify-content: center;
  }
  .board {
    position: relative;
    width: min(100%, 470px);
    display: grid;
    gap: 2px;
    padding: 3px;
    border-radius: 20px;
    border: 1px solid rgba(186, 230, 253, 0.3);
    background: rgba(4, 22, 35, 0.86);
    box-shadow: inset 0 0 38px rgba(186, 230, 253, 0.05);
    touch-action: manipulation;
  }
  .board.won {
    border-color: rgba(94, 234, 212, 0.55);
    box-shadow:
      inset 0 0 38px rgba(94, 234, 212, 0.12),
      0 0 26px rgba(94, 234, 212, 0.16);
  }
  .tile {
    display: grid;
    place-items: center;
    min-width: 0;
    min-height: 44px;
    aspect-ratio: 1;
    padding: 0;
    border-radius: 11px;
    border: 1px solid rgba(186, 230, 253, 0.18);
    background: linear-gradient(180deg, rgba(125, 211, 252, 0.18), rgba(14, 116, 144, 0.16));
    color: #eafaff;
    font: inherit;
    font-size: clamp(15px, 4.4vw, 26px);
    font-weight: 800;
    line-height: 1;
    text-shadow: 0 1px 6px rgba(4, 22, 35, 0.7);
    transition:
      transform 0.12s var(--ease),
      background 0.12s ease,
      border-color 0.12s ease,
      box-shadow 0.12s ease;
  }
  .tile:hover:not(:disabled) {
    border-color: rgba(186, 230, 253, 0.5);
    background: linear-gradient(180deg, rgba(147, 224, 255, 0.26), rgba(14, 116, 144, 0.22));
  }
  .tile:active:not(:disabled) {
    transform: scale(0.93);
  }
  .tile:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 1px;
  }
  .tile.selected {
    border-color: var(--accent);
    background: linear-gradient(180deg, rgba(94, 234, 212, 0.42), rgba(56, 189, 248, 0.26));
    color: #ffffff;
    box-shadow:
      0 0 0 2px color-mix(in srgb, var(--accent) 34%, transparent),
      0 0 18px color-mix(in srgb, var(--accent) 42%, transparent);
  }
  .tile.selected:hover:not(:disabled) {
    background: linear-gradient(180deg, rgba(94, 234, 212, 0.5), rgba(56, 189, 248, 0.32));
  }
  .tile:disabled {
    cursor: default;
  }
  .melt-layer {
    position: absolute;
    inset: 3px;
    z-index: 2;
    display: grid;
    gap: 2px;
    grid-template-columns: repeat(var(--size), minmax(0, 1fr));
    grid-template-rows: repeat(var(--size), minmax(0, 1fr));
    pointer-events: none;
  }
  .melt-cell {
    border-radius: 11px;
    background: radial-gradient(
      circle at 50% 45%,
      #f6ffff,
      rgba(94, 234, 212, 0.78) 46%,
      rgba(94, 234, 212, 0) 74%
    );
    box-shadow: 0 0 24px rgba(94, 234, 212, 0.8);
    animation: melt-pop 460ms ease-out forwards;
  }
  @keyframes melt-pop {
    0% {
      opacity: 0;
      transform: scale(0.55);
    }
    35% {
      opacity: 1;
      transform: scale(1.06);
    }
    100% {
      opacity: 0;
      transform: scale(0.7);
    }
  }
  .status {
    min-height: 34px;
    color: var(--ink-soft);
    font-size: 12.5px;
    line-height: 1.4;
  }
  .controls {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .mini {
    min-height: 44px;
    padding: 8px 15px;
    border-radius: 12px;
    border: 1px solid var(--line);
    color: var(--ink-soft);
    font-size: 12px;
    font-weight: 700;
    background: rgba(125, 211, 252, 0.06);
  }
  .mini:hover {
    border-color: var(--line-strong);
    color: var(--ink);
  }
  .melt {
    min-height: 48px;
    padding: 10px 30px;
    font-size: 14px;
  }
  .melt:disabled {
    opacity: 0.4;
    filter: grayscale(0.4);
    box-shadow: none;
  }
  .result {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 14px;
    border-radius: 16px;
    border: 1px solid rgba(186, 230, 253, 0.25);
    background: rgba(186, 230, 253, 0.06);
    text-align: center;
  }
  .result.win {
    border-color: rgba(94, 234, 212, 0.3);
    background: rgba(94, 234, 212, 0.07);
  }
  .result.fail {
    border-color: rgba(248, 113, 113, 0.3);
    background: rgba(248, 113, 113, 0.07);
  }
  .resulttitle {
    color: var(--mint);
    font-size: 14px;
    font-weight: 800;
    letter-spacing: -0.2px;
  }
  .result.fail .resulttitle {
    color: #fecaca;
  }
  .stars {
    display: flex;
    gap: 4px;
  }
  .stars span {
    color: rgba(255, 255, 255, 0.16);
    font-size: 25px;
    line-height: 1;
  }
  .stars span.on {
    color: var(--gold);
    text-shadow: 0 0 12px rgba(251, 191, 36, 0.65);
  }
  .resultmeta {
    color: var(--ink-soft);
    font-size: 11px;
    line-height: 1.4;
  }
  .resultactions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
    margin-top: 2px;
  }
  .resultactions .btn {
    min-height: 44px;
    padding: 9px 16px;
    font-size: 12px;
  }
  @media (max-width: 430px) {
    .game {
      padding: 12px;
      gap: 10px;
    }
    .stats {
      gap: 4px;
    }
    .stats div {
      padding: 5px 6px;
    }
    .melt {
      flex: 1;
      padding: 10px 18px;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .melt-cell {
      animation: none;
      opacity: 0.4;
    }
  }
</style>
