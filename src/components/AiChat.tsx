import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useStore } from '../store/useStore.js'
import { reloadPreview } from '../webviewBridge.js'
import { ArrowUpIcon, CheckIcon, CloseIcon } from './Icons.js'
import type { AiEditResult } from '../../shared/types'

interface ChatItem {
  role: 'user' | 'ai'
  text: string
  proposal?: AiEditResult
}

export function AiChat(): JSX.Element {
  const { t } = useTranslation()
  const el = useStore((s) => s.selected)!
  const showToast = useStore((s) => s.showToast)
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [history, setHistory] = useState<ChatItem[]>([])

  const send = async (): Promise<void> => {
    const instruction = input.trim()
    if (!instruction || busy) return
    if (!el.loc) {
      showToast(t('quick.needLoc'))
      return
    }
    setInput('')
    setHistory((h) => [...h, { role: 'user', text: instruction }])
    setBusy(true)
    try {
      const fileContent = await window.openui.readFile(el.loc.file)
      const result = await window.openui.aiEdit({
        instruction,
        element: el,
        fileContent,
        filePath: el.loc.file
      })
      if (result.error) {
        setHistory((h) => [...h, { role: 'ai', text: `${t('ai.error')}: ${result.error}` }])
      } else if (!result.ok || !result.newContent) {
        setHistory((h) => [...h, { role: 'ai', text: result.explanation || t('ai.noChange') }])
      } else {
        setHistory((h) => [
          ...h,
          { role: 'ai', text: result.explanation || t('ai.proposal'), proposal: result }
        ])
      }
    } finally {
      setBusy(false)
    }
  }

  const applyProposal = async (p: AiEditResult): Promise<void> => {
    if (!p.newContent) return
    const res = await window.openui.applyAiEdit(p.filePath, p.newContent)
    if (res.ok) {
      showToast(t('ai.applied'))
      reloadPreview()
      setHistory((h) => h.map((it) => (it.proposal === p ? { ...it, proposal: undefined } : it)))
    } else {
      showToast(res.error || 'error')
    }
  }

  const discard = (p: AiEditResult): void => {
    setHistory((h) => h.map((it) => (it.proposal === p ? { ...it, proposal: undefined } : it)))
  }

  return (
    <div className="chat">
      <div className="chat__target">
        {t('panel.selector')}: <code>{el.selector}</code>
      </div>

      <div className="chat__log">
        {history.map((it, i) => (
          <div key={i} className={`msg msg--${it.role}`}>
            <div className="msg__text">{it.text}</div>
            {it.proposal && (
              <div className="msg__actions">
                <button
                  className="btn btn--primary btn--sm"
                  onClick={() => applyProposal(it.proposal!)}
                >
                  <CheckIcon size={14} />
                  {t('ai.applyChange')}
                </button>
                <button className="btn btn--ghost btn--sm" onClick={() => discard(it.proposal!)}>
                  <CloseIcon size={14} />
                  {t('ai.discard')}
                </button>
              </div>
            )}
          </div>
        ))}
        {busy && (
          <div className="msg msg--ai msg--thinking">
            <span className="thinking-dots">
              <span />
              <span />
              <span />
            </span>
            {t('ai.thinking')}
          </div>
        )}
      </div>

      <div className="chat__input">
        <textarea
          rows={2}
          value={input}
          placeholder={t('ai.placeholder')}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              send()
            }
          }}
        />
        <button
          className="chat__send"
          disabled={busy || !input.trim()}
          onClick={send}
          title={t('ai.send')}
        >
          <ArrowUpIcon size={18} />
        </button>
      </div>
    </div>
  )
}
