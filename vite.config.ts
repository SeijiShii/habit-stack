import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // dev では SW を無効化（spec-review R2）
      devOptions: { enabled: false },
      manifest: {
        name: 'つみあげルーティン',
        short_name: 'つみあげ',
        description: '続けたい習慣を時間で記録して穏やかに振り返るアプリ。',
        lang: 'ja',
        theme_color: '#3F7A6E',
        background_color: '#FAF8F3',
        display: 'standalone',
        icons: [
          { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@db': new URL('./db', import.meta.url).pathname,
      '@': new URL('./src', import.meta.url).pathname,
    },
  },
});
