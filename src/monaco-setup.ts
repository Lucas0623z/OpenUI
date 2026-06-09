import * as monaco from 'monaco-editor'
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'

/**
 * Monaco（VSCode 编辑器内核）的 worker 配置。
 * 只挂基础 editor worker —— 我们只做「只读查看 + 语法高亮 + 定位」，
 * 不需要语言服务（补全/诊断），语法高亮走主线程 Monarch，足够。
 */
self.MonacoEnvironment = {
  getWorker: () => new EditorWorker()
}

export { monaco }
