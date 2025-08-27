import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/balloonsApi": {
        target: "https://a.windbornesystems.com/treasure",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/balloonsApi/, '')
      },
      "/weatherApi": {
        target: `https://api.open-meteo.com/v1/forecast`,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/weatherApi/, '')
      }
    }
  }
})
