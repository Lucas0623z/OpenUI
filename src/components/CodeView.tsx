import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useStore } from '../store/useStore.js'
import { monaco } from '../monaco-setup.js'

function langFromPath(path: string): string {
  const ext = path.slice(path.lastIndexOf('.') + 1).toLowerCase()
  if (ext === 'html' || ext === 'htm') return 'html'
  if (ext === 'css') return 'css'
  if (ext === 'js' || ext === 'mjs' || ext === 'cjs' || ext === 'jsx') return 'javascript'
  if (ext === 'ts' || ext === 'tsx') return 'typescript'
  if (ext === 'json') return 'json'
  if (ext === 'vue' || ext === 'svelte') return 'html'
  return 'plaintext'
}

/** 跟随系统深/浅色 */
function systemTheme(): 'vs' | 'vs-dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'vs-dark' : 'vs'
}

/**
 * 「元素」面板：用 Monaco 展示当前悬停/锁定元素对应的源码，高亮并滚动到它所在的行。
 * 悬停跟随（未锁定时），单击锁定；锁定后用顶部「解锁跟随」回到悬停模式。
 * 主题跟随系统（亮色 vs / 深色 vs-dark）。
 */
export function CodeView(): JSX.Element {
  const { t } = useTranslation()
  const codeFile = useStore((s) => s.codeFile)
  const selected = useStore((s) => s.selected)
  const hovered = useStore((s) => s.hovered)
  const setSelected = useStore((s) => s.setSelected)

  const containerRef = useRef<HTMLDivElement | null>(null)
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
  const decorationsRef = useRef<string[]>([])

  // 创建 editor（仅一次）+ 跟随系统主题
  useEffect(() => {
    if (!containerRef.current) return
    const editor = monaco.editor.create(containerRef.current, {
      value: '',
      language: 'html',
      readOnly: true,
      theme: systemTheme(),
      automaticLayout: true,
      fontSize: 13,
      lineHeight: 20,
      lineNumbers: 'on',
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      renderLineHighlight: 'none',
      smoothScrolling: true,
      padding: { top: 10, bottom: 10 },
      scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10 }
    })
    editorRef.current = editor

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const applyTheme = (): void => monaco.editor.setTheme(systemTheme())
    mq.addEventListener('change', applyTheme)

    return () => {
      mq.removeEventListener('change', applyTheme)
      editor.dispose()
      editorRef.current = null
    }
  }, [])

  // 内容 / 语言变化
  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return
    const model = editor.getModel()
    if (!model) return
    const content = codeFile?.content ?? ''
    if (model.getValue() !== content) editor.setValue(content)
    monaco.editor.setModelLanguage(model, codeFile ? langFromPath(codeFile.path) : 'plaintext')
  }, [codeFile])

  // 高亮 + 滚动到元素所在行（锁定优先，否则跟随悬停）
  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return
    const loc = (selected ?? hovered)?.loc
    if (!loc) {
      decorationsRef.current = editor.deltaDecorations(decorationsRef.current, [])
      return
    }
    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, [
      {
        range: new monaco.Range(loc.line, 1, loc.endLine, 1),
        options: {
          isWholeLine: true,
          className: 'codeview__hl',
          linesDecorationsClassName: 'codeview__hl-gutter'
        }
      }
    ])
    editor.revealRangeInCenter(
      new monaco.Range(loc.line, 1, loc.endLine, 1),
      monaco.editor.ScrollType.Smooth
    )
  }, [selected, hovered, codeFile])

  return (
    <div className="codeview">
      {selected && (
        <div className="codeview__lock">
          <span className="codeview__lock-text">
            🔒 {t('controls.locked')} <code>{selected.selector}</code>
          </span>
          <button className="codeview__unlock" onClick={() => setSelected(null)}>
            {t('controls.unlock')}
          </button>
        </div>
      )}
      <div className="codeview__editor-wrap">
        {!codeFile && <div className="codeview__empty">{t('panel.noSelection')}</div>}
        <div
          ref={containerRef}
          className="codeview__editor"
          style={{ visibility: codeFile ? 'visible' : 'hidden' }}
        />
      </div>
    </div>
  )
}
