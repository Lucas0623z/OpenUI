import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useStore } from '../store/useStore.js'
import { setupI18n } from '../i18n/index.js'
import { LANGUAGES } from '../i18n/languages.js'
import { CloseIcon } from './Icons.js'
import type { AppSettings } from '../../shared/types'

export function Settings(): JSX.Element {
  const { t } = useTranslation()
  const settings = useStore((s) => s.settings)
  const setSettings = useStore((s) => s.setSettings)
  const setSettingsOpen = useStore((s) => s.setSettingsOpen)
  const showToast = useStore((s) => s.showToast)

  const [draft, setDraft] = useState<AppSettings>(
    settings ?? {
      ai: { baseUrl: 'https://api.openai.com/v1', apiKey: '', model: 'gpt-4o-mini' },
      language: 'zh'
    }
  )

  const save = async (): Promise<void> => {
    const saved = await window.openui.setSettings(draft)
    setSettings(saved)
    setupI18n(saved.language)
    showToast(t('settings.saved'))
    setSettingsOpen(false)
  }

  const setAi = (patch: Partial<AppSettings['ai']>): void =>
    setDraft((d) => ({ ...d, ai: { ...d.ai, ...patch } }))

  return (
    <div className="modal" onClick={() => setSettingsOpen(false)}>
      <div className="modal__panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2>{t('settings.title')}</h2>
          <button
            className="btn btn--icon btn--ghost"
            onClick={() => setSettingsOpen(false)}
            title={t('settings.close')}
          >
            <CloseIcon size={16} />
          </button>
        </div>

        <label className="field field--col">
          <span className="field__label">{t('settings.language')}</span>
          <select
            value={draft.language}
            onChange={(e) => setDraft((d) => ({ ...d, language: e.target.value }))}
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </label>

        <div className="modal__section">{t('settings.aiSection')}</div>
        <p className="modal__hint">{t('settings.aiHint')}</p>

        <label className="field field--col">
          <span className="field__label">{t('settings.baseUrl')}</span>
          <input
            type="text"
            value={draft.ai.baseUrl}
            placeholder="https://api.openai.com/v1"
            onChange={(e) => setAi({ baseUrl: e.target.value })}
          />
        </label>

        <label className="field field--col">
          <span className="field__label">{t('settings.apiKey')}</span>
          <input
            type="password"
            value={draft.ai.apiKey}
            placeholder="sk-..."
            onChange={(e) => setAi({ apiKey: e.target.value })}
          />
        </label>

        <label className="field field--col">
          <span className="field__label">{t('settings.model')}</span>
          <input
            type="text"
            value={draft.ai.model}
            placeholder="gpt-4o-mini"
            onChange={(e) => setAi({ model: e.target.value })}
          />
        </label>

        <div className="modal__actions">
          <button className="btn btn--ghost" onClick={() => setSettingsOpen(false)}>
            {t('settings.close')}
          </button>
          <button className="btn btn--primary" onClick={save}>
            {t('settings.save')}
          </button>
        </div>
      </div>
    </div>
  )
}
