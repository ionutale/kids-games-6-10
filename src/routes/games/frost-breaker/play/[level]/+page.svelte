<script>
  import { page } from '$app/state';
  import { clampLevel } from '$lib/ladder/progress.js';
  import FrostGame from '$lib/components/FrostGame.svelte';

  const level = $derived(clampLevel(page.params.level));
</script>

<svelte:head>
  <title>Frost Breaker · Level {level}</title>
</svelte:head>

{#key level}
  <FrostGame {level} />
{/key}
