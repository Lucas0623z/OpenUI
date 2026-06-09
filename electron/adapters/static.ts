import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import type { FrameworkAdapter } from './types.js'
import { startServer } from '../server/staticServer.js'

/**
 * 静态站点适配器（MVP）：纯 HTML/CSS/JS，无构建步骤。
 */
export const staticAdapter: FrameworkAdapter = {
  kind: 'static',

  async detect(rootDir: string): Promise<number> {
    // 有 index.html 且没有明显的框架标记 -> 高分
    const hasIndex = await exists(join(rootDir, 'index.html'))
    if (!hasIndex) {
      // 仍可能是站点，给个兜底低分
      return 0.2
    }
    return 0.6
  },

  async start(rootDir: string): Promise<{ url: string; entry: string }> {
    return startServer(rootDir)
  }
}

async function exists(p: string): Promise<boolean> {
  try {
    await fs.access(p)
    return true
  } catch {
    return false
  }
}
