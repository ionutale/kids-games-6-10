<script>
  import { t } from '$lib/stores/locale';
  import { AURORA_LEVEL_COUNT, starsForAuroraMoves } from '$lib/aurora/levels.js';
  import { initialMirrorDirs, keyOf, traceBeam } from '$lib/aurora/beam.js';

  let { level, onComplete } = $props();

  // The route mounts a fresh game for each level id.
  // svelte-ignore state_referenced_locally
  const baseDirs = initialMirrorDirs(level);
  const cells = $derived.by(() =>
    Array.from({ length: level.size * level.size }, (_, index) => ({
      r: Math.floor(index / level.size),
      c: index % level.size,
    })),
  );

  let dirs = $state({ ...baseDirs });
  let moves = $state(0);
  let history = $state([]);
  let recorded = $state(false);

  const beam = $derived.by(() =>
    traceBeam({
      size: level.size,
      source: level.source,
      mirrorDirs: dirs,
      walls: level.walls,
      targets: level.targets,
    }),
  );
  const won = $derived(beam.lit);
  const stars = $derived(starsForAuroraMoves(moves, level.par));
  const pointList = $derived(beam.points.map((point) => `${point.x},${point.y}`).join(' '));
  const targetSet = $derived(new Set(level.targets));
  const wallSet = $derived(new Set(level.walls));

  $effect(() => {
    if (!won || recorded) return;
    recorded = true;
    onComplete?.(level.id, stars);
  });

  function rotate(r, c) {
    if (won) return;
    const key = keyOf(r, c);
    history = [...history, { dirs: { ...dirs }, moves }].slice(-32);
    dirs = { ...dirs, [key]: dirs[key] === '/' ? '\\' : '/' };
    moves += 1;
  }

  function undo() {
    const previous = history[history.length - 1];
    if (!previous || won) return;
    history = history.slice(0, -1);
    dirs = previous.dirs;
    moves = previous.moves;
  }

  function reset() {
    dirs = { ...baseDirs };
    moves = 0;
    history = [];
    recorded = false;
  }
</script>

<section class="game glass" style:--accent="#5eead4">
  <div class="gamehead">
    <div>
      <span class="kicker">{$t('auroraWorld1')} · {$t('level', { n: level.id })}</span>
      <h2>{$t(level.nameKey)}</h2>
    </div>
    <div class="counts">
      <span>{moves} {$t('auroraMoves')}</span>
      <span>{$t('auroraPar')} {level.par}</span>
    </div>
  </div>

  <div class="board-wrap">
    <div
      class="board"
      style={`grid-template-columns: repeat(${level.size}, minmax(0, 1fr));`}
      aria-label={`${$t(level.nameKey)} mirror board`}
    >
      <svg
        class="beam"
        viewBox={`0 0 ${level.size} ${level.size}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <polyline points={pointList} />
        {#each beam.hits as hit (hit)}
          {@const [r, c] = hit.split('-').map(Number)}
          <circle class="burst" cx={c + 0.5} cy={r + 0.5} r="0.34" />
        {/each}
      </svg>

      {#each cells as cell (cell.r * level.size + cell.c)}
        {@const key = keyOf(cell.r, cell.c)}
        {#if targetSet.has(key)}
          <span class="cell target" class:lit={beam.hits.includes(key)} aria-label="Crystal">✦</span>
        {:else if wallSet.has(key)}
          <span class="cell wall" aria-hidden="true">🧊</span>
        {:else if dirs[key]}
          <button
            class="cell mirror"
            type="button"
            onclick={() => rotate(cell.r, cell.c)}
            aria-label={`Rotate mirror row ${cell.r + 1}, column ${cell.c + 1}`}
          >
            {dirs[key] === '/' ? '╱' : '╲'}
          </button>
        {:else if cell.r === level.source.r && cell.c === 0}
          <span class="cell source" aria-label="Light source">☀</span>
        {:else}
          <span class="cell"></span>
        {/if}
      {/each}
    </div>
  </div>

  <div class="status" class:success={won} aria-live="polite">
    {#if won}
      {$t('auroraWin')}
    {:else}
      {$t('auroraHowBody')}
    {/if}
  </div>

  {#if won}
    <div class="result">
      <div class="stars" aria-label={`${stars} stars`}>
        {#each [1, 2, 3] as star (star)}
          <span class:on={star <= stars} aria-hidden="true">★</span>
        {/each}
      </div>
      <p>
        {moves}
        {$t('auroraMoves')} · {$t('auroraPar')}
        {level.par}
      </p>
      <div class="resultactions">
        <a
          class="btn primary"
          href={level.id < AURORA_LEVEL_COUNT
            ? `/games/aurora-mirrors/play/${level.id + 1}`
            : '/games/aurora-mirrors'}
        >
          {level.id < AURORA_LEVEL_COUNT ? $t('nextLevel') : $t('levelSelect')}
        </a>
        <button class="btn" type="button" onclick={reset}>{$t('retry')}</button>
      </div>
    </div>
  {:else}
    <div class="actions">
      <button class="mini" type="button" onclick={undo} disabled={!history.length}>{$t('undo')}</button>
      <button class="mini" type="button" onclick={reset}>{$t('reset')}</button>
    </div>
  {/if}
</section>

<style>
  .game {
    max-width: 620px;
    margin: 0 auto;
    padding: 16px;
    border-radius: var(--radius);
    border-color: rgba(94, 234, 212, 0.28);
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
    width: min(100%, 470px);
    aspect-ratio: 1;
    display: grid;
    border: 1px solid rgba(94, 234, 212, 0.34);
    border-radius: 18px;
    overflow: hidden;
    background: rgba(4, 22, 35, 0.84);
    box-shadow: inset 0 0 38px rgba(94, 234, 212, 0.04);
  }
  .cell {
    aspect-ratio: 1;
    position: relative;
    z-index: 1;
    display: grid;
    place-items: center;
    min-width: 0;
    border-right: 1px solid rgba(157, 228, 255, 0.09);
    border-bottom: 1px solid rgba(157, 228, 255, 0.09);
    color: var(--ink-soft);
    font-size: clamp(11px, 3.5vw, 24px);
    line-height: 1;
  }
  .cell:nth-child(7n) {
    border-right: 0;
  }
  .cell:nth-last-child(-n + 7) {
    border-bottom: 0;
  }
  .mirror {
    z-index: 4;
    cursor: pointer;
    color: var(--mint);
    background: rgba(94, 234, 212, 0.05);
    transition:
      background 0.12s ease,
      color 0.12s ease,
      transform 0.12s ease;
  }
  .mirror:hover {
    background: rgba(94, 234, 212, 0.13);
    color: #d8fff7;
  }
  .mirror:active {
    transform: scale(0.9);
  }
  .source {
    color: var(--gold);
    text-shadow: 0 0 14px rgba(251, 191, 36, 0.8);
  }
  .target {
    color: rgba(191, 243, 255, 0.34);
    transition:
      color 0.18s ease,
      text-shadow 0.18s ease;
  }
  .target.lit {
    color: #fff8c8;
    text-shadow:
      0 0 12px rgba(251, 191, 36, 0.95),
      0 0 30px rgba(251, 191, 36, 0.5);
  }
  .wall {
    background: rgba(125, 211, 252, 0.1);
    font-size: clamp(10px, 3vw, 19px);
  }
  .beam {
    position: absolute;
    inset: 0;
    z-index: 2;
    width: 100%;
    height: 100%;
    pointer-events: none;
    overflow: visible;
  }
  polyline {
    fill: none;
    stroke: #7dd3fc;
    stroke-width: 0.09;
    stroke-linecap: round;
    stroke-linejoin: round;
    filter: drop-shadow(0 0 4px #7dd3fc);
  }
  .burst {
    fill: rgba(255, 248, 200, 0.8);
    filter: drop-shadow(0 0 6px rgba(251, 191, 36, 0.9));
  }
  .status {
    min-height: 34px;
    color: var(--ink-soft);
    font-size: 12.5px;
    line-height: 1.4;
  }
  .status.success {
    color: var(--mint);
  }
  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
  .mini {
    min-height: 40px;
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
  .resultactions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
    margin-top: 2px;
  }
  .resultactions .btn {
    min-height: 42px;
    padding: 9px 15px;
    font-size: 12px;
  }
</style>
