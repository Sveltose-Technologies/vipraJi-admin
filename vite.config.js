import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: 'https://vipradmin.vipraji.com/',
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://backend.vipraji.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
