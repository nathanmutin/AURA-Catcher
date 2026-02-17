import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@aura-catcher/shared': path.resolve(__dirname, '../shared')
    }
  },
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        farmer: 'index_farmer.html'
      }
    }
  },
  server: {
    proxy: {
      '/photo': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/og-image': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  }
})
