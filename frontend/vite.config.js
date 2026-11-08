import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const currentDir = path.dirname(fileURLToPath(import.meta.url))
const keyPath = path.resolve(currentDir, 'localhost-key.pem')
const certPath = path.resolve(currentDir, 'localhost.pem')
const hasCertificates = fs.existsSync(keyPath) && fs.existsSync(certPath)

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    https: hasCertificates
      ? {
          key: fs.readFileSync(keyPath),
          cert: fs.readFileSync(certPath),
        }
      : false,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          leaflet: ['leaflet', 'react-leaflet'],
          ui: ['lucide-react', 'framer-motion', 'react-hot-toast'],
          realtime: ['pusher-js', 'axios'],
        },
      },
    },
  },
})
