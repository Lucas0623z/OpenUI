import { app, BrowserWindow, shell, Menu, Tray, nativeImage } from 'electron'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { appendFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { registerIpc } from './ipc/handlers.js'
import { stopServer } from './server/staticServer.js'
import { buildAppMenu } from './menu.js'
import { loadSettings } from './settings.js'
import { mt, onLangChange } from './i18n.js'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

const LOG = join(tmpdir(), 'openui-main.log')
function log(...args: unknown[]): void {
  try {
    appendFileSync(LOG, `[${new Date().toISOString()}] ${args.join(' ')}\n`)
  } catch {
    /* ignore */
  }
}

process.on('uncaughtException', (e) => log('uncaughtException', e?.stack || String(e)))
process.on('unhandledRejection', (e) => log('unhandledRejection', String(e)))
log('main module loaded')

let mainWin: BrowserWindow | null = null
let tray: Tray | null = null
let isQuitting = false

/** 托盘图标（内联，免去打包路径问题） */
const TRAY_ICON =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAGXSURBVFhH7VYtUwMxEK1EIpFIJBIHurudK5dcAqpIJBKJq+QnIE+e5CfwE5DIypNImJdeO5PN9b5IqngzT9zMZt/u5W2S2ewfE1EU80ur6GZHfMuYqFitrk9ssXiwikuj+Ntq/mknVYXixyzLTmWOyUBCq3gTinWRaqPpCYXLfIOBLqymjzD5cBpNn9Zm5zJ3L7DIaP6SCaeRavhEahwEOo8nviPV9zlfSK0Azmx//O2HiKZ6zQnjyIVRqfhVau7huh/t9nHECBfF/ExqO7hxa1kUm0bTWmo7WMXvMjgFMZpSe+v8zhMuLoOJMLeLKxmUkibnpV9AzksZlJKYNq+AYxlwT0UvXgFG010QlJI5P3sFuHtdBiUkGvYKwOEgg1ISpvcKAFLdAQEVb6S2A4wRBCeg0fwmtR2wDcc4jDrfj7it5IK4pEpqenBmTHQj4u8GR3Ab4NAUWxGMXhcQHLUIefINwfZwojpINoJoYlTnEo0nSpl4GKkatOdDgNHB/PYbFE9wLkc9w8fCmRSPVxxcDZvvdKKp8AvU296l3YkkcgAAAABJRU5ErkJggg=='

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1000,
    minHeight: 640,
    show: false,
    title: 'OpenUI',
    backgroundColor: '#faf9f5',
    // 完全无边框：标题栏与窗口控制按钮都由 DOM 自绘，保证毛玻璃遮罩能统一覆盖
    frame: false,
    webPreferences: {
      // webview 标签用于预览目标项目
      webviewTag: true,
      preload: join(__dirname, '../preload/index.cjs'),
      sandbox: false,
      contextIsolation: true
    }
  })

  // 设为 application menu：快捷键全局生效；frameless 窗口不显示菜单栏；汉堡按钮再 popup 它
  Menu.setApplicationMenu(buildAppMenu(win))

  mainWin = win

  win.once('ready-to-show', () => win.show())

  // 关闭窗口 = 隐藏到系统托盘（后台常驻）；托盘创建失败时正常关闭，避免无法退出
  win.on('close', (e) => {
    if (!isQuitting && tray) {
      e.preventDefault()
      win.hide()
    }
  })

  win.on('maximize', () => win.webContents.send('window:maximized', true))
  win.on('unmaximize', () => win.webContents.send('window:maximized', false))

  // 外部链接用系统浏览器打开
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function applyTrayMenu(): void {
  if (!tray) return
  tray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: mt('tray.show'),
        click: () => {
          mainWin?.show()
          mainWin?.focus()
        }
      },
      { type: 'separator' },
      {
        label: mt('tray.quit'),
        click: () => {
          isQuitting = true
          app.quit()
        }
      }
    ])
  )
}

function createTray(): void {
  if (tray) return
  try {
    tray = new Tray(nativeImage.createFromDataURL(TRAY_ICON))
    tray.setToolTip('OpenUI')
    applyTrayMenu()
    tray.on('click', () => {
      if (!mainWin) return
      if (mainWin.isVisible()) mainWin.hide()
      else {
        mainWin.show()
        mainWin.focus()
      }
    })
    // 语言切换后即时重建托盘菜单（不必重启）
    onLangChange(applyTrayMenu)
  } catch (err) {
    log('tray create failed', String(err))
    tray = null
  }
}

log('app object obtained, waiting for ready...')

app.whenReady().then(async () => {
  log('app ready')
  await loadSettings() // 读取语言设定，驱动主进程 i18n
  registerIpc()
  createWindow()
  createTray()
  // 语言切换时重建应用菜单（与托盘一致）
  onLangChange(() => {
    if (mainWin) Menu.setApplicationMenu(buildAppMenu(mainWin))
  })
  log('window created')

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
}).catch((e) => log('whenReady error', String(e)))

app.on('window-all-closed', () => {
  // 关闭窗口只是隐藏到托盘，不退出；真正退出走 Exit / 托盘菜单
  stopServer()
  // 托盘创建失败（无常驻入口）时不再挂起，避免无窗口僵尸进程
  if (!tray && process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  isQuitting = true
  stopServer()
})
