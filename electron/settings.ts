import { app } from 'electron'
import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import type { AppSettings } from '../shared/types.js'
import { setMainLang } from './i18n.js'

const DEFAULTS: AppSettings = {
  ai: {
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    model: 'gpt-4o-mini'
  },
  language: 'zh'
}

function settingsPath(): string {
  return join(app.getPath('userData'), 'openui-settings.json')
}

/** 内存缓存，避免每次（启动 / getSettings / aiEdit）都读盘；saveSettings 时刷新 */
let cached: AppSettings | null = null

export async function loadSettings(): Promise<AppSettings> {
  if (cached) return cached
  try {
    const raw = await fs.readFile(settingsPath(), 'utf-8')
    const parsed = JSON.parse(raw)
    const s: AppSettings = {
      ai: { ...DEFAULTS.ai, ...(parsed.ai ?? {}) },
      language: typeof parsed.language === 'string' ? parsed.language : 'zh'
    }
    cached = s
    setMainLang(s.language)
    return s
  } catch {
    cached = { ...DEFAULTS, ai: { ...DEFAULTS.ai } }
    setMainLang(DEFAULTS.language)
    return cached
  }
}

export async function saveSettings(s: AppSettings): Promise<AppSettings> {
  const merged: AppSettings = {
    ai: { ...DEFAULTS.ai, ...s.ai },
    language: typeof s.language === 'string' ? s.language : 'zh'
  }
  await fs.writeFile(settingsPath(), JSON.stringify(merged, null, 2), 'utf-8')
  cached = merged
  setMainLang(merged.language)
  return merged
}
