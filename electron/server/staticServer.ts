import http from 'node:http'
import { promises as fs } from 'node:fs'
import { extname, join, normalize, sep } from 'node:path'
import { injectLoc } from './inject.js'
import { mt, mainLang } from '../i18n.js'

let server: http.Server | null = null
let currentRoot = ''
let currentUrl = ''
/** 当前入口页相对路径；'' 表示该目录未找到可预览的 HTML 入口 */
let currentEntry = ''

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
}

function safeJoin(root: string, urlPath: string): string | null {
  const decoded = decodeURIComponent(urlPath.split('?')[0])
  const target = normalize(join(root, decoded))
  // 防目录穿越
  if (target !== root && !target.startsWith(root + sep)) return null
  return target
}

export interface StartedServer {
  url: string
  entry: string
}

/**
 * 在指定目录上启动本地静态服务器。
 * .html 文件会经过 data-openui-loc 注入再返回。
 * 若目录里没有可预览的 HTML 入口，所有请求都返回一个友好的提示页。
 */
export async function startServer(rootDir: string): Promise<StartedServer> {
  await stopServer()
  currentRoot = normalize(rootDir)

  // 探测入口页（找不到则为 ''）
  currentEntry = (await detectEntry(currentRoot)) ?? ''

  server = http.createServer(async (req, res) => {
    try {
      // 没有可预览入口：任何请求都回友好提示页，而不是 404 空白
      if (!currentEntry) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' })
        res.end(noEntryPage(currentRoot))
        return
      }

      let urlPath = req.url || '/'
      if (urlPath === '/' || urlPath === '') urlPath = '/' + currentEntry

      const filePath = safeJoin(currentRoot, urlPath)
      if (!filePath) {
        res.writeHead(403).end('Forbidden')
        return
      }

      let stat
      try {
        stat = await fs.stat(filePath)
      } catch {
        res.writeHead(404).end('Not Found')
        return
      }

      let target = filePath
      if (stat.isDirectory()) {
        target = join(filePath, 'index.html')
      }

      const ext = extname(target).toLowerCase()
      if (ext === '.html' || ext === '.htm') {
        const raw = await fs.readFile(target, 'utf-8')
        const rel = relFromRoot(currentRoot, target)
        const injected = injectLoc(raw, rel)
        res.writeHead(200, { 'Content-Type': MIME[ext], 'Cache-Control': 'no-store' })
        res.end(injected)
        return
      }

      const data = await fs.readFile(target)
      res.writeHead(200, {
        'Content-Type': MIME[ext] || 'application/octet-stream',
        'Cache-Control': 'no-store'
      })
      res.end(data)
    } catch (err) {
      res.writeHead(500).end(String(err))
    }
  })

  const port = await listenOnFreePort(server)
  currentUrl = `http://127.0.0.1:${port}`
  return { url: currentUrl, entry: currentEntry }
}

function relFromRoot(root: string, abs: string): string {
  return abs.slice(root.length).replace(/^[\\/]+/, '').split(sep).join('/')
}

/**
 * 探测可预览入口。先查常见位置（含 dist/build 构建产物），
 * 再退而求其次找根目录第一个 .html。都没有则返回 null（不再假装有 index.html）。
 */
async function detectEntry(root: string): Promise<string | null> {
  const candidates = [
    'index.html',
    'index.htm',
    'public/index.html',
    'src/index.html',
    'dist/index.html',
    'build/index.html'
  ]
  for (const c of candidates) {
    try {
      await fs.access(join(root, c.split('/').join(sep)))
      return c
    } catch {
      /* keep looking */
    }
  }
  try {
    const files = await fs.readdir(root)
    const html = files.find((f) => f.toLowerCase().endsWith('.html'))
    if (html) return html
  } catch {
    /* ignore */
  }
  return null
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** 未找到可预览 HTML 入口时显示的提示页（Claude 浅色风格） */
function noEntryPage(root: string): string {
  return `<!doctype html>
<html lang="${mainLang()}">
<head>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; }
  body {
    margin: 0; height: 100vh; display: flex; align-items: center; justify-content: center;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Microsoft YaHei', sans-serif;
    background: #faf9f5; color: #2b2a27;
  }
  .box { max-width: 460px; text-align: center; padding: 32px; }
  .icon {
    width: 64px; height: 64px; margin: 0 auto 20px; border-radius: 18px;
    display: flex; align-items: center; justify-content: center; font-size: 30px;
    background: rgba(87,84,76,0.1); border: 1px solid rgba(87,84,76,0.28);
  }
  h1 { font-size: 20px; margin: 0 0 12px; font-weight: 600; }
  p { color: #6b6860; line-height: 1.7; margin: 0 0 10px; font-size: 14px; }
  code { background: #f0eee5; padding: 2px 7px; border-radius: 6px; font-size: 13px; color: #57544c; }
  .path { margin-top: 18px; font-size: 12px; color: #9a958b; word-break: break-all; }
</style>
</head>
<body>
  <div class="box">
    <div class="icon">📂</div>
    <h1>${mt('noEntry.title')}</h1>
    <p>${mt('noEntry.body')}</p>
    <p>${mt('noEntry.hint')}</p>
    <p class="path">${escapeHtml(root)}</p>
  </div>
</body>
</html>`
}

function listenOnFreePort(srv: http.Server): Promise<number> {
  return new Promise((resolve, reject) => {
    srv.once('error', reject)
    // 端口 0 = 让系统分配空闲端口
    srv.listen(0, '127.0.0.1', () => {
      const addr = srv.address()
      if (addr && typeof addr === 'object') resolve(addr.port)
      else reject(new Error(mt('error.noPort')))
    })
  })
}

export function getServerUrl(): string {
  return currentUrl
}

export function getRoot(): string {
  return currentRoot
}

export function stopServer(): Promise<void> {
  return new Promise((resolve) => {
    if (server) {
      server.close(() => {
        server = null
        resolve()
      })
      server = null
    } else {
      resolve()
    }
  })
}
