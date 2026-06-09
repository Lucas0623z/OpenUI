import { ipcRenderer } from 'electron'
import type { SelectedElement, SourceLoc, QuickEditChange } from '../shared/types.js'

/**
 * 注入到预览 webview 的检查器（运行在 preload 隔离世界，可访问 DOM + ipcRenderer）。
 * 职责：
 *  - 悬停高亮元素 + tooltip
 *  - 点选元素并通过 sendToHost 回传给宿主渲染进程
 *  - 接收宿主消息做实时样式预览（按 data-openui-uid 定位）
 */

const STYLE_PROPS = [
  'color',
  'background-color',
  'font-size',
  'font-weight',
  'width',
  'height',
  'margin',
  'padding',
  'border',
  'border-radius',
  'display',
  'text-align',
  'opacity'
]

function parseLoc(attr: string | null): SourceLoc | null {
  if (!attr) return null
  // 格式: file:line:col:endLine:endCol （file 自身可能含 / 但不含 :）
  const parts = attr.split(':')
  if (parts.length < 5) return null
  const endCol = Number(parts.pop())
  const endLine = Number(parts.pop())
  const col = Number(parts.pop())
  const line = Number(parts.pop())
  const file = parts.join(':')
  if ([line, col, endLine, endCol].some((n) => Number.isNaN(n))) return null
  return { file, line, col, endLine, endCol }
}

function buildSelector(el: Element): string {
  const tag = el.tagName.toLowerCase()
  const id = el.id ? `#${el.id}` : ''
  const cls =
    typeof el.className === 'string' && el.className.trim()
      ? '.' + el.className.trim().split(/\s+/).filter(Boolean).slice(0, 3).join('.')
      : ''
  return `${tag}${id}${cls}`
}

function describe(el: HTMLElement): SelectedElement {
  const computed = getComputedStyle(el)
  const computedStyles: Record<string, string> = {}
  for (const prop of STYLE_PROPS) computedStyles[prop] = computed.getPropertyValue(prop).trim()

  return {
    uid: el.getAttribute('data-openui-uid') || '',
    tagName: el.tagName.toLowerCase(),
    id: el.id || '',
    className: typeof el.className === 'string' ? el.className : '',
    selector: buildSelector(el),
    loc: parseLoc(el.getAttribute('data-openui-loc')),
    outerHTML: el.outerHTML.slice(0, 1500),
    computedStyles,
    text: (el.textContent || '').trim().slice(0, 300)
  }
}

let inspectEnabled = false
let highlightBox: HTMLDivElement | null = null
let tooltip: HTMLDivElement | null = null

function ensureOverlay(): void {
  if (highlightBox) return
  highlightBox = document.createElement('div')
  Object.assign(highlightBox.style, {
    position: 'fixed',
    pointerEvents: 'none',
    zIndex: '2147483646',
    border: '2px solid #4c9aff',
    background: 'rgba(76,154,255,0.12)',
    borderRadius: '2px',
    transition: 'all 40ms ease-out',
    display: 'none'
  } as CSSStyleDeclaration)

  tooltip = document.createElement('div')
  Object.assign(tooltip.style, {
    position: 'fixed',
    pointerEvents: 'none',
    zIndex: '2147483647',
    background: '#1e1e1e',
    color: '#e8e8e8',
    font: '12px/1.5 ui-monospace, Menlo, Consolas, monospace',
    padding: '4px 8px',
    borderRadius: '4px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
    maxWidth: '420px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: 'none'
  } as CSSStyleDeclaration)

  document.documentElement.appendChild(highlightBox)
  document.documentElement.appendChild(tooltip)
}

function isOverlay(el: EventTarget | null): boolean {
  return el === highlightBox || el === tooltip
}

function moveHighlight(el: HTMLElement): void {
  ensureOverlay()
  if (!highlightBox || !tooltip) return
  const r = el.getBoundingClientRect()
  Object.assign(highlightBox.style, {
    display: 'block',
    left: `${r.left}px`,
    top: `${r.top}px`,
    width: `${r.width}px`,
    height: `${r.height}px`
  })

  const loc = el.getAttribute('data-openui-loc')
  const locText = loc ? ' @ ' + loc.split(':').slice(0, 3).join(':') : ''
  tooltip.textContent = buildSelector(el) + locText
  tooltip.style.display = 'block'
  const top = r.top > 28 ? r.top - 26 : r.bottom + 4
  tooltip.style.left = `${Math.max(4, r.left)}px`
  tooltip.style.top = `${top}px`
}

function hideHighlight(): void {
  if (highlightBox) highlightBox.style.display = 'none'
  if (tooltip) tooltip.style.display = 'none'
}

let lastHoverEl: HTMLElement | null = null
let hoverScheduled = false
/** 节流回传悬停元素（~60ms），用于「元素」面板实时跟随指针显示代码 */
function scheduleHover(): void {
  if (hoverScheduled) return
  hoverScheduled = true
  setTimeout(() => {
    hoverScheduled = false
    if (inspectEnabled && lastHoverEl) {
      ipcRenderer.sendToHost('inspect:hover', describe(lastHoverEl))
    }
  }, 60)
}

function onMouseMove(e: MouseEvent): void {
  if (!inspectEnabled) return
  const target = e.target as HTMLElement | null
  if (!target || isOverlay(target)) return
  moveHighlight(target)
  if (target !== lastHoverEl) {
    lastHoverEl = target
    scheduleHover()
  }
}

function onClick(e: MouseEvent): void {
  if (!inspectEnabled) return
  const target = e.target as HTMLElement | null
  if (!target || isOverlay(target)) return
  e.preventDefault()
  e.stopPropagation()
  ipcRenderer.sendToHost('inspect:select', describe(target))
}

function findByUid(uid: string): HTMLElement | null {
  return document.querySelector<HTMLElement>(`[data-openui-uid="${CSS.escape(uid)}"]`)
}

function applyPreview(uid: string, changes: QuickEditChange[]): void {
  const el = findByUid(uid)
  if (!el) return
  for (const { property, value } of changes) {
    el.style.setProperty(property, value)
  }
}

ipcRenderer.on('inspect:setEnabled', (_e, enabled: boolean) => {
  inspectEnabled = enabled
  if (!enabled) hideHighlight()
})

ipcRenderer.on('preview:style', (_e, payload: { uid: string; changes: QuickEditChange[] }) => {
  applyPreview(payload.uid, payload.changes)
})

window.addEventListener('mousemove', onMouseMove, true)
window.addEventListener('click', onClick, true)
window.addEventListener('mouseleave', hideHighlight, true)
window.addEventListener('scroll', hideHighlight, true)

// 页面就绪后通知宿主
window.addEventListener('DOMContentLoaded', () => {
  ipcRenderer.sendToHost('inspect:ready')
})
