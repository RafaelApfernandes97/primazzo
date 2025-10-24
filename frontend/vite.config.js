import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    // Allow specific hosts (e.g. ngrok) when using external tunneling
    allowedHosts: ['f3f5e5c7d0a2.ngrok-free.app'],
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
      ,
      '/arquivos': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
})
