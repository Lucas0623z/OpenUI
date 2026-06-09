import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useStore } from '../store/useStore.js'
import { QuickEdit } from './QuickEdit.js'
import { AiChat } from './AiChat.js'
import { CodeView } from './CodeView.js'
import { CodeIcon, SettingsIcon, ChatIcon, CrosshairIcon } from './Icons.js'

type Tab = 'element' | 'quick' | 'ai'

export function InspectorPanel(): JSX.Element {
  const { t } = useTranslation()
  const selected = useStore((s) => s.selected)
  const panelWidth = useStore((s) => s.panelWidth)
  const [tab, setTab] = useState<Tab>('element')

  return (
    <aside className="panel" style={{ width: panelWidth }}>
      <nav className="panel__tabs">
        <span
          className="panel__tabs__thumb"
          style={{ transform: `translateX(${['element', 'quick', 'ai'].indexOf(tab) * 100}%)` }}
        />
        <button className={tab === 'element' ? 'active' : ''} onClick={() => setTab('element')}>
          <CodeIcon size={15} />
          {t('panel.element')}
        </button>
        <button className={tab === 'quick' ? 'active' : ''} onClick={() => setTab('quick')}>
          <SettingsIcon size={15} />
          {t('panel.quickEdit')}
        </button>
        <button className={tab === 'ai' ? 'active' : ''} onClick={() => setTab('ai')}>
          <ChatIcon size={15} />
          {t('panel.ai')}
        </button>
      </nav>

      {/* 「元素」= 代码查看器，铺满（去内边距）；快捷编辑 / AI 对话保持内边距 */}
      <div className={`panel__body ${tab === 'element' ? 'panel__body--flush' : ''}`}>
        {tab === 'element' && <CodeView />}
        {tab === 'quick' && (selected ? <QuickEdit /> : <Empty />)}
        {tab === 'ai' && (selected ? <AiChat /> : <Empty />)}
      </div>
    </aside>
  )
}

/** 两卡片之间的拖拽手柄：向左拖面板变宽、向右拖变窄 */
export function PanelResizer(): JSX.Element {
  const { t } = useTranslation()
  const panelWidth = useStore((s) => s.panelWidth)
  const setPanelWidth = useStore((s) => s.setPanelWidth)

  const onMouseDown = (e: React.MouseEvent): void => {
    e.preventDefault()
    const startX = e.clientX
    const startW = panelWidth
    // 拖动时盖一层透明遮罩，避免鼠标移到 webview 上时丢失事件
    const overlay = document.createElement('div')
    Object.assign(overlay.style, {
      position: 'fixed',
      inset: '0',
      zIndex: '9999',
      cursor: 'col-resize'
    } as CSSStyleDeclaration)
    document.body.appendChild(overlay)

    const onMove = (ev: MouseEvent): void => {
      const max = Math.round(window.innerWidth * 0.7)
      const w = Math.min(Math.max(320, startW + (startX - ev.clientX)), max)
      setPanelWidth(w)
    }
    const onUp = (): void => {
      overlay.remove()
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  return (
    <div
      className="panel__resizer"
      style={{ right: panelWidth + 11 }}
      onMouseDown={onMouseDown}
      title={t('controls.resize')}
    />
  )
}

function Empty(): JSX.Element {
  const { t } = useTranslation()
  return (
    <div className="panel__empty">
      <CrosshairIcon size={32} />
      <div>{t('panel.noSelection')}</div>
    </div>
  )
}
