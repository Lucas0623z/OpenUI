import { promises as fs } from 'node:fs'
import { join, normalize, sep } from 'node:path'
import type { SourceLoc, QuickEditChange } from '../../shared/types.js'
import { mt } from '../i18n.js'

function lineColToOffset(source: string, line: number, col: number): number {
  let offset = 0
  let curLine = 1
  while (curLine < line && offset < source.length) {
    if (source[offset] === '\n') curLine++
    offset++
  }
  return offset + (col - 1)
}

/** 找到从 startTagStart('<') 开始的开始标签的结束 '>' 的下标（含 '>'） */
function findOpenTagEnd(source: string, start: number): number {
  let i = start
  let quote: string | null = null
  while (i < source.length) {
    const ch = source[i]
    if (quote) {
      if (ch === quote) quote = null
    } else if (ch === '"' || ch === "'") {
      quote = ch
    } else if (ch === '>') {
      return i
    }
    i++
  }
  return -1
}

function parseStyle(style: string): Map<string, string> {
  const map = new Map<string, string>()
  for (const part of style.split(';')) {
    const idx = part.indexOf(':')
    if (idx > 0) {
      const prop = part.slice(0, idx).trim()
      const val = part.slice(idx + 1).trim()
      if (prop) map.set(prop, val)
    }
  }
  return map
}

function serializeStyle(map: Map<string, string>): string {
  return Array.from(map.entries())
    .map(([k, v]) => `${k}: ${v}`)
    .join('; ')
}

function resolveSafe(root: string, relFile: string): string {
  const target = normalize(join(root, relFile.split('/').join(sep)))
  if (target !== root && !target.startsWith(root + sep)) {
    throw new Error(mt('error.illegalPath'))
  }
  return target
}

/**
 * 把若干 CSS 声明写回到 loc 指向元素的内联 style 属性里。
 * 已存在的属性会被覆盖，不存在的会追加；不触碰元素的其它任何代码（不改功能）。
 */
export async function applyStyleToSource(
  root: string,
  loc: SourceLoc,
  changes: QuickEditChange[]
): Promise<void> {
  const filePath = resolveSafe(root, loc.file)
  const source = await fs.readFile(filePath, 'utf-8')

  const tagStart = lineColToOffset(source, loc.line, loc.col)
  if (source[tagStart] !== '<') {
    throw new Error(mt('error.locExpired'))
  }
  const tagEnd = findOpenTagEnd(source, tagStart)
  if (tagEnd < 0) throw new Error(mt('error.parseTag'))

  const openTag = source.slice(tagStart, tagEnd + 1)

  const styleRe = /\sstyle\s*=\s*("([^"]*)"|'([^']*)')/i
  const match = styleRe.exec(openTag)

  const styleMap = parseStyle(match ? match[2] ?? match[3] ?? '' : '')
  for (const { property, value } of changes) {
    if (value === '') styleMap.delete(property)
    else styleMap.set(property, value)
  }
  const styleStr = serializeStyle(styleMap)

  let newOpenTag: string
  if (match) {
    const before = openTag.slice(0, match.index)
    const after = openTag.slice(match.index + match[0].length)
    newOpenTag = `${before} style="${styleStr}"${after}`
  } else {
    // 插到 '>' 或 '/>' 之前
    const selfClose = openTag.endsWith('/>')
    const insertAt = selfClose ? openTag.length - 2 : openTag.length - 1
    const head = openTag.slice(0, insertAt).replace(/\s+$/, '')
    const tail = openTag.slice(insertAt)
    newOpenTag = `${head} style="${styleStr}"${selfClose ? ' ' : ''}${tail}`
  }

  const newSource = source.slice(0, tagStart) + newOpenTag + source.slice(tagEnd + 1)
  await fs.writeFile(filePath, newSource, 'utf-8')
}

/** 读取项目内某个相对路径文件（供 AI 上下文 / 预览） */
export async function readProjectFile(root: string, relFile: string): Promise<string> {
  const filePath = resolveSafe(root, relFile)
  return fs.readFile(filePath, 'utf-8')
}

/** 用新内容整体覆盖文件（AI 改码经用户确认后写回） */
export async function writeProjectFile(
  root: string,
  relFile: string,
  content: string
): Promise<void> {
  const filePath = resolveSafe(root, relFile)
  await fs.writeFile(filePath, content, 'utf-8')
}
