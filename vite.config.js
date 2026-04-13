import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
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
