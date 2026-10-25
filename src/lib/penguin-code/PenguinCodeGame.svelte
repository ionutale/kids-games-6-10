<script>
  import { onMount } from 'svelte';
  import { t } from '$lib/stores/locale';
  import PenguinArt from '$lib/penguin-code/PenguinArt.svelte';
  import UiIcon from '$lib/components/UiIcon.svelte';
  import {
    PENGUIN_LEVELS_PER_WORLD,
    PENGUIN_WORLD_COUNT,
    getPenguinWorld,
  } from '$lib/penguin-code/levels.js';
  import { simulateProgram, starsForPenguinCommands } from '$lib/penguin-code/rules.js';

  let { level, onComplete } = $props();

  const world = $derived(getPenguinWorld(level.world));

  const ARROWS = { U: 'arrow-up', D: 'arrow-down', L: 'arrow-left', R: 'arrow-right' };
  const STEP_MS = 150;

  const cells = $derived.by(() =>
    Array.from({ length: level.size * level.size }, (_, index) => ({
      r: Math.floor(index / level.size),
      c: index % level.size,
    })),
  );
  const fishSet = $derived(new Set(level.fish ?? []));
  const wallSet = $derived(new Set(level.walls ?? []));
  const holeSet = $derived(new Set(level.holes ?? []));

  // The route mounts a fresh game for each level id.
  // svelte-ignore state_referenced_locally
  let position = $state({ ...level.start });
  let collected = $state([]);
  let program = $state([]);
  let running = $state(false);
  let outcome = $state('idle'); // idle | win | splash | out | bump
  let stars = $state(0);
  let recorded = $state(false);
  let activeCommand = $state(-1);
  let hops = $state(0);

  const preview = $derived(simulateProgram(level, program));
  const showPreview = $derived(program.length > 0 && !running && outcome === 'idle');
  const routePoints = $derived(preview.path.map((cell) => `${cell.c + 0.5},${cell.r + 0.5}`).join(' '));
  const routeEnd = $derived(preview.path[preview.path.length - 1]);

  const failKey = $derived(
    outcome === 'splash'
      ? 'penguinCodeSplash'
      : outcome === 'out'
        ? 'penguinCodeOut'
        : outcome === 'bump'
          ? 'penguinCodeBump'
          : '',
  );
  const failed = $derived(failKey !== '');
  const atMax = $derived(program.length >= level.maxCommands);
  const unlockedControls = $derived(!running && outcome !== 'win');

  // Slot 5 ends the world: continue on another level, otherwise go back to
  // the world page (or the landing after the final world).
  const nextHref = $derived.by(() => {
    if (level.slot < PENGUIN_LEVELS_PER_WORLD) return `/games/penguin-code/play/${level.id + 1}`;
    if (world.id < PENGUIN_WORLD_COUNT) return `/games/penguin-code/world/${world.id}`;
    return '/games/penguin-code';
  });
  const nextLabel = $derived(level.slot < PENGUIN_LEVELS_PER_WORLD ? 'nextLevel' : 'levelSelect');

  let timer = null;

  $effect(() => {
    if (outcome !== 'win' || recorded) return;
    recorded = true;
    onComplete?.(level.id, stars);
  });

  onMount(() => () => {
    if (timer) clearTimeout(timer);
  });

  function showStart() {
    position = { r: level.start.r, c: level.start.c };
    collected = [];
    activeCommand = -1;
    hops = 0;
  }

  function addCommand(command) {
    if (!unlockedControls || atMax) return;
    if (outcome !== 'idle') {
      outcome = 'idle';
      showStart();
    }
    program = [...program, command];
  }

  function undoCommand() {
    if (!unlockedControls || !program.length) return;
    program = program.slice(0, -1);
    activeCommand = -1;
    if (outcome !== 'idle') {
      outcome = 'idle';
      showStart();
    }
  }

  function clearProgram() {
    if (!unlockedControls) return;
    program = [];
    outcome = 'idle';
    activeCommand = -1;
    showStart();
  }

  function tryAgain() {
    outcome = 'idle';
    recorded = false;
    showStart();
  }

  function run() {
    if (running || !program.length) return;
    const result = simulateProgram(level, program);
    running = true;
    outcome = 'idle';
    showStart();
    activeCommand = 0;

    let step = 0;
    const stepOnce = () => {
      step += 1;
      hops += 1;
      const cell = result.path[step];
      position = { r: cell.r, c: cell.c };
      const key = `${cell.r}-${cell.c}`;
      if (fishSet.has(key) && !collected.includes(key)) collected = [...collected, key];
      if (step >= result.path.length - 1) {
        timer = null;
        running = false;
        activeCommand = -1;
        finish(result);
        return;
      }
      activeCommand = step;
      timer = setTimeout(stepOnce, STEP_MS);
    };
    timer = setTimeout(stepOnce, STEP_MS);
  }

  function finish(result) {
    if (result.status === 'win') {
      stars = starsForPenguinCommands(program.length, level.par);
      outcome = 'win';
      return;
    }
    if (result.reason === 'splash') {
      outcome = 'splash';
      return;
    }
    if (result.reason === 'out') {
      outcome = 'out';
      return;
    }
    // Both "exhausted the program" and "bumped into walls the whole time"
    // end incomplete: only report a bump when the penguin never moved.
    const moved = result.path.some((cell) => cell.r !== level.start.r || cell.c !== level.start.c);
    outcome = moved ? 'out' : 'bump';
  }

  function startLabel(r, c) {
    return r === level.start.r && c === level.start.c ? 'start' : '';
  }
</script>

<section class="game glass" style:--accent={world.accent}>
  <div class="gamehead">
    <div>
      <span class="kicker">{$t('penguinCodeName')} · {$t(world.nameKey)}</span>
      <h2>{$t('level', { n: level.slot })}</h2>
    </div>
    <div class="counts">
      <span>{$t('penguinCodeCommands')} {program.length} / {level.maxCommands}</span>
      <span class="fishcount">
        {collected.length} / {fishSet.size}
        <span class="fishicon" aria-hidden="true"><PenguinArt name="fish" /></span>
      </span>
    </div>
  </div>

  <div class="board-wrap">
    <div
      class="board"
      style={`grid-template-columns: repeat(${level.size}, minmax(0, 1fr));`}
      aria-label={$t('penguinCodeName')}
    >
      {#if showPreview}
        <svg
          class="route"
          class:fail={preview.status === 'fail'}
          viewBox={`0 0 ${level.size} ${level.size}`}
          preserveAspectRatio="none"
          aria-hidden="true"
          focusable="false"
        >
          <polyline points={routePoints} />
          <circle cx={routeEnd.c + 0.5} cy={routeEnd.r + 0.5} r="0.085" />
        </svg>
      {/if}
      {#each cells as cell (cell.r * level.size + cell.c)}
        {@const key = `${cell.r}-${cell.c}`}
        {@const isHere = position.r === cell.r && position.c === cell.c}
        <span
          class="cell"
          class:start={startLabel(cell.r, cell.c)}
          class:edge-r={cell.c === level.size - 1}
          class:edge-b={cell.r === level.size - 1}
        >
          {#if wallSet.has(key)}
            <span class="icon" aria-hidden="true"><PenguinArt name="ice" /></span>
          {:else if holeSet.has(key)}
            <span class="icon" aria-hidden="true"><PenguinArt name="water" /></span>
          {:else if fishSet.has(key) && !collected.includes(key)}
            <span class="icon" aria-hidden="true"><PenguinArt name="fish" /></span>
          {:else if cell.r === level.goal.r && cell.c === level.goal.c}
            <span class="icon goal" class:reach={outcome === 'win'} aria-hidden="true">
              <PenguinArt name="igloo" />
            </span>
          {/if}
          {#if isHere}
            {#key hops}
              <span class="penguin" aria-hidden="true"><PenguinArt name="penguin" /></span>
            {/key}
          {/if}
        </span>
      {/each}
    </div>
  </div>

  <div class="strip">
    {#each program as command, index (`${index}-${command}`)}
      <span class="chip" class:active={running && index === activeCommand} aria-hidden="true">
        <UiIcon name={ARROWS[command]} />
      </span>
    {/each}
    {#if !program.length}
      <span class="edgehead">{$t('penguinCodeHowBody')}</span>
    {/if}
  </div>

  {#if outcome === 'win'}
    <div class="result">
      <div class="stars" aria-label={`${stars} stars`}>
        {#each [1, 2, 3] as star (star)}
          <span class="star" class:on={star <= stars} aria-hidden="true">
            <UiIcon name="star" />
          </span>
        {/each}
      </div>
      <p>
        {program.length}
        {$t('penguinCodeCommands')} · {collected.length} / {fishSet.size}
        <span class="fishicon" aria-hidden="true"><PenguinArt name="fish" /></span>
      </p>
      <div class="resultactions">
        <a class="btn primary" href={nextHref}>{$t(nextLabel)}</a>
        <button class="btn" type="button" onclick={tryAgain}>{$t('retry')}</button>
      </div>
    </div>
  {:else}
    <div class="status" class:fail={failed} aria-live="polite">
      {#if failed}
        {$t(failKey)}
      {:else}
        {$t('penguinCodeGoal')}
      {/if}
    </div>
  {/if}

  <div class="controls">
    <button
      class="padbtn up"
      type="button"
      onclick={() => addCommand('U')}
      disabled={!unlockedControls || atMax}
      aria-label="Up"
    >
      <span class="padico" aria-hidden="true"><UiIcon name="arrow-up" /></span>
    </button>
    <button
      class="padbtn left"
      type="button"
      onclick={() => addCommand('L')}
      disabled={!unlockedControls || atMax}
      aria-label="Left"
    >
      <span class="padico" aria-hidden="true"><UiIcon name="arrow-left" /></span>
    </button>
    <button
      class="padbtn down"
      type="button"
      onclick={() => addCommand('D')}
      disabled={!unlockedControls || atMax}
      aria-label="Down"
    >
      <span class="padico" aria-hidden="true"><UiIcon name="arrow-down" /></span>
    </button>
    <button
      class="padbtn right"
      type="button"
      onclick={() => addCommand('R')}
      disabled={!unlockedControls || atMax}
      aria-label="Right"
    >
      <span class="padico" aria-hidden="true"><UiIcon name="arrow-right" /></span>
    </button>
  </div>
  <div class="actionsrow">
    <button class="mini" type="button" onclick={undoCommand} disabled={!unlockedControls || !program.length}>
      {$t('undo')}
    </button>
    <button class="mini" type="button" onclick={clearProgram} disabled={!unlockedControls || !program.length}>
      {$t('penguinCodeClear')}
    </button>
    <button
      class="btn primary run"
      type="button"
      onclick={run}
      disabled={!unlockedControls || !program.length}
    >
      <span class="runico" aria-hidden="true"><UiIcon name="play" /></span>
      {$t('penguinCodeRun')}
    </button>
  </div>
</section>

<style>
  .game {
    max-width: 620px;
    margin: 0 auto;
    padding: 16px;
    border-radius: var(--radius);
    border-color: rgba(148, 163, 255, 0.28);
    display: flex;
    flex-direction: column;
    gap: 13px;
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
  .counts {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 2px;
    color: var(--muted);
    font-size: 10px;
    font-weight: 700;
    white-space: nowrap;
  }
  .fishcount {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  .fishicon {
    display: inline-block;
    width: 13px;
    height: 13px;
    vertical-align: -2px;
    flex: 0 0 auto;
  }
  .board-wrap {
    display: flex;
    justify-content: center;
  }
  .board {
    position: relative;
    width: min(100%, 380px);
    aspect-ratio: 1;
    display: grid;
    border: 1px solid rgba(125, 211, 252, 0.34);
    border-radius: 18px;
    overflow: hidden;
    background: rgba(4, 22, 35, 0.84);
    box-shadow: inset 0 0 38px rgba(125, 211, 252, 0.04);
  }
  .route {
    position: absolute;
    inset: 0;
    z-index: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    opacity: 0.55;
  }
  .route polyline {
    fill: none;
    stroke: var(--mint);
    stroke-width: 0.06;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-dasharray: 0.16 0.14;
  }
  .route circle {
    fill: var(--mint);
  }
  .route.fail polyline {
    stroke: #fb7185;
  }
  .route.fail circle {
    fill: #fb7185;
  }
  .cell {
    position: relative;
    z-index: 1;
    display: grid;
    place-items: center;
    min-width: 0;
    aspect-ratio: 1;
    border-right: 1px solid rgba(157, 228, 255, 0.09);
    border-bottom: 1px solid rgba(157, 228, 255, 0.09);
  }
  .cell.edge-r {
    border-right: 0;
  }
  .cell.edge-b {
    border-bottom: 0;
  }
  .cell.start {
    background: rgba(125, 211, 252, 0.07);
  }
  .icon {
    width: 74%;
    height: 74%;
  }
  .icon.goal {
    width: 68%;
    height: 68%;
    opacity: 0.85;
  }
  .icon.goal.reach {
    opacity: 1;
    filter: drop-shadow(0 0 12px rgba(94, 234, 212, 0.9));
  }
  .penguin {
    position: absolute;
    inset: 5%;
    z-index: 3;
    display: grid;
    place-items: center;
    filter: drop-shadow(0 0 10px rgba(125, 211, 252, 0.6));
    animation: hop 0.18s var(--ease);
  }
  @keyframes hop {
    0% {
      transform: translateY(-12%) scale(0.94);
    }
    60% {
      transform: translateY(3%) scale(1.02);
    }
    100% {
      transform: translateY(0) scale(1);
    }
  }
  .strip {
    min-height: 30px;
    display: flex;
    flex-wrap: wrap;
    align-content: flex-start;
    gap: 6px;
  }
  .chip {
    width: 30px;
    height: 30px;
    padding: 7px;
    display: grid;
    place-items: center;
    border-radius: 9px;
    border: 1px solid rgba(94, 234, 212, 0.28);
    background: rgba(94, 234, 212, 0.08);
    color: var(--ink-soft);
    transition:
      background 0.12s ease,
      border-color 0.12s ease,
      color 0.12s ease,
      transform 0.12s ease;
  }
  .chip.active {
    background: rgba(94, 234, 212, 0.28);
    border-color: var(--mint);
    color: #eaf8ff;
    transform: translateY(-1px) scale(1.06);
    box-shadow:
      0 0 0 1px rgba(94, 234, 212, 0.24),
      0 6px 14px rgba(94, 234, 212, 0.18);
  }
  .edgehead {
    align-self: center;
    color: var(--muted);
    font-size: 11px;
  }
  .status {
    min-height: 17px;
    color: var(--ink-soft);
    font-size: 12.5px;
    line-height: 1.4;
  }
  .status.fail {
    color: #fca5a5;
  }
  .controls {
    display: grid;
    grid-template-columns: repeat(3, minmax(48px, 56px));
    grid-template-rows: repeat(3, minmax(48px, 56px));
    justify-content: center;
    gap: 6px;
  }
  .padbtn {
    width: 100%;
    height: 100%;
    min-width: 48px;
    min-height: 48px;
    display: grid;
    place-items: center;
    border-radius: 16px;
    border: 1px solid rgba(125, 211, 252, 0.34);
    background: rgba(125, 211, 252, 0.08);
    color: var(--ink-soft);
    transition:
      background 0.12s ease,
      transform 0.12s ease;
  }
  .padbtn:hover:not(:disabled) {
    background: rgba(125, 211, 252, 0.18);
    color: #eaf8ff;
  }
  .padbtn:active:not(:disabled) {
    transform: scale(0.94);
  }
  .padbtn:disabled {
    opacity: 0.35;
  }
  .padico {
    width: 22px;
    height: 22px;
  }
  .up {
    grid-area: 1 / 2;
  }
  .left {
    grid-area: 2 / 1;
  }
  .down {
    grid-area: 3 / 2;
  }
  .right {
    grid-area: 2 / 3;
  }
  .actionsrow {
    display: flex;
    align-items: center;
    justify-content: flex-end;
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
  .mini:disabled {
    opacity: 0.35;
  }
  .actionsrow .run {
    min-height: 44px;
    padding: 9px 22px;
    font-size: 13px;
  }
  .runico {
    width: 13px;
    height: 13px;
  }
  .resultactions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
  }
  .resultactions .btn {
    min-height: 44px;
    padding: 9px 15px;
    font-size: 12px;
  }
  .result {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 14px;
    border-radius: 16px;
    border: 1px solid rgba(94, 234, 212, 0.25);
    background: rgba(94, 234, 212, 0.06);
    text-align: center;
  }
  .stars {
    display: flex;
    gap: 4px;
  }
  .star {
    width: 26px;
    height: 26px;
    color: rgba(255, 255, 255, 0.16);
  }
  .star.on {
    color: var(--gold);
    filter: drop-shadow(0 0 10px rgba(251, 191, 36, 0.65));
  }
  .result p {
    color: var(--ink-soft);
    font-size: 11px;
  }
  @media (max-height: 900px) {
    .game {
      gap: 10px;
      padding: 14px;
    }
    .board {
      width: min(100%, 320px);
    }
    .controls {
      grid-template-columns: repeat(3, minmax(48px, 54px));
      grid-template-rows: repeat(3, minmax(48px, 54px));
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .penguin {
      animation: none;
      filter: none;
    }
    .icon.goal.reach {
      filter: none;
    }
    .chip,
    .padbtn {
      transition: none;
    }
  }
</style>
