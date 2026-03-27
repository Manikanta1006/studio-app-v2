import path from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const rootDir = path.resolve(__dirname, '..')
  const env = loadEnv(mode, rootDir, '')
  const apiPort = env.PORT || '5000'
  const apiTarget = `http://localhost:${apiPort}`

  return {
    plugins: [react()],
    envDir: rootDir,
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 3005,
      strictPort: false,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
        },
        '/uploads': {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
  }
})
