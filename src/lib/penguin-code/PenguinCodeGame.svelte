<script>
  import { onMount } from 'svelte';
  import { t } from '$lib/stores/locale';
  import {
    PENGUIN_LEVELS_PER_WORLD,
    PENGUIN_WORLD_COUNT,
    getPenguinWorld,
  } from '$lib/penguin-code/levels.js';
  import { simulateProgram, starsForPenguinCommands } from '$lib/penguin-code/rules.js';

  let { level, onComplete } = $props();

  const world = $derived(getPenguinWorld(level.world));

  const ARROWS = { U: '↑', D: '↓', L: '←', R: '→' };
  const STEP_MS = 220;

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
    if (outcome !== 'idle') {
      outcome = 'idle';
      showStart();
    }
  }

  function clearProgram() {
    if (!unlockedControls) return;
    program = [];
    outcome = 'idle';
    showStart();
  }

  function tryAgain() {
    outcome = 'idle';
    recorded = false;
    showStart();
  }

  function resetAll() {
    program = [];
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

    let step = 0;
    const stepOnce = () => {
      step += 1;
      const cell = result.path[step];
      position = { r: cell.r, c: cell.c };
      const key = `${cell.r}-${cell.c}`;
      if (fishSet.has(key) && !collected.includes(key)) collected = [...collected, key];
      if (step >= result.path.length - 1) {
        timer = null;
        running = false;
        finish(result);
        return;
      }
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
      <span>{collected.length} / {fishSet.size} 🐟</span>
    </div>
  </div>

  <div class="board-wrap">
    <div
      class="board"
      style={`grid-template-columns: repeat(${level.size}, minmax(0, 1fr));`}
      aria-label={$t('penguinCodeName')}
    >
      {#each cells as cell (cell.r * level.size + cell.c)}
        {@const key = `${cell.r}-${cell.c}`}
        {@const isHere = position.r === cell.r && position.c === cell.c}
        <span class="cell" class:start={startLabel(cell.r, cell.c)}>
          {#if wallSet.has(key)}
            <span class="icon" aria-hidden="true">🧊</span>
          {:else if holeSet.has(key)}
            <span class="icon" aria-hidden="true">🌊</span>
          {:else if fishSet.has(key) && !collected.includes(key)}
            <span class="icon" aria-hidden="true">🐟</span>
          {:else if cell.r === level.goal.r && cell.c === level.goal.c}
            <span class="icon goal" class:reach={outcome === 'win'} aria-hidden="true">🏠</span>
          {/if}
          {#if isHere}
            <span class="penguin" aria-hidden="true">🐧</span>
          {/if}
        </span>
      {/each}
    </div>
  </div>

  <div class="strip">
    {#each program as command, index (`${index}-${command}`)}
      <span class="chip" aria-hidden="true">{ARROWS[command]}</span>
    {/each}
    {#if !program.length}
      <span class="edgehead">{$t('penguinCodeHowBody')}</span>
    {/if}
  </div>

  {#if outcome === 'win'}
    <div class="result">
      <div class="stars" aria-label={`${stars} stars`}>
        {#each [1, 2, 3] as star (star)}
          <span class:on={star <= stars} aria-hidden="true">★</span>
        {/each}
      </div>
      <p>{program.length} {$t('penguinCodeCommands')} · {collected.length} / {fishSet.size} 🐟</p>
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
      class="padbtn"
      type="button"
      onclick={() => addCommand('U')}
      disabled={!unlockedControls || atMax}
      aria-label="Up"
    >
      ↑
    </button>
    <button
      class="padbtn"
      type="button"
      onclick={() => addCommand('L')}
      disabled={!unlockedControls || atMax}
      aria-label="Left"
    >
      ←
    </button>
    <button
      class="padbtn"
      type="button"
      onclick={() => addCommand('D')}
      disabled={!unlockedControls || atMax}
      aria-label="Down"
    >
      ↓
    </button>
    <button
      class="padbtn"
      type="button"
      onclick={() => addCommand('R')}
      disabled={!unlockedControls || atMax}
      aria-label="Right"
    >
      →
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
      ▶ {$t('penguinCodeRun')}
    </button>
  </div>

  {#if outcome !== 'win' && failed}
    <div class="resultactions">
      <button class="btn primary" type="button" onclick={tryAgain}>{$t('retry')}</button>
      <button class="btn" type="button" onclick={resetAll}>{$t('reset')}</button>
    </div>
  {/if}
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
  .cell:nth-child(7n) {
    border-right: 0;
  }
  .cell:nth-last-child(-n + 7) {
    border-bottom: 0;
  }
  .cell.start {
    background: rgba(125, 211, 252, 0.07);
  }
  .icon {
    line-height: 1;
    font-size: clamp(11px, 3.5vw, 22px);
  }
  .icon.goal {
    opacity: 0.85;
  }
  .icon.goal.reach {
    opacity: 1;
    filter: drop-shadow(0 0 12px rgba(94, 234, 212, 0.9));
  }
  .penguin {
    position: absolute;
    inset: 0;
    z-index: 3;
    display: grid;
    place-items: center;
    line-height: 1;
    font-size: clamp(13px, 4.4vw, 28px);
    filter: drop-shadow(0 0 10px rgba(125, 211, 252, 0.6));
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
    display: grid;
    place-items: center;
    border-radius: 9px;
    border: 1px solid rgba(94, 234, 212, 0.28);
    background: rgba(94, 234, 212, 0.08);
    color: var(--ink-soft);
    font-size: 14px;
    font-weight: 700;
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
  .padbtn {
    min-width: 48px;
    min-height: 48px;
    border-radius: 14px;
    border: 1px solid rgba(125, 211, 252, 0.34);
    background: rgba(125, 211, 252, 0.08);
    color: var(--ink-soft);
    font-size: 19px;
    font-weight: 800;
    line-height: 1;
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
  .controls {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 8px;
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
  .stars span {
    color: rgba(255, 255, 255, 0.16);
    font-size: 25px;
  }
  .stars span.on {
    color: var(--gold);
    text-shadow: 0 0 12px rgba(251, 191, 36, 0.65);
  }
  .result p {
    color: var(--ink-soft);
    font-size: 11px;
  }
  @media (prefers-reduced-motion: reduce) {
    .penguin,
    .icon.goal.reach {
      filter: none;
    }
  }
</style>
