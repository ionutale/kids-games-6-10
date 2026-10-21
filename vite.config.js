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
        spa: { fallbackMapping: '/', fallbackRevision: () => 'frost-breaker-spa' },
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
        navigateFallback: '/',
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      },
    }),
  ],
});
