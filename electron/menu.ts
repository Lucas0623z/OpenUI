import { Menu, app, type BrowserWindow, type MenuItemConstructorOptions } from 'electron'
import { mt } from './i18n.js'

/**
 * 应用菜单（File / Edit / View / Help）。
 * - 设为 application menu：accelerator 快捷键全局生效（窗口为 frameless，不显示菜单栏）。
 * - 汉堡按钮通过 Menu.popup() 弹出同一菜单（Windows 11 原生圆角）。
 * - 编辑类用 role（undo/redo/cut/copy/paste/selectAll）开箱即用；
 *   自定义项（new/open/settings）通过 menu:command 回传渲染进程执行。
 */
export function buildAppMenu(win: BrowserWindow): Menu {
  const send =
    (cmd: string) =>
    (): void => {
      win.webContents.send('menu:command', cmd)
    }

  const template: MenuItemConstructorOptions[] = [
    {
      label: mt('menu.file'),
      submenu: [
        { label: mt('menu.newConversation'), accelerator: 'CmdOrCtrl+N', click: send('new') },
        { label: mt('menu.openFile'), click: send('open') },
        { label: mt('menu.settings'), accelerator: 'CmdOrCtrl+,', click: send('settings') },
        { type: 'separator' },
        { label: mt('menu.closeWindow'), accelerator: 'CmdOrCtrl+W', role: 'close' },
        { label: mt('menu.exit'), click: (): void => app.quit() }
      ]
    },
    {
      label: mt('menu.edit'),
      submenu: [
        { label: mt('menu.undo'), role: 'undo', accelerator: 'CmdOrCtrl+Z' },
        { label: mt('menu.redo'), role: 'redo', accelerator: 'CmdOrCtrl+Y' },
        { type: 'separator' },
        { label: mt('menu.cut'), role: 'cut', accelerator: 'CmdOrCtrl+X' },
        { label: mt('menu.copy'), role: 'copy', accelerator: 'CmdOrCtrl+C' },
        { label: mt('menu.paste'), role: 'paste', accelerator: 'CmdOrCtrl+V' },
        { label: mt('menu.selectAll'), role: 'selectAll', accelerator: 'CmdOrCtrl+A' }
      ]
    },
    {
      label: mt('menu.view'),
      // 只刷新预览 webview，不重载整个界面（避免丢失 React/zustand 状态）
      submenu: [{ label: mt('menu.reload'), accelerator: 'CmdOrCtrl+R', click: send('reload') }]
    },
    {
      label: mt('menu.help'),
      submenu: [{ label: mt('menu.about'), enabled: false }]
    }
  ]

  return Menu.buildFromTemplate(template)
}
