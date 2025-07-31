// frontend/vite.config.js
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  // Load env file from root directory
  const env = loadEnv(mode, path.resolve(__dirname, '..'), '')
  
  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: parseInt(env.FRONTEND_PORT) || 3000,
      allowedHosts: [
        'stockstrategy.info',
        'www.stockstrategy.info',
        'localhost',
        '127.0.0.1'
      ]
    },
    esbuild: {
      loader: 'jsx',
      include: /src\/.*\.[tj]sx?$/,
      exclude: []
    },
    optimizeDeps: {
      esbuildOptions: {
        loader: {
          '.js': 'jsx'
        }
      }
    },
    define: {
      // Make API_BASE_URL available to the frontend
      'import.meta.env.API_BASE_URL': JSON.stringify(env.API_BASE_URL || 'http://localhost:3001')
    }
  }
})
