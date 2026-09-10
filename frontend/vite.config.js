import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Le backend ecoute sur 8080 par defaut ; VITE_API_TARGET permet de viser une
// autre instance (port different, backend distant) sans modifier ce fichier.
const apiTarget = process.env.VITE_API_TARGET || 'http://localhost:8080'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: apiTarget, changeOrigin: true },
      '/files': { target: apiTarget, changeOrigin: true },
    },
  },
})
