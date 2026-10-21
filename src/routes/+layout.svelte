<script>
  import { onMount } from 'svelte';
  import { dev } from '$app/environment';
  import '@fontsource-variable/fredoka';
  import '../app.css';

  let { children } = $props();

  onMount(() => {
    if (!dev && 'serviceWorker' in navigator) {
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        refreshing = true;
        location.reload();
      });
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {});
    }
  });
</script>

<div class="app-bg"></div>
<div class="app-root">
  {@render children()}
</div>
