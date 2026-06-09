import { create } from 'zustand'
import type { ProjectState, SelectedElement, AppSettings } from '../../shared/types'

/** 当前在「元素」面板里展示的源码文件 */
interface CodeFile {
  path: string
  content: string
}

interface AppState {
  project: ProjectState | null
  /** 单击锁定的元素 */
  selected: SelectedElement | null
  /** 鼠标悬停的元素（实时，检查模式下跟随指针） */
  hovered: SelectedElement | null
  /** 「元素」面板当前展示的源码文件 */
  codeFile: CodeFile | null
  inspectEnabled: boolean
  settings: AppSettings | null
  settingsOpen: boolean
  /** 右侧面板宽度（可拖拽调整） */
  panelWidth: number
  /** 左侧栏是否折叠 */
  sidebarCollapsed: boolean
  toast: string | null

  setProject: (p: ProjectState | null) => void
  setSelected: (e: SelectedElement | null) => void
  setHovered: (e: SelectedElement | null) => void
  setCodeFile: (f: CodeFile | null) => void
  setInspectEnabled: (v: boolean) => void
  setSettings: (s: AppSettings) => void
  setSettingsOpen: (v: boolean) => void
  setPanelWidth: (w: number) => void
  setSidebarCollapsed: (v: boolean) => void
  showToast: (msg: string) => void
  /** 弹原生选择框打开文件夹并设为当前项目 */
  openProject: () => void
}

export const useStore = create<AppState>((set, get) => ({
  project: null,
  selected: null,
  hovered: null,
  codeFile: null,
  inspectEnabled: false,
  settings: null,
  settingsOpen: false,
  panelWidth: 460,
  sidebarCollapsed: false,
  toast: null,

  setProject: (project) => set({ project, selected: null, hovered: null, codeFile: null }),
  setSelected: (selected) => set({ selected }),
  setHovered: (hovered) => set({ hovered }),
  setCodeFile: (codeFile) => set({ codeFile }),
  setInspectEnabled: (inspectEnabled) =>
    set(inspectEnabled ? { inspectEnabled } : { inspectEnabled, hovered: null }),
  setSettings: (settings) => set({ settings }),
  setSettingsOpen: (settingsOpen) => set({ settingsOpen }),
  setPanelWidth: (panelWidth) => set({ panelWidth }),
  setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
  showToast: (toast) => {
    set({ toast })
    setTimeout(() => set((s) => (s.toast === toast ? { toast: null } : {})), 2200)
  },
  openProject: () => {
    window.openui.openFolder().then((p) => {
      if (p) get().setProject(p)
    })
  }
}))
