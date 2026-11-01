import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { shortLinkNavigationPatterns } from './utils/hybridRoutes';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        workbox: {
          // Short links and API calls must reach the server: answering them
          // with the cached app sent bare codes to the homepage and skipped
          // the server redirect for anyone who had visited before.
          navigateFallbackDenylist: [/^\/api\//, ...shortLinkNavigationPatterns()],
        },
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
        devOptions: {
          enabled: true,
          type: 'module',
        },
        manifest: {
          name: 'Gather - AI Link Manager',
          short_name: 'Gather',
          description: 'The intelligent link management platform for creators and businesses.',
          theme_color: '#FDFBF7',
          background_color: '#FDFBF7',
          display: 'standalone',
          icons: [
            {
              src: 'pwa-icon.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        }
      })
    ],
    build: {
      rollupOptions: {
        output: {
          entryFileNames: `assets/[name]-[hash]-${Date.now()}.js`,
          chunkFileNames: `assets/[name]-[hash]-${Date.now()}.js`,
          assetFileNames: `assets/[name]-[hash].[ext]`,
          manualChunks: {
            vendor: ['react', 'react-dom'],
            router: ['react-router-dom'],
            framer: ['framer-motion'],
            charts: ['recharts'],
            icons: ['lucide-react'],
            supabase: ['@supabase/supabase-js'],
          },
        },
      },
    },
    // SECURITY: Never inline GEMINI_API_KEY (or any secret) into the client
    // bundle via `define`. All AI calls go through /api/ai/* server endpoints.
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./test/setup.ts'],
      // e2e/ holds Playwright specs; they run with `npm run test:e2e`, not vitest.
      exclude: ['**/node_modules/**', '**/dist/**', 'e2e/**'],
    },
  };
});
