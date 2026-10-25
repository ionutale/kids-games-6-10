<script>
  import { page } from '$app/state';
  import GameShell from '$lib/components/GameShell.svelte';
  import AuroraGame from '$lib/aurora/AuroraGame.svelte';
  import { t } from '$lib/stores/locale';
  import { getAuroraLevel, getAuroraWorld } from '$lib/aurora/levels.js';
  import { isAuroraWorldUnlocked, loadAuroraProgress, saveAuroraStars } from '$lib/aurora/progress.js';

  const level = $derived(getAuroraLevel(page.params.level));

  // Client-only route: progress lives in this browser.
  let progress = $state(loadAuroraProgress());
  const unlocked = $derived(isAuroraWorldUnlocked(progress, level.world));

  function complete(levelId, stars) {
    progress = saveAuroraStars(levelId, stars);
  }
</script>

<svelte:head>
  <title
    >{$t('auroraName')} · {$t(getAuroraWorld(level.world).nameKey)} · {$t('level', { n: level.slot })}</title
  >
</svelte:head>

<GameShell backHref="/games/aurora-mirrors" title={$t('auroraName')}>
  {#if unlocked}
    {#key level.id}
      <AuroraGame {level} onComplete={complete} />
    {/key}
  {:else}
    <div class="lockpanel glass">
      <span class="lockicon" aria-hidden="true">🔒</span>
      <p>{$t('auroraLocked')}</p>
      <a class="btn primary" href="/games/aurora-mirrors">{$t('levelSelect')}</a>
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
