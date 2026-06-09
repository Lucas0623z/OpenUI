/** 支持的界面语言（code 同时用于 i18n 资源键与持久化设置） */
export interface LanguageOption {
  code: string
  label: string
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English (United States)' },
  { code: 'zh', label: '中文（简体）' },
  { code: 'fr', label: 'Français (France)' },
  { code: 'de', label: 'Deutsch (Deutschland)' },
  { code: 'hi', label: 'हिन्दी (भारत)' },
  { code: 'id', label: 'Indonesia (Indonesia)' },
  { code: 'it', label: 'Italiano (Italia)' },
  { code: 'ja', label: '日本語 (日本)' },
  { code: 'ko', label: '한국어(대한민국)' },
  { code: 'pt-BR', label: 'Português (Brasil)' },
  { code: 'es-419', label: 'Español (Latinoamérica)' },
  { code: 'es', label: 'Español (España)' }
]

export const LANGUAGE_CODES: string[] = LANGUAGES.map((l) => l.code)
