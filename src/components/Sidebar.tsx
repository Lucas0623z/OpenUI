import { useTranslation } from 'react-i18next'
import { useStore } from '../store/useStore.js'
import { reloadPreview } from '../webviewBridge.js'
import {
  MenuIcon,
  SidebarIcon,
  SearchIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  FolderIcon,
  CrosshairIcon,
  RefreshIcon,
  SettingsIcon
} from './Icons.js'

/**
 * Claude Code 风格的左侧栏：与主体一体（没有横贯全宽的顶栏横条）。
 * 顶部一排控制按钮（占位 + 可拖动区），下方是 OpenUI 的操作项。
 */
export function Sidebar(): JSX.Element {
  const { t } = useTranslation()
  const project = useStore((s) => s.project)
  const openProject = useStore((s) => s.openProject)
  const inspectEnabled = useStore((s) => s.inspectEnabled)
  const setInspectEnabled = useStore((s) => s.setInspectEnabled)
  const setSettingsOpen = useStore((s) => s.setSettingsOpen)
  const sidebarCollapsed = useStore((s) => s.sidebarCollapsed)
  const setSidebarCollapsed = useStore((s) => s.setSidebarCollapsed)

  const projectName = project ? project.rootDir.split(/[\\/]/).pop() : null

  return (
    <aside className={`sidebar ${sidebarCollapsed ? 'sidebar--collapsed' : ''}`}>
      <div className="sidebar__controls">
        <button
          className="btn btn--icon"
          title={t('controls.menu')}
          onClick={() => window.openui.popupMenu()}
        >
          <MenuIcon size={18} />
        </button>
        <button
          className="btn btn--icon"
          title={t('controls.collapse')}
          onClick={() => setSidebarCollapsed(true)}
        >
          <SidebarIcon size={18} />
        </button>
        <button className="btn btn--icon" title={t('controls.search')}>
          <SearchIcon size={18} />
        </button>
        <span className="sidebar__divider" />
        <button
          className="btn btn--icon"
          title={t('controls.undo')}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => window.openui.undo()}
        >
          <ArrowLeftIcon size={18} />
        </button>
        <button
          className="btn btn--icon"
          title={t('controls.redo')}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => window.openui.redo()}
        >
          <ArrowRightIcon size={18} />
        </button>
      </div>

      <div className="sidebar__content">
        <button className="sidebar__item" onClick={openProject}>
          <FolderIcon size={16} />
          {t('toolbar.openFolder')}
        </button>

        <button
          className={`sidebar__item ${inspectEnabled ? 'sidebar__item--active' : ''}`}
          disabled={!project}
          onClick={() => setInspectEnabled(!inspectEnabled)}
        >
          <CrosshairIcon size={16} />
          {inspectEnabled ? t('toolbar.inspectOn') : t('toolbar.inspect')}
        </button>

        <button className="sidebar__item" disabled={!project} onClick={() => reloadPreview()}>
          <RefreshIcon size={16} />
          {t('toolbar.refresh')}
        </button>

        <div className="sidebar__spacer" />

        {project && (
          <div className="sidebar__project">
            <span className="sidebar__project-name" title={project.rootDir}>
              {projectName}
            </span>
            <span className="badge">{project.adapter}</span>
          </div>
        )}

        <button className="sidebar__item" onClick={() => setSettingsOpen(true)}>
          <SettingsIcon size={16} />
          {t('toolbar.settings')}
        </button>
      </div>
    </aside>
  )
}
