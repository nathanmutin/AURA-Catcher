import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Doit rester synchronisé avec le "paths" de tsconfig.app.json.
      '@shared/types': fileURLToPath(new URL('../backend/src/types.ts', import.meta.url)),
    },
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
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom', '@tanstack/react-query'],
          leaflet: ['leaflet', 'react-leaflet', 'leaflet.locatecontrol'],
          icons: ['lucide-react', '@icons-pack/react-simple-icons'],
          utils: ['exifr']
        }
      }
    }
  }
})
