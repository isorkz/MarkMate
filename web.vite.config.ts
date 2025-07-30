import { resolve } from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  return {
    root: 'src/renderer',
    base: './',
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [react()],
    define: {
      __IS_WEB__: mode === 'web'
    },
    build: {
      outDir: resolve(__dirname, 'dist-web'),
      emptyOutDir: true
    }
  }
})