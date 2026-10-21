<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { t } from '$lib/stores/locale';
  import { getLevel, getWorld, MAX_FROST_LEVEL } from '$lib/frost-breaker/levels.js';
  import { loadProgress, nextLevel, recordProgress } from '$lib/frost-breaker/progress.js';
  import { createFrostEngine } from '$lib/frost-breaker/engine.js';
  import SoundToggle from '$lib/components/SoundToggle.svelte';
  import WinOverlay from '$lib/components/WinOverlay.svelte';

  let { level = 1 } = $props();

  const PODS = [
    { id: 'spike', icon: '❄️', key: 'spike' },
    { id: 'ghost', icon: '👻', key: 'ghost' },
    { id: 'copter', icon: '🚁', key: 'copter' },
    { id: 'split', icon: '💠', key: 'split' },
  ];

  let host;
  let stage;
  let canvas;
  let engine = null;
  let resizeObserver = null;
  let toastTimer = 0;
  let reached90 = false;

  let result = $state(null);
  let progress = $state(loadProgress());
  let bestStars = $state(0);
  let toast = $state('');

  const levelNumber = $derived(getLevel(level).level);
  const world = $derived(getWorld(levelNumber));

  let hud = $state({
    level: 0,
    pct: 0,
    cleared: 0,
    total: 0,
    pods: { spike: 0, ghost: 0, copter: 0, split: 0 },
    selected: 'spike',
    phase: 'aiming',
    shotsFired: 0,
    ghostInFlight: false,
    stars: 0,
  });

  function fit() {
    if (!host || !stage) return;
    const s = Math.min(host.clientWidth / 720, host.clientHeight / 1280);
    const x = (host.clientWidth - 720 * s) / 2;
    const y = (host.clientHeight - 1280 * s) / 2;
    stage.style.transform = `translate(${x}px, ${y}px) scale(${s})`;
  }

  function handleState(next) {
    hud = next;
    if (next.phase === 'aiming' && next.pct >= 90 && !result && !reached90) {
      reached90 = true;
      showToast($t('keepGoing'));
    }
  }

  function handleResult(r) {
    result = r;
    if (r.win) {
      progress = recordProgress(level, r.stars);
      bestStars = progress.stars[level - 1] ?? r.stars;
    }
  }

  function showToast(text) {
    toast = text;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      toast = '';
      toastTimer = 0;
    }, 1900);
  }

  function retry() {
    result = null;
    reached90 = false;
    toast = '';
    engine?.reset();
  }

  function next() {
    const target = nextLevel(progress);
    if (target === level) goto('/games/frost-breaker');
    else goto(`/games/frost-breaker/play/${target}`);
  }

  function back() {
    goto('/games/frost-breaker');
  }

  function pick(id) {
    engine?.selectPod(id);
  }

  onMount(() => {
    progress = loadProgress();
    bestStars = progress.stars[level - 1] ?? 0;
    engine = createFrostEngine(canvas, { level, onState: handleState, onResult: handleResult });
    engine.start();
    fit();

    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(fit);
      resizeObserver.observe(host);
    }
    window.addEventListener('resize', fit);

    return () => {
      engine?.destroy();
      resizeObserver?.disconnect();
      window.removeEventListener('resize', fit);
      if (toastTimer) clearTimeout(toastTimer);
    };
  });
</script>

<div class="host" bind:this={host}>
  <div class="stage" bind:this={stage}>
    <canvas class="canvas" bind:this={canvas} aria-label={$t('frostName')}></canvas>

    <div class="hud">
      <header class="topbar">
        <a class="icon-btn" href="/games/frost-breaker" aria-label={$t('back')}>←</a>
        <div class="levelbox">
          <span class="kicker">{$t(world.nameKey)}</span>
          <span class="levelname">{$t('level', { n: level })}</span>
        </div>
        <SoundToggle />
      </header>

      <div class="pctwrap" aria-hidden="true">
        <div class="pctfill" style:width={`${Math.min(100, hud.pct)}%`}></div>
        <div class="notch" style:left="90%"></div>
        <div class="tick" style:left="95%"></div>
        <div class="tick" style:left="100%"></div>
      </div>
      <div class="pctmeta">
        <span><strong>{hud.pct}%</strong> {$t('iceCleared')}</span>
        <span>{$t('goal')}</span>
      </div>

      {#if hud.ghostInFlight}
        <div class="hint ghost">{$t('ghostHint')}</div>
      {:else if hud.phase === 'aiming' && hud.shotsFired === 0}
        <div class="hint">{$t('howToDrag')}</div>
      {/if}

      {#if toast}
        <div class="toast">{toast}</div>
      {/if}

      <div class="tray">
        {#each PODS as pod (pod.id)}
          <button
            class="pod"
            class:selected={hud.selected === pod.id}
            class:empty={hud.pods[pod.id] <= 0}
            type="button"
            disabled={hud.phase !== 'aiming' || hud.pods[pod.id] <= 0}
            aria-pressed={hud.selected === pod.id}
            onclick={() => pick(pod.id)}
          >
            <span class="podicon">{pod.icon}</span>
            <span class="podname">{$t(pod.key)}</span>
            <span class="podcount">{hud.pods[pod.id]}</span>
          </button>
        {/each}
      </div>

      <WinOverlay
        {result}
        {level}
        {bestStars}
        maxLevel={MAX_FROST_LEVEL}
        campaignComplete={progress.completed.every(Boolean)}
        hasNext={nextLevel(progress) !== level}
        onRetry={retry}
        onNext={next}
        onBack={back}
      />
    </div>
  </div>
</div>

<style>
  .host {
    position: absolute;
    inset: 0;
    overflow: hidden;
  }
  .stage {
    position: absolute;
    top: 0;
    left: 0;
    width: 720px;
    height: 1280px;
    transform-origin: top left;
    overflow: hidden;
    border-radius: 30px;
    background: #04101f;
    box-shadow: 0 30px 90px rgba(0, 0, 0, 0.65);
  }
  .canvas {
    position: absolute;
    inset: 0;
    width: 720px;
    height: 1280px;
    display: block;
    touch-action: none;
  }
  .hud {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 2;
  }
  .hud > * {
    pointer-events: auto;
  }

  .topbar {
    position: absolute;
    top: 24px;
    left: 28px;
    right: 28px;
    display: flex;
    align-items: center;
    gap: 13px;
  }
  .levelbox {
    display: flex;
    flex-direction: column;
    gap: 1px;
    flex: 1;
    min-width: 0;
  }
  .kicker {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 2.4px;
    text-transform: uppercase;
    color: #83bdd2;
  }
  .levelname {
    font-size: 31px;
    font-weight: 800;
    letter-spacing: -0.7px;
    line-height: 1.05;
    text-shadow: 0 0 24px rgba(125, 211, 252, 0.35);
  }

  .pctwrap {
    position: absolute;
    top: 88px;
    left: 28px;
    right: 28px;
    height: 18px;
    border-radius: 999px;
    background: rgba(2, 14, 24, 0.86);
    border: 1px solid rgba(157, 228, 255, 0.22);
    overflow: hidden;
    box-shadow: inset 0 0 16px rgba(0, 0, 0, 0.45);
    pointer-events: none;
  }
  .pctfill {
    height: 100%;
    border-radius: 999px;
    background: linear-gradient(90deg, #2dd4bf, #7dd3fc 58%, #f7d774);
    box-shadow: 0 0 18px rgba(125, 211, 252, 0.45);
    transition: width 0.16s ease-out;
  }
  .notch {
    position: absolute;
    top: -4px;
    bottom: -4px;
    width: 3px;
    border-radius: 2px;
    background: var(--gold);
    box-shadow: 0 0 12px rgba(251, 191, 36, 0.9);
  }
  .tick {
    position: absolute;
    top: 2px;
    bottom: 2px;
    width: 1px;
    background: rgba(255, 255, 255, 0.16);
  }
  .pctmeta {
    position: absolute;
    top: 112px;
    left: 28px;
    right: 28px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: #93c5d8;
    font-size: 12.5px;
    font-weight: 600;
    letter-spacing: 0.25px;
    pointer-events: none;
  }
  .pctmeta strong {
    color: #d9f7ff;
    font-weight: 800;
  }

  .hint {
    position: absolute;
    top: 140px;
    left: 30px;
    right: 30px;
    text-align: center;
    font-size: 14px;
    font-weight: 650;
    letter-spacing: 0.2px;
    color: #a8d9e9;
    text-shadow: 0 2px 12px rgba(0, 0, 0, 0.7);
    pointer-events: none;
  }
  .hint.ghost {
    color: #c4b5fd;
  }

  .toast {
    position: absolute;
    top: 184px;
    left: 50%;
    transform: translateX(-50%);
    padding: 9px 16px;
    border-radius: 999px;
    background: rgba(8, 28, 46, 0.9);
    border: 1px solid rgba(251, 191, 36, 0.4);
    color: #ffe6a3;
    font-size: 14px;
    font-weight: 700;
    white-space: nowrap;
    pointer-events: none;
    z-index: 4;
  }

  .tray {
    position: absolute;
    left: 26px;
    right: 26px;
    bottom: 18px;
    display: flex;
    justify-content: center;
    gap: 13px;
    padding: 10px 12px;
    border-radius: 28px;
    background: rgba(5, 20, 34, 0.62);
    border: 1px solid rgba(157, 228, 255, 0.16);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    box-shadow: 0 12px 34px rgba(0, 0, 0, 0.38);
  }
  .pod {
    position: relative;
    width: 132px;
    height: 104px;
    border-radius: 21px;
    border: 1px solid rgba(157, 228, 255, 0.16);
    background: rgba(9, 33, 53, 0.74);
    color: var(--ink);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    cursor: pointer;
    touch-action: manipulation;
    transition:
      transform 0.12s var(--ease),
      border-color 0.15s ease,
      background 0.15s ease,
      box-shadow 0.15s ease;
  }
  .pod:active {
    transform: scale(0.95);
  }
  .pod.selected {
    border-color: rgba(125, 211, 252, 0.95);
    background: rgba(18, 57, 84, 0.92);
    box-shadow:
      0 0 0 2px rgba(125, 211, 252, 0.16),
      0 0 24px rgba(125, 211, 252, 0.32);
  }
  .pod.empty {
    opacity: 0.28;
  }
  .pod:disabled {
    cursor: default;
  }
  .podicon {
    font-size: 31px;
    line-height: 1;
    filter: drop-shadow(0 0 8px rgba(125, 211, 252, 0.45));
  }
  .podname {
    font-size: 12.5px;
    font-weight: 700;
    color: #b9dfec;
    letter-spacing: 0.3px;
  }
  .podcount {
    position: absolute;
    top: 8px;
    right: 9px;
    min-width: 23px;
    height: 23px;
    padding: 0 6px;
    border-radius: 999px;
    background: rgba(2, 14, 24, 0.9);
    border: 1px solid rgba(157, 228, 255, 0.28);
    color: #eaf8ff;
    font-size: 12px;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>
