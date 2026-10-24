<script>
  import { onMount } from 'svelte';
  import { dev } from '$app/environment';
  import '@fontsource-variable/fredoka';
  import '../app.css';

  let { children } = $props();

  onMount(() => {
    window.__frostBooted?.();

    if (!dev && 'serviceWorker' in navigator) {
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        refreshing = true;
        location.reload();
      });
      navigator.serviceWorker
        .register('/sw.js', { scope: '/', updateViaCache: 'none' })
        .then((registration) => {
          const update = () => registration.update().catch(() => {});
          update();
          document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') update();
          });
        })
        .catch(() => {});
    }
  });
</script>

<div class="app-bg"></div>
<div class="app-root">
  {@render children()}
</div>
