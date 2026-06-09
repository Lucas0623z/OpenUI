import type { AdapterKind } from '../../shared/types.js'

/**
 * 框架适配器接口。
 *
 * OpenUI 的核心是「元素 ↔ 源码」的映射，不同框架注入 data-openui-loc 的方式不同：
 *  - static：在静态服务器层用 HTML 解析器注入（MVP 已实现）
 *  - react ：未来用 Babel/Vite 插件在编译期注入相同标记
 *  - vue   ：未来用 Vue 编译器插件注入相同标记
 *
 * 检查器和上层 UI 只依赖统一的 data-openui-loc，因此换适配器不影响上层。
 */
export interface FrameworkAdapter {
  kind: AdapterKind
  /** 该目录是否匹配此适配器（分值越高越匹配，0 表示不匹配） */
  detect(rootDir: string): Promise<number>
  /**
   * 启动预览：返回可在 webview 中加载的 URL 以及入口页。
   * static 适配器会启动带注入的静态服务器；
   * 框架适配器未来会启动 dev server 并挂上注入插件。
   */
  start(rootDir: string): Promise<{ url: string; entry: string }>
}
