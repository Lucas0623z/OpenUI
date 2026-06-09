import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useStore } from '../store/useStore.js'
import { sendPreviewStyle, reloadPreview } from '../webviewBridge.js'
import { CheckIcon, CodeIcon } from './Icons.js'
import type { QuickEditChange } from '../../shared/types'

function rgbToHex(rgb: string): string {
  const m = rgb.match(/rgba?\(([^)]+)\)/)
  if (!m) return /^#/.test(rgb) ? rgb : '#000000'
  const [r, g, b] = m[1].split(',').map((n) => parseInt(n.trim(), 10))
  const h = (n: number): string => Math.max(0, Math.min(255, n || 0)).toString(16).padStart(2, '0')
  return `#${h(r)}${h(g)}${h(b)}`
}

function parsePx(v: string): number {
  const n = parseFloat(v)
  return Number.isNaN(n) ? 0 : Math.round(n)
}

export function QuickEdit(): JSX.Element {
  const { t } = useTranslation()
  const el = useStore((s) => s.selected)!
  const showToast = useStore((s) => s.showToast)
  const [draft, setDraft] = useState<Record<string, string>>({})

  useEffect(() => {
    setDraft({})
  }, [el.uid])

  const cs = el.computedStyles
  const cur = (prop: string, fallback: string): string => draft[prop] ?? fallback

  const update = (property: string, value: string): void => {
    const next = { ...draft, [property]: value }
    setDraft(next)
    sendPreviewStyle(el.uid, [{ property, value }])
  }

  const apply = async (): Promise<void> => {
    if (!el.loc) {
      showToast(t('quick.needLoc'))
      return
    }
    const changes: QuickEditChange[] = Object.entries(draft).map(([property, value]) => ({
      property,
      value
    }))
    if (changes.length === 0) return
    const res = await window.openui.applyStyle({ loc: el.loc, uid: el.uid, changes })
    if (res.ok) {
      showToast(t('quick.applied'))
      reloadPreview()
    } else {
      showToast(res.error || 'error')
    }
  }

  return (
    <div className="quick">
      <div className="quick__note">
        <CodeIcon size={15} />
        <span>{t('quick.note')}</span>
      </div>

      <Field label={t('quick.textColor')}>
        <input
          type="color"
          value={rgbToHex(cur('color', cs.color))}
          onChange={(e) => update('color', e.target.value)}
        />
      </Field>

      <Field label={t('quick.bgColor')}>
        <input
          type="color"
          value={rgbToHex(cur('background-color', cs['background-color']))}
          onChange={(e) => update('background-color', e.target.value)}
        />
      </Field>

      <Field label={t('quick.fontSize')}>
        <input
          type="range"
          min={8}
          max={72}
          value={parsePx(cur('font-size', cs['font-size']))}
          onChange={(e) => update('font-size', `${e.target.value}px`)}
        />
        <span className="quick__val">{cur('font-size', cs['font-size'])}</span>
      </Field>

      <Field label={t('quick.radius')}>
        <input
          type="range"
          min={0}
          max={48}
          value={parsePx(cur('border-radius', cs['border-radius']))}
          onChange={(e) => update('border-radius', `${e.target.value}px`)}
        />
        <span className="quick__val">{cur('border-radius', cs['border-radius'])}</span>
      </Field>

      <Field label={t('quick.width')}>
        <input
          type="text"
          value={cur('width', cs.width)}
          onChange={(e) => update('width', e.target.value)}
        />
      </Field>

      <Field label={t('quick.height')}>
        <input
          type="text"
          value={cur('height', cs.height)}
          onChange={(e) => update('height', e.target.value)}
        />
      </Field>

      <Field label={t('quick.padding')}>
        <input
          type="text"
          value={cur('padding', cs.padding)}
          onChange={(e) => update('padding', e.target.value)}
        />
      </Field>

      <button className="btn btn--primary quick__apply" onClick={apply}>
        <CheckIcon size={15} />
        {t('quick.apply')}
      </button>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }): JSX.Element {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      <span className="field__control">{children}</span>
    </label>
  )
}
