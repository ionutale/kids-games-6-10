<script>
  import { page } from '$app/state';
  import { t } from '$lib/stores/locale';
  import { clampFrostLevel, getWorld } from '$lib/frost-breaker/levels.js';
  import FrostGame from '$lib/components/FrostGame.svelte';

  const level = $derived(clampFrostLevel(page.params.level));
  const world = $derived(getWorld(level));
</script>

<svelte:head>
  <title>Frost Breaker · {$t(world.nameKey)} · Level {level}</title>
</svelte:head>

{#key level}
  <FrostGame {level} />
{/key}
