<script>
  import { page } from '$app/state';
  import GameShell from '$lib/components/GameShell.svelte';
  import AuroraGame from '$lib/aurora/AuroraGame.svelte';
  import { t } from '$lib/stores/locale';
  import { getAuroraLevel } from '$lib/aurora/levels.js';
  import { saveAuroraStars } from '$lib/aurora/progress.js';

  const level = $derived(getAuroraLevel(page.params.level));

  function complete(levelId, stars) {
    saveAuroraStars(levelId, stars);
  }
</script>

<svelte:head>
  <title>{$t('auroraName')} · {$t('level', { n: level.id })}</title>
</svelte:head>

<GameShell backHref="/games/aurora-mirrors" title={$t('auroraName')}>
  {#key level.id}
    <AuroraGame {level} onComplete={complete} />
  {/key}
</GameShell>
