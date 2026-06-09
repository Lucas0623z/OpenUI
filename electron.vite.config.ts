import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

const root = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: { index: resolve(root, 'electron/main.ts') }
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: {
          index: resolve(root, 'electron/preload.ts'),
          'webview-preload': resolve(root, 'electron/webview-preload.ts')
        },
        // 输出 CommonJS：webview 是 sandbox 环境，preload 必须是 CJS（ESM 会被静默忽略）
        output: {
          format: 'cjs',
          entryFileNames: '[name].cjs'
        }
      }
    }
  },
  renderer: {
    root: root,
    resolve: {
      alias: {
        '@': resolve(root, 'src'),
        '@shared': resolve(root, 'shared')
      }
    },
    build: {
      rollupOptions: {
        input: { index: resolve(root, 'index.html') }
      }
    },
    plugins: [react()]
  }
})
