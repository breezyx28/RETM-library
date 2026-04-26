import he from 'he'
import type { RenderContext } from './types'
import { formatVariableKey } from '../tokens/formatToken'
import type { VariableRenderAs } from '../../types'

function getPathValue(input: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, segment) => {
    if (!acc || typeof acc !== 'object') return undefined
    return (acc as Record<string, unknown>)[segment]
  }, input)
}

function sampleFromSchema(ctx: RenderContext, key: string): unknown {
  for (const group of ctx.variableSchema) {
    for (const variable of group.variables) {
      if (variable.key === key) return variable.sample
    }
  }
  return undefined
}

export function renderVariableToken(ctx: RenderContext, key: string): string {
  return renderVariableByMode(ctx, {
    key,
    renderAs: 'text',
  })
}

export function renderVariableByMode(
  ctx: RenderContext,
  input: {
    key: string
    renderAs: VariableRenderAs
    listStyle?: 'ordered' | 'unordered'
    imageWidth?: number
    imageHeight?: number
    imageRadius?: number
  },
): string {
  const { key, renderAs } = input
  if (ctx.mode === 'plain') {
    const fromData = ctx.sampleData ? getPathValue(ctx.sampleData, key) : undefined
    const fromSchema = sampleFromSchema(ctx, key)
    const value = fromData ?? fromSchema ?? ''
    if (renderAs === 'image') {
      const src = typeof value === 'string' ? value : ''
      const width = Math.max(40, Number(input.imageWidth ?? 240))
      const height = Math.max(40, Number(input.imageHeight ?? 120))
      const radius = Math.max(0, Number(input.imageRadius ?? 8))
      return src
        ? `<img src="${he.escape(src)}" alt="${he.escape(key)}" style="display:block;width:${width}px;height:${height}px;border-radius:${radius}px;object-fit:cover;" />`
        : `<div style="display:flex;align-items:center;justify-content:center;width:${width}px;height:${height}px;border:1px dashed #cbd5e1;border-radius:${radius}px;color:#6b7280;font-size:12px;">${he.escape(key)}</div>`
    }
    if (renderAs === 'link') {
      const href = typeof value === 'string' && value ? value : '#'
      return `<a href="${he.escape(href)}" target="_blank" rel="noopener noreferrer">${he.escape(key)}</a>`
    }
    if (renderAs === 'list') {
      const items = Array.isArray(value) ? value.map((x) => String(x)) : []
      const tag = input.listStyle === 'ordered' ? 'ol' : 'ul'
      const inner = items.length
        ? items.map((item) => `<li>${he.escape(item)}</li>`).join('')
        : `<li>${he.escape(key)}</li>`
      return `<${tag}>${inner}</${tag}>`
    }
    if (renderAs === 'table') {
      const asObj = (value && typeof value === 'object' ? value : {}) as {
        table?: { headers?: string[]; rows?: Record<string, unknown>[] }
      }
      const headers = asObj.table?.headers ?? ['Column 1', 'Column 2', 'Column 3']
      const rows =
        asObj.table?.rows && asObj.table.rows.length
          ? asObj.table.rows
          : [{}, {}, {}]
      const thead = `<tr>${headers.map((h) => `<th style="border:1px solid #e5e7eb;padding:6px 8px;text-align:left;">${he.escape(h)}</th>`).join('')}</tr>`
      const tbody = rows
        .map(
          (row) =>
            `<tr>${headers
              .map((h) => `<td style="border:1px solid #e5e7eb;padding:6px 8px;">${he.escape(String(row[h] ?? '—'))}</td>`)
              .join('')}</tr>`,
        )
        .join('')
      return `<table style="border-collapse:collapse;width:100%;margin:8px 0;"><thead>${thead}</thead><tbody>${tbody}</tbody></table>`
    }
    return he.escape(String(value))
  }

  return he.escape(
    formatVariableKey(key, ctx.tokenFormat ?? 'handlebars', ctx.customTokenFormat),
  )
}
