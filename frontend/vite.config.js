// frontend/vite.config.js
import { defineConfig, loadEnv, transformWithOxc } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  // Load env file from root directory
  const env = loadEnv(mode, path.resolve(__dirname, '..'), '')
  const jsAsJsx = {
    name: 'project-js-as-jsx',
    enforce: 'pre',
    async transform(code, id) {
      if (!/\/src\/.*\.js$/.test(id)) return null
      return transformWithOxc(code, id, { lang: 'jsx', jsx: { runtime: 'automatic' }, sourcemap: true })
    }
  }
  
  return {
    envDir: path.resolve(__dirname, '..'),
    plugins: [jsAsJsx, react()],
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
    optimizeDeps: { rolldownOptions: { transform: { jsx: { runtime: 'automatic' } } } }
  }
})
