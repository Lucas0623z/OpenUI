import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'
import { CHANNELS } from '../shared/types.js'
import type {
  ProjectState,
  AppSettings,
  ApplyStyleRequest,
  ApplyResult,
  AiEditRequest,
  AiEditResult
} from '../shared/types.js'

/** 暴露给渲染进程的安全 API（contextIsolation 下唯一通道） */
const api = {
  openFolder: (): Promise<ProjectState | null> => ipcRenderer.invoke(CHANNELS.openFolder),
  getProject: (): Promise<ProjectState | null> => ipcRenderer.invoke(CHANNELS.getProject),
  readFile: (relPath: string): Promise<string> => ipcRenderer.invoke(CHANNELS.readFile, relPath),
  applyStyle: (req: ApplyStyleRequest): Promise<ApplyResult> =>
    ipcRenderer.invoke(CHANNELS.applyStyle, req),
  aiEdit: (req: AiEditRequest): Promise<AiEditResult> => ipcRenderer.invoke(CHANNELS.aiEdit, req),
  applyAiEdit: (filePath: string, content: string): Promise<ApplyResult> =>
    ipcRenderer.invoke(CHANNELS.applyAiEdit, filePath, content),
  getSettings: (): Promise<AppSettings> => ipcRenderer.invoke(CHANNELS.getSettings),
  setSettings: (s: AppSettings): Promise<AppSettings> =>
    ipcRenderer.invoke(CHANNELS.setSettings, s),
  /** webview preload 的绝对文件路径，供 <webview preload> 使用 */
  webviewPreloadPath: (): Promise<string> => ipcRenderer.invoke('app:webviewPreloadPath'),
  // 自定义窗口控制（frameless）
  minimizeWindow: (): Promise<void> => ipcRenderer.invoke('window:minimize'),
  maximizeWindow: (): Promise<boolean> => ipcRenderer.invoke('window:maximizeToggle'),
  closeWindow: (): Promise<void> => ipcRenderer.invoke('window:close'),
  isWindowMaximized: (): Promise<boolean> => ipcRenderer.invoke('window:isMaximized'),
  onWindowMaximized: (cb: (v: boolean) => void): (() => void) => {
    const listener = (_e: IpcRendererEvent, v: boolean): void => cb(v)
    ipcRenderer.on('window:maximized', listener)
    return () => ipcRenderer.removeListener('window:maximized', listener)
  },
  // 应用菜单：汉堡触发原生 popup + 菜单命令回传
  popupMenu: (): Promise<void> => ipcRenderer.invoke('menu:popup'),
  onMenuCommand: (cb: (cmd: string) => void): (() => void) => {
    const listener = (_e: IpcRendererEvent, cmd: string): void => cb(cmd)
    ipcRenderer.on('menu:command', listener)
    return () => ipcRenderer.removeListener('menu:command', listener)
  },
  // 左上角 撤销 / 重做
  undo: (): Promise<void> => ipcRenderer.invoke('edit:undo'),
  redo: (): Promise<void> => ipcRenderer.invoke('edit:redo')
}

contextBridge.exposeInMainWorld('openui', api)

export type OpenUiApi = typeof api
