<script>
  import { page } from '$app/state';
  import GameShell from '$lib/components/GameShell.svelte';
  import NumberIceGame from '$lib/number-ice/NumberIceGame.svelte';
  import { t } from '$lib/stores/locale';
  import { getNumberIceLevel, getNumberIceWorld } from '$lib/number-ice/levels.js';
  import {
    isNumberIceWorldUnlocked,
    loadNumberIceProgress,
    saveNumberIceStars,
  } from '$lib/number-ice/progress.js';

  const level = $derived(getNumberIceLevel(page.params.level));

  // Client-only route: progress lives in this browser.
  let progress = $state(loadNumberIceProgress());
  const unlocked = $derived(isNumberIceWorldUnlocked(progress, level.world));

  function complete(levelId, stars) {
    progress = saveNumberIceStars(levelId, stars);
  }
</script>

<svelte:head>
  <title
    >{$t('numberIceName')} · {$t(getNumberIceWorld(level.world).nameKey)} · {$t('level', {
      n: level.slot,
    })}</title
  >
</svelte:head>

<GameShell backHref="/games/number-ice" title={$t('numberIceName')}>
  {#if unlocked}
    {#key level.id}
      <NumberIceGame {level} onComplete={complete} />
    {/key}
  {:else}
    <div class="lockpanel glass">
      <span class="lockicon" aria-hidden="true">🔒</span>
      <p>{$t('numberIceLocked')}</p>
      <a class="btn primary" href="/games/number-ice">{$t('levelSelect')}</a>
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
