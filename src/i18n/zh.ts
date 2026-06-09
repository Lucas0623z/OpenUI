export const zh = {
  app: {
    title: 'OpenUI',
    subtitle: '可视化 AI UI 修改器'
  },
  toolbar: {
    openFolder: '打开文件夹',
    inspect: '检查元素',
    inspectOn: '检查中',
    refresh: '刷新',
    settings: '设置',
    noProject: '未打开项目'
  },
  welcome: {
    title: '欢迎使用 OpenUI',
    desc: '打开一个前端项目文件夹，即可像浏览器 F12 一样检查元素、改颜色改尺寸，或用 AI 对话修改界面。',
    cta: '打开文件夹',
    hint: '当前支持纯静态 HTML/CSS/JS 项目'
  },
  panel: {
    element: '元素',
    quickEdit: '快捷编辑',
    ai: '对话',
    noSelection: '在左侧预览中开启「检查元素」并点选一个元素',
    selector: '选择器',
    location: '源码位置',
    locationUnknown: '未知（动态生成节点）',
    text: '文本',
    computed: '计算样式'
  },
  controls: {
    menu: '菜单',
    collapse: '折叠侧栏',
    expand: '展开侧栏',
    search: '搜索',
    undo: '撤销',
    redo: '重做',
    minimize: '最小化',
    maximize: '最大化',
    restore: '还原',
    close: '关闭',
    resize: '拖动调整宽度',
    locked: '已锁定',
    unlock: '解锁跟随'
  },
  preview: {
    loadFailed: '预览加载失败'
  },
  quick: {
    textColor: '文字颜色',
    bgColor: '背景颜色',
    fontSize: '字号',
    width: '宽度',
    height: '高度',
    padding: '内边距',
    radius: '圆角',
    apply: '写回源码',
    applied: '已写回源码并刷新',
    needLoc: '该元素没有源码位置，无法写回',
    note: '仅修改样式，不改动功能'
  },
  ai: {
    placeholder: '例如：换个颜色 / 把这个按钮变大 / 这个按钮不能用',
    send: '发送',
    thinking: 'AI 思考中…',
    selectFirst: '请先在预览里点选一个元素',
    proposal: 'AI 修改建议',
    applyChange: '应用修改',
    discard: '放弃',
    applied: '已应用并刷新预览',
    noChange: 'AI 未提出可应用的修改',
    error: '出错了'
  },
  settings: {
    title: '设置',
    language: '界面语言',
    aiSection: 'AI 模型（OpenAI 兼容接口）',
    baseUrl: '接口地址 (baseURL)',
    apiKey: 'API Key',
    model: '模型名称',
    save: '保存',
    saved: '已保存',
    close: '关闭',
    aiHint: '可填任意 OpenAI 兼容接口，例如官方、国产或本地模型'
  }
}
