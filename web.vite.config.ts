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
      outDir: resolve(__dirname, 'web-server/dist/frontend'),
      emptyOutDir: true,
      chunkSizeWarningLimit: 2000,
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'editor-vendor': ['@tiptap/react', '@tiptap/core', '@tiptap/starter-kit'],
            'ui-vendor': ['lucide-react', 'react-hot-toast']
          }
        }
      }
    }
  }
})