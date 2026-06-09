import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Sidebar } from './components/Sidebar.js'
import { Preview } from './components/Preview.js'
import { InspectorPanel, PanelResizer } from './components/InspectorPanel.js'
import { Settings } from './components/Settings.js'
import { Toast } from './components/Toast.js'
import { WindowControls } from './components/WindowControls.js'
import { SidebarIcon } from './components/Icons.js'
import { useStore } from './store/useStore.js'
import { reloadPreview } from './webviewBridge.js'

export function App(): JSX.Element {
  const { t } = useTranslation()
  const settingsOpen = useStore((s) => s.settingsOpen)
  const setProject = useStore((s) => s.setProject)
  const setSettingsOpen = useStore((s) => s.setSettingsOpen)
  const openProject = useStore((s) => s.openProject)
  const sidebarCollapsed = useStore((s) => s.sidebarCollapsed)
  const setSidebarCollapsed = useStore((s) => s.setSidebarCollapsed)

  useEffect(() => {
    window.openui.getProject().then((p) => {
      if (p) setProject(p)
    })
  }, [setProject])

  // 应用菜单命令（File 里的自定义项）
  useEffect(() => {
    return window.openui.onMenuCommand((cmd) => {
      if (cmd === 'new' || cmd === 'open') {
        openProject()
      } else if (cmd === 'settings') {
        setSettingsOpen(true)
      } else if (cmd === 'reload') {
        reloadPreview()
      }
    })
  }, [openProject, setSettingsOpen])

  return (
    <div className="app">
      <Sidebar />
      <main className="main">
        <div className="main__titlebar">
          {sidebarCollapsed && (
            <button
              className="btn btn--icon main__expand"
              title={t('controls.expand')}
              onClick={() => setSidebarCollapsed(false)}
            >
              <SidebarIcon size={18} />
            </button>
          )}
          <WindowControls />
        </div>
        <div className="main__body">
          <Preview />
          <PanelResizer />
          <InspectorPanel />
        </div>
      </main>
      {settingsOpen && <Settings />}
      <Toast />
    </div>
  )
}
