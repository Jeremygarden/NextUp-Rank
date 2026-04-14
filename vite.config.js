import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon-32x32.png', 'apple-touch-icon.png', 'icon.svg'],
      manifest: {
        name: 'NextUp-Rank 台球积分',
        short_name: 'NextUp-Rank',
        description: '台球实时积分系统 — 打完即时更新排名',
        theme_color: '#020617',
        background_color: '#020617',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'pwa-512x512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        offlineGoogleAnalytics: false,
        // Serve offline.html for navigation requests that fail offline
        navigateFallback: '/offline.html',
        navigateFallbackDenylist: [/^\/rest\//, /^\/auth\//, /^\/functions\//],
        // Cache static assets aggressively; network-first for API calls
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            // Supabase API — network first, fall back to cache
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 5 },
              networkTimeoutSeconds: 10,
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: 3000,
    host: true,
    allowedHosts: ['3gvphs-3000.csb.app', '.csb.app']
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Split html-to-image into its own chunk (only loaded on share)
          if (id.includes('html-to-image')) return 'html-to-image'
          // Split Supabase into its own vendor chunk
          if (id.includes('@supabase')) return 'supabase'
          // Split React + React-DOM into vendor chunk
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) return 'react-vendor'
          // Split framer-motion separately (animation library)
          if (id.includes('framer-motion')) return 'framer-motion'
        }
      }
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test-setup.js',
  }
})
