import type { FrameworkAdapter } from './types.js'
import { staticAdapter } from './static.js'

/**
 * 适配器注册表。后续新增 reactAdapter / vueAdapter 时，
 * 在这里登记即可，pickAdapter 会按 detect 分值选最合适的。
 */
const adapters: FrameworkAdapter[] = [staticAdapter]

export async function pickAdapter(rootDir: string): Promise<FrameworkAdapter> {
  let best: FrameworkAdapter = staticAdapter
  let bestScore = -1
  for (const a of adapters) {
    const score = await a.detect(rootDir)
    if (score > bestScore) {
      bestScore = score
      best = a
    }
  }
  return best
}

export { staticAdapter }
export type { FrameworkAdapter }
