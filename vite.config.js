import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';

export default defineConfig({
  plugins: [
    sveltekit(),
    SvelteKitPWA({
      registerType: 'autoUpdate',
      injectRegister: null,
      kit: {
        adapterFallback: 'index.html',
        // Let the plugin derive the fallback revision from _app/version.json.
        // A constant revision makes the precached HTML immortal across deploys,
        // so an old document keeps requesting chunks that no longer exist.
        spa: { fallbackMapping: '/' },
      },
      manifest: {
        name: 'Kids Games 6–10',
        short_name: 'Kids 6–10',
        description: 'Big-kid games for ages 6–10',
        theme_color: '#071a2b',
        background_color: '#04101f',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [{ src: '/icons/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
      },
      workbox: {
        globPatterns: [
          '**/*.{js,css,html,ico,png,svg,webp,jpg,jpeg,gif,mp3,wav,ogg,woff,woff2,webmanifest,json,txt}',
        ],
        globIgnores: ['**/.DS_Store', 'server/**', '**/*.map', '**/audio/preview.html'],
        navigateFallback: null,
        runtimeCaching: [
          {
            // Navigations always go to the network when it is available.
            // The precached shell is only a fallback for offline launches.
            // Caching HTML in a runtime cache can pair an old document with
            // new (or deleted) hashed chunks after a deploy.
            urlPattern: ({ url, sameOrigin }) =>
              sameOrigin &&
              (url.pathname === '/' ||
                url.pathname.startsWith('/games/') ||
                url.pathname.startsWith('/settings')),
            handler: 'NetworkOnly',
            options: {
              precacheFallback: { fallbackURL: '/' },
            },
          },
        ],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      },
    }),
  ],
});
