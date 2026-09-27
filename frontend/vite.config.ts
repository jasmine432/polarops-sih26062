import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react()
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/auth': {
        target: 'http://127.0.0.1:8001',
        changeOrigin: true,
      },
      '/inventory': {
        target: 'http://127.0.0.1:8001',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://127.0.0.1:8001',
        changeOrigin: true,
      },
      '/cargo': {
        target: 'http://127.0.0.1:8001',
        changeOrigin: true,
      },
      '/expeditions': {
        target: 'http://127.0.0.1:8001',
        changeOrigin: true,
      },
      '/personnel': {
        target: 'http://127.0.0.1:8001',
        changeOrigin: true,
      },
      '/stations': {
        target: 'http://127.0.0.1:8001',
        changeOrigin: true,
      },
      '/vessels': {
        target: 'http://127.0.0.1:8001',
        changeOrigin: true,
      },
      '/tracking': {
        target: 'http://127.0.0.1:8001',
        changeOrigin: true,
      },
      '/emergency-incidents': {
        target: 'http://127.0.0.1:8001',
        changeOrigin: true,
      },
      '/alerts': {
        target: 'http://127.0.0.1:8001',
        changeOrigin: true,
      },
    },
  },
})
