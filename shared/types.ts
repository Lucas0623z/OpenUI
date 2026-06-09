/**
 * 跨进程共享的类型定义（主进程 / 渲染进程 / preload 都用它）。
 * 这是 OpenUI 的 IPC 契约层。
 */

/** 源码位置：来自注入的 data-openui-loc="相对路径:行:列:endLine:endCol" */
export interface SourceLoc {
  file: string
  line: number
  col: number
  endLine: number
  endCol: number
}

/** 被选中元素从 webview 检查器回传的信息 */
export interface SelectedElement {
  /** 注入的稳定 id，用于回写预览 */
  uid: string
  tagName: string
  id: string
  className: string
  /** 简短的 CSS selector，便于展示 */
  selector: string
  /** 源码位置（可能为空：动态生成的节点没有 data-loc） */
  loc: SourceLoc | null
  /** 元素 outerHTML 片段（截断） */
  outerHTML: string
  /** 关键计算样式快照 */
  computedStyles: Record<string, string>
  /** 元素文本内容（截断） */
  text: string
}

/** 当前打开的项目状态 */
export interface ProjectState {
  rootDir: string
  /** 本地静态服务器地址，例如 http://127.0.0.1:5123 */
  serverUrl: string
  /** 入口页面相对路径，例如 index.html */
  entry: string
  /** 适配器类型 */
  adapter: AdapterKind
}

export type AdapterKind = 'static' | 'react' | 'vue'

/** AI 模型配置（OpenAI 兼容） */
export interface AiConfig {
  baseUrl: string
  apiKey: string
  model: string
}

/** 应用持久化设置 */
export interface AppSettings {
  ai: AiConfig
  /** 界面语言 code（见 src/i18n/languages.ts） */
  language: string
}

/** 快捷编辑：一条 CSS 声明改动 */
export interface QuickEditChange {
  property: string
  value: string
}

/** 写回源码的请求 */
export interface ApplyStyleRequest {
  loc: SourceLoc
  uid: string
  changes: QuickEditChange[]
}

/** AI 改码请求 */
export interface AiEditRequest {
  instruction: string
  element: SelectedElement
  /** 元素所在文件的完整源码（供 AI 上下文） */
  fileContent: string
  filePath: string
}

/** AI 改码结果（写回前给用户预览） */
export interface AiEditResult {
  ok: boolean
  /** AI 的解释 */
  explanation: string
  /** 修改后的完整文件内容（null 表示无改动 / 失败） */
  newContent: string | null
  filePath: string
  error?: string
}

export interface ApplyResult {
  ok: boolean
  error?: string
}

/** 主进程 -> 渲染进程 通知通道名 */
export const CHANNELS = {
  openFolder: 'project:openFolder',
  getProject: 'project:get',
  readFile: 'fs:readFile',
  applyStyle: 'edit:applyStyle',
  aiEdit: 'ai:edit',
  applyAiEdit: 'ai:applyEdit',
  getSettings: 'settings:get',
  setSettings: 'settings:set'
} as const
