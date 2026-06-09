import { ipcMain, dialog, BrowserWindow, Menu } from 'electron'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { CHANNELS } from '../../shared/types.js'
import type {
  ProjectState,
  ApplyStyleRequest,
  ApplyResult,
  AiEditRequest,
  AiEditResult,
  AppSettings
} from '../../shared/types.js'
import { pickAdapter } from '../adapters/index.js'
import { getRoot } from '../server/staticServer.js'
import { applyStyleToSource, readProjectFile, writeProjectFile } from '../fs/sourceEdit.js'
import { runAiEdit } from '../ai/client.js'
import { loadSettings, saveSettings } from '../settings.js'
import { mt } from '../i18n.js'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

let project: ProjectState | null = null

export function registerIpc(): void {
  ipcMain.handle('app:webviewPreloadPath', () => {
    // 构建产物里 webview preload 的绝对路径
    return join(__dirname, '../preload/webview-preload.cjs')
  })

  // 自定义窗口控制（frameless）
  ipcMain.handle('window:minimize', (e) => {
    BrowserWindow.fromWebContents(e.sender)?.minimize()
  })
  ipcMain.handle('window:maximizeToggle', (e) => {
    const w = BrowserWindow.fromWebContents(e.sender)
    if (!w) return false
    if (w.isMaximized()) w.unmaximize()
    else w.maximize()
    return w.isMaximized()
  })
  ipcMain.handle('window:close', (e) => {
    BrowserWindow.fromWebContents(e.sender)?.close()
  })
  ipcMain.handle('window:isMaximized', (e) => {
    return BrowserWindow.fromWebContents(e.sender)?.isMaximized() ?? false
  })

  // 汉堡按钮：在按钮位置弹出应用菜单（Windows 11 原生圆角）
  ipcMain.handle('menu:popup', (e) => {
    const menu = Menu.getApplicationMenu()
    const win = BrowserWindow.fromWebContents(e.sender)
    if (menu && win) menu.popup({ window: win })
  })

  // 左上角 撤销 / 重做（作用于渲染进程当前聚焦的可编辑元素）
  ipcMain.handle('edit:undo', (e) => e.sender.undo())
  ipcMain.handle('edit:redo', (e) => e.sender.redo())

  ipcMain.handle(CHANNELS.openFolder, async (): Promise<ProjectState | null> => {
    const win = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0]
    const result = await dialog.showOpenDialog(win, {
      title: mt('dialog.selectFolder'),
      properties: ['openDirectory']
    })
    if (result.canceled || result.filePaths.length === 0) return null

    const rootDir = result.filePaths[0]
    const adapter = await pickAdapter(rootDir)
    const { url, entry } = await adapter.start(rootDir)

    project = { rootDir, serverUrl: url, entry, adapter: adapter.kind }
    return project
  })

  ipcMain.handle(CHANNELS.getProject, (): ProjectState | null => project)

  ipcMain.handle(CHANNELS.readFile, async (_e, relPath: string): Promise<string> => {
    if (!project) return ''
    return readProjectFile(getRoot(), relPath)
  })

  ipcMain.handle(
    CHANNELS.applyStyle,
    async (_e, req: ApplyStyleRequest): Promise<ApplyResult> => {
      if (!project || !req.loc) return { ok: false, error: mt('error.noLoc') }
      try {
        await applyStyleToSource(getRoot(), req.loc, req.changes)
        return { ok: true }
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : String(err) }
      }
    }
  )

  ipcMain.handle(CHANNELS.aiEdit, async (_e, req: AiEditRequest): Promise<AiEditResult> => {
    const settings = await loadSettings()
    return runAiEdit(settings.ai, req)
  })

  ipcMain.handle(
    CHANNELS.applyAiEdit,
    async (_e, filePath: string, content: string): Promise<ApplyResult> => {
      if (!project) return { ok: false, error: mt('error.noProject') }
      try {
        await writeProjectFile(getRoot(), filePath, content)
        return { ok: true }
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : String(err) }
      }
    }
  )

  ipcMain.handle(CHANNELS.getSettings, (): Promise<AppSettings> => loadSettings())

  ipcMain.handle(CHANNELS.setSettings, (_e, s: AppSettings): Promise<AppSettings> =>
    saveSettings(s)
  )
}
