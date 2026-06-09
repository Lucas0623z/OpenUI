import OpenAI from 'openai'
import type { AiConfig, AiEditRequest, AiEditResult } from '../../shared/types.js'
import { mt } from '../i18n.js'

function buildSystemPrompt(): string {
  return [
    'You are OpenUI, an assistant embedded in a visual UI editor.',
    'The user selects an element on a rendered web page and asks for a UI change',
    '(e.g. change color, change size) or reports a functional problem.',
    '',
    'Rules:',
    '- You will receive the FULL source of one file and info about the selected element.',
    '- Make the SMALLEST change that satisfies the request.',
    '- For pure UI tweaks (color/size/spacing/etc.), only touch styles.',
    '- Preserve all unrelated code, indentation and formatting exactly.',
    '- Keep the data-openui-loc / data-openui-uid attributes if present (they are tooling markers; do not remove them).',
    '- Return STRICT JSON only, no markdown fences, with this shape:',
    '  {"explanation": string, "newContent": string}',
    '  where newContent is the ENTIRE modified file content.',
    '- If you cannot or should not change the file, set newContent to null and explain why.'
  ].join('\n')
}

function buildUserPrompt(req: AiEditRequest): string {
  const el = req.element
  return [
    `User instruction: ${req.instruction}`,
    '',
    'Selected element:',
    `- tag: ${el.tagName}`,
    `- id: ${el.id || '(none)'}`,
    `- class: ${el.className || '(none)'}`,
    `- selector: ${el.selector}`,
    `- source location: ${el.loc ? `${el.loc.file}:${el.loc.line}:${el.loc.col}` : '(unknown)'}`,
    `- text: ${JSON.stringify(el.text.slice(0, 200))}`,
    '- outerHTML (truncated):',
    el.outerHTML.slice(0, 800),
    '',
    `File to edit: ${req.filePath}`,
    '----- BEGIN FILE -----',
    req.fileContent,
    '----- END FILE -----'
  ].join('\n')
}

function extractJson(text: string): { explanation: string; newContent: string | null } | null {
  // 先尝试直接解析
  const tryParse = (s: string): { explanation: string; newContent: string | null } | null => {
    try {
      const obj = JSON.parse(s)
      if (obj && typeof obj === 'object' && 'newContent' in obj) {
        return {
          explanation: String(obj.explanation ?? ''),
          newContent: obj.newContent === null ? null : String(obj.newContent)
        }
      }
    } catch {
      /* ignore */
    }
    return null
  }

  const direct = tryParse(text.trim())
  if (direct) return direct

  // 去掉可能的 ```json fences
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fenced) {
    const r = tryParse(fenced[1].trim())
    if (r) return r
  }

  // 退而求其次：截取第一个 { 到最后一个 }
  const first = text.indexOf('{')
  const last = text.lastIndexOf('}')
  if (first >= 0 && last > first) {
    const r = tryParse(text.slice(first, last + 1))
    if (r) return r
  }
  return null
}

export async function runAiEdit(config: AiConfig, req: AiEditRequest): Promise<AiEditResult> {
  if (!config.apiKey) {
    return {
      ok: false,
      explanation: '',
      newContent: null,
      filePath: req.filePath,
      error: mt('error.noApiKey')
    }
  }

  const client = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseUrl || undefined
  })

  try {
    const completion = await client.chat.completions.create({
      model: config.model || 'gpt-4o-mini',
      temperature: 0.2,
      messages: [
        { role: 'system', content: buildSystemPrompt() },
        { role: 'user', content: buildUserPrompt(req) }
      ]
    })

    const content = completion.choices[0]?.message?.content ?? ''
    const parsed = extractJson(content)
    if (!parsed) {
      return {
        ok: false,
        explanation: content.slice(0, 500),
        newContent: null,
        filePath: req.filePath,
        error: mt('error.aiParse')
      }
    }

    return {
      ok: parsed.newContent !== null,
      explanation: parsed.explanation,
      newContent: parsed.newContent,
      filePath: req.filePath
    }
  } catch (err) {
    return {
      ok: false,
      explanation: '',
      newContent: null,
      filePath: req.filePath,
      error: err instanceof Error ? err.message : String(err)
    }
  }
}
