import type { QuickEditChange } from '../shared/types'

export interface WebviewEl extends HTMLElement {
  send(channel: string, ...args: unknown[]): void
  reload(): void
  src: string
}

let webview: WebviewEl | null = null

export function setWebview(w: WebviewEl | null): void {
  webview = w
}

export function sendPreviewStyle(uid: string, changes: QuickEditChange[]): void {
  webview?.send('preview:style', { uid, changes })
}

export function setInspectMode(enabled: boolean): void {
  webview?.send('inspect:setEnabled', enabled)
}

export function reloadPreview(): void {
  webview?.reload()
}
