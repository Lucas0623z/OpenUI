import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useStore } from '../store/useStore.js'
import { setWebview, setInspectMode, type WebviewEl } from '../webviewBridge.js'
import { FolderIcon } from './Icons.js'
import type { SelectedElement } from '../../shared/types'

function toFileUrl(p: string): string {
  // D:\a\b.mjs -> file:///D:/a/b.mjs
  return 'file:///' + p.replace(/\\/g, '/')
}

export function Preview(): JSX.Element {
  const { t, i18n } = useTranslation()
  const project = useStore((s) => s.project)
  const inspectEnabled = useStore((s) => s.inspectEnabled)
  const setSelected = useStore((s) => s.setSelected)
  const panelWidth = useStore((s) => s.panelWidth)
  const openProject = useStore((s) => s.openProject)

  const ref = useRef<WebviewEl | null>(null)
  const [preloadUrl, setPreloadUrl] = useState<string | null>(null)

  useEffect(() => {
    window.openui.webviewPreloadPath().then((p) => setPreloadUrl(toFileUrl(p)))
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    setWebview(el)

    const loadCode = (el: SelectedElement): void => {
      if (!el.loc) {
        useStore.getState().setCodeFile(null)
        return
      }
      const file = el.loc.file
      const cur = useStore.getState().codeFile
      if (cur && cur.path === file) return // 同文件已加载，仅高亮行变化
      window.openui
        .readFile(file)
        .then((content) => useStore.getState().setCodeFile({ path: file, content }))
        .catch(() => {})
    }

    const onIpc = (e: Event): void => {
      const ev = e as unknown as { channel: string; args: unknown[] }
      if (ev.channel === 'inspect:select') {
        const sel = ev.args[0] as SelectedElement
        setSelected(sel) // 单击 = 锁定（稳定保持，供快捷编辑 / AI 使用）
        loadCode(sel)
      } else if (ev.channel === 'inspect:hover') {
        const hov = ev.args[0] as SelectedElement
        useStore.getState().setHovered(hov)
        // 未锁定（没单击选中）时，代码跟随悬停
        if (!useStore.getState().selected) loadCode(hov)
      } else if (ev.channel === 'inspect:ready') {
        setInspectMode(useStore.getState().inspectEnabled)
      }
    }
    const onDomReady = (): void => setInspectMode(useStore.getState().inspectEnabled)
    const onFail = (e: Event): void => {
      const ev = e as unknown as { errorCode: number; errorDescription: string; validatedURL?: string }
      if (ev.errorCode === -3) return // ERR_ABORTED：正常导航中断，忽略
      // 用 i18n.t（实时读当前语言），避免闭包里捕获到切换前的旧 t
      useStore.getState().showToast(`${i18n.t('preview.loadFailed')} [${ev.errorCode}] ${ev.errorDescription}`)
    }

    el.addEventListener('ipc-message', onIpc)
    el.addEventListener('dom-ready', onDomReady)
    el.addEventListener('did-fail-load', onFail)
    return () => {
      el.removeEventListener('ipc-message', onIpc)
      el.removeEventListener('dom-ready', onDomReady)
      el.removeEventListener('did-fail-load', onFail)
      setWebview(null)
    }
  }, [setSelected, preloadUrl, project])

  useEffect(() => {
    setInspectMode(inspectEnabled)
  }, [inspectEnabled])

  if (!project) {
    return (
      <div className="preview preview--empty" style={{ marginRight: panelWidth - 16 }}>
        <div className="welcome">
          <h1>{t('welcome.title')}</h1>
          <p>{t('welcome.desc')}</p>
          <button className="btn btn--primary" onClick={openProject}>
            <FolderIcon size={15} />
            {t('welcome.cta')}
          </button>
          <span className="welcome__hint">{t('welcome.hint')}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="preview" style={{ marginRight: panelWidth - 16 }}>
      {preloadUrl && (
        <webview
          ref={ref as unknown as React.RefObject<HTMLElement>}
          src={`${project.serverUrl}/`}
          preload={preloadUrl}
          webpreferences="contextIsolation=yes,nodeIntegration=no"
          partition="persist:openui-preview"
          style={{ width: '100%', height: '100%', border: 'none', display: 'flex' }}
        />
      )}
    </div>
  )
}
