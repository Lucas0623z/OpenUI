import { parse, HTMLElement } from 'node-html-parser'

/**
 * 把源码字符偏移量转换成 1-based 的 行:列。
 */
function buildLineIndex(source: string): number[] {
  const starts: number[] = [0]
  for (let i = 0; i < source.length; i++) {
    if (source[i] === '\n') starts.push(i + 1)
  }
  return starts
}

function offsetToLineCol(lineStarts: number[], offset: number): { line: number; col: number } {
  // 二分查找 offset 所在行
  let lo = 0
  let hi = lineStarts.length - 1
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1
    if (lineStarts[mid] <= offset) lo = mid
    else hi = mid - 1
  }
  return { line: lo + 1, col: offset - lineStarts[lo] + 1 }
}

const SKIP_TAGS = new Set(['html', 'head', 'meta', 'title', 'link', 'script', 'style', 'base'])

/**
 * 给 HTML 源码里的每个元素注入：
 *  - data-openui-loc="相对路径:line:col:endLine:endCol"  指向原始源码位置
 *  - data-openui-uid="相对路径#序号"                       webview 内做实时预览的稳定句柄
 *
 * 注意：注入用的 line/col 全部基于「原始源码」的偏移量计算，
 * 因此重新序列化后的 HTML 即使格式有变化，也不影响后续按 loc 写回源码。
 */
export function injectLoc(source: string, relFile: string): string {
  const root = parse(source, {
    comment: true,
    voidTag: { tags: ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'], closingSlash: true }
  })

  const lineStarts = buildLineIndex(source)
  let counter = 0

  const walk = (node: HTMLElement): void => {
    for (const child of node.childNodes) {
      if (child instanceof HTMLElement && child.rawTagName) {
        const tag = child.rawTagName.toLowerCase()
        if (!SKIP_TAGS.has(tag)) {
          const range = child.range // [start, end] 原始源码偏移量
          if (range && typeof range[0] === 'number') {
            const start = offsetToLineCol(lineStarts, range[0])
            const end = offsetToLineCol(lineStarts, range[1])
            const uid = `${relFile}#${counter++}`
            child.setAttribute('data-openui-loc', `${relFile}:${start.line}:${start.col}:${end.line}:${end.col}`)
            child.setAttribute('data-openui-uid', uid)
          }
        }
        walk(child)
      }
    }
  }

  walk(root as unknown as HTMLElement)
  return root.toString()
}
