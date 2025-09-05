import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const TUNNEL_HOST = process.env.VITE_TUNNEL_HOST || 'localhost'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,            // allow LAN / tunnels
    port: 5173,            // keep dev port stable
    allowedHosts: [
      TUNNEL_HOST,
      'localhost',
      '127.0.0.1'
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
    // Optional: helps HMR via HTTPS tunnels (only if tunnel host is configured)
    hmr: TUNNEL_HOST !== 'localhost' ? {
      host: TUNNEL_HOST,
      protocol: 'wss',
      clientPort: 443,
    } : undefined,
  },
})
