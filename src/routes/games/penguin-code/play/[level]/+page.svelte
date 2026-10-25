<script>
  import { page } from '$app/state';
  import GameShell from '$lib/components/GameShell.svelte';
  import PenguinCodeGame from '$lib/penguin-code/PenguinCodeGame.svelte';
  import { t } from '$lib/stores/locale';
  import { getPenguinLevel, getPenguinWorld } from '$lib/penguin-code/levels.js';
  import {
    isPenguinWorldUnlocked,
    loadPenguinProgress,
    savePenguinStars,
  } from '$lib/penguin-code/progress.js';

  const level = $derived(getPenguinLevel(page.params.level));

  // Client-only route: progress lives in this browser.
  let progress = $state(loadPenguinProgress());
  const unlocked = $derived(isPenguinWorldUnlocked(progress, level.world));

  function complete(levelId, stars) {
    progress = savePenguinStars(levelId, stars);
  }
</script>

<svelte:head>
  <title
    >{$t('penguinCodeName')} · {$t(getPenguinWorld(level.world).nameKey)} · {$t('level', {
      n: level.slot,
    })}</title
  >
</svelte:head>

<GameShell backHref="/games/penguin-code" title={$t('penguinCodeName')}>
  {#if unlocked}
    {#key level.id}
      <PenguinCodeGame {level} onComplete={complete} />
    {/key}
  {:else}
    <div class="lockpanel glass">
      <span class="lockicon" aria-hidden="true">🔒</span>
      <p>{$t('penguinCodeLocked')}</p>
      <a class="btn primary" href="/games/penguin-code">{$t('levelSelect')}</a>
    </div>
  {/if}
</GameShell>

<style>
  .lockpanel {
    max-width: 620px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 24px 18px;
    border-radius: var(--radius);
    text-align: center;
  }
  .lockicon {
    font-size: 30px;
    line-height: 1;
  }
  .lockpanel p {
    color: var(--ink-soft);
    font-size: 12.5px;
    line-height: 1.4;
  }
</style>
