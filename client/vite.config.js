import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'


import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vite.dev/config/

export default defineConfig({
  plugins: [react(), basicSsl()],

  server: {
    host: true, // Listen on all local IPs
    port: 5173,
    https: true,
    proxy: {
      '/socket.io': {
        target: 'https://silver-void.onrender.com',
        ws: true,
        changeOrigin: true
      },
      '/api': {
        target: 'https://silver-void.onrender.com',
        changeOrigin: true
      }
    }
  }
})
