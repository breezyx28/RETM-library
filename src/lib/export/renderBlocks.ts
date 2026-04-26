import type { JSONContent } from '@tiptap/core'
import type { AttachmentItem, EmailBlock } from '../types/editorDocument'
import type { RenderContext } from './types'
import { renderVariableByMode, renderVariableToken } from './tokenHydration'
import {
  attachmentDisplayLabel,
  classifyAttachment,
  hydrateAttachmentUrl,
} from './attachmentUtils'
import he from 'he'

function styleAttr(style: string): string {
  return ` style="${style}"`
}

function alignFromAttrs(attrs: Record<string, unknown> | undefined): string {
  const value = attrs?.textAlign
  if (value === 'center' || value === 'right' || value === 'justify' || value === 'left') {
    return `text-align:${value};`
  }
  return ''
}

function textStyleFromMark(mark: { attrs?: Record<string, unknown> }): string {
  const attrs = mark.attrs ?? {}
  const parts: string[] = []
  if (typeof attrs.color === 'string' && attrs.color) parts.push(`color:${attrs.color}`)
  if (typeof attrs.fontFamily === 'string' && attrs.fontFamily)
    parts.push(`font-family:${attrs.fontFamily}`)
  if (typeof attrs.fontSize === 'string' && attrs.fontSize)
    parts.push(`font-size:${attrs.fontSize}`)
  return parts.join(';')
}

function renderTextNode(node: JSONContent, ctx: RenderContext): string {
  if (node.type === 'text') {
    const marks = node.marks ?? []
    let out = he.escape(node.text ?? '')
    const style = marks
      .filter((m) => m.type === 'textStyle')
      .map((m) => textStyleFromMark(m))
      .filter(Boolean)
      .join(';')
    for (const mark of marks) {
      if (mark.type === 'bold') out = `<strong>${out}</strong>`
      if (mark.type === 'italic') out = `<em>${out}</em>`
      if (mark.type === 'underline') out = `<u>${out}</u>`
      if (mark.type === 'strike') out = `<s>${out}</s>`
      if (mark.type === 'link') {
        const href = he.escape(String(mark.attrs?.href ?? '#'))
        out = `<a href="${href}" target="_blank" rel="noopener noreferrer">${out}</a>`
      }
    }
    if (style) out = `<span${styleAttr(style)}>${out}</span>`
    return out
  }

  if (node.type === 'hardBreak') return '<br/>'

  if (node.type === 'ecVariable') {
    const key = String(node.attrs?.key ?? '')
    const renderAs = String(node.attrs?.renderAs ?? 'text') as
      | 'text'
      | 'link'
      | 'image'
      | 'table'
      | 'list'
    return renderVariableByMode(ctx, {
      key,
      renderAs,
      listStyle:
        String(node.attrs?.listStyle ?? 'unordered') === 'ordered'
          ? 'ordered'
          : 'unordered',
      imageWidth: Number(node.attrs?.imageWidth ?? 240),
      imageHeight: Number(node.attrs?.imageHeight ?? 120),
      imageRadius: Number(node.attrs?.imageRadius ?? 8),
    })
  }

  if (node.type === 'image') {
    const src = he.escape(String(node.attrs?.src ?? ''))
    if (!src) return ''
    const alt = he.escape(String(node.attrs?.alt ?? ''))
    return `<img src="${src}" alt="${alt}"${styleAttr('display:block;max-width:100%;height:auto;border:0;border-radius:4px;margin:8px 0;')}/>`
  }

  if (node.type === 'ecPlugin') {
    const attrs = (node.attrs ?? {}) as Record<string, unknown>
    const kind = String(attrs.kind ?? '')
    if (kind === 'image') {
      const src = he.escape(String(attrs.url ?? ''))
      if (!src) return ''
      const alt = he.escape(String(attrs.alt ?? ''))
      const width = he.escape(String(attrs.width ?? '100%'))
      const align = he.escape(String(attrs.align ?? 'center'))
      const img = `<img src="${src}" alt="${alt}" width="${width.replace('%', '')}"${styleAttr('display:block;border:0;max-width:100%;height:auto;border-radius:4px;margin:8px 0;')}/>`
      const linkUrl = String(attrs.linkUrl ?? '').trim()
      const content = linkUrl
        ? `<a href="${he.escape(linkUrl)}" target="_blank" rel="noopener noreferrer">${img}</a>`
        : img
      return `<div${styleAttr(`text-align:${align};`)}>${content}</div>`
    }
    if (kind === 'button') {
      const label = he.escape(String(attrs.buttonLabel ?? 'Button'))
      const href = he.escape(String(attrs.buttonHref ?? '#'))
      const radius = Math.max(0, Number(attrs.borderRadius ?? 0))
      const bg = he.escape(String(attrs.backgroundColor ?? '#2563eb'))
      const fg = he.escape(String(attrs.textColor ?? '#ffffff'))
      const fullWidth = Boolean(attrs.fullWidth)
      const tableWidth = fullWidth ? '100%' : 'auto'
      const align = fullWidth ? 'center' : 'left'
      return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="${tableWidth}"${styleAttr('margin:8px 0;')}><tr><td align="${align}" bgcolor="${bg}"${styleAttr(`border-radius:${radius}px;text-align:center;`)}><a href="${href}" target="_blank" rel="noopener noreferrer"${styleAttr(`display:block;padding:12px 20px;color:${fg};text-decoration:none;font-weight:600;`)}>${label}</a></td></tr></table>`
    }
    if (kind === 'divider') {
      const style = he.escape(String(attrs.lineStyle ?? 'solid'))
      const thickness = Math.max(1, Number(attrs.thickness ?? 1))
      const color = he.escape(String(attrs.color ?? '#e5e7eb'))
      return `<hr${styleAttr(`border:0;border-top:${thickness}px ${style} ${color};margin:12px 0;`)}/>`
    }
    if (kind === 'spacer') {
      const height = Math.max(0, Number(attrs.height ?? 24))
      return `<div${styleAttr(`height:${height}px;line-height:${height}px;font-size:0;`)}>&nbsp;</div>`
    }
  }

  if (node.type === 'paragraph') {
    const children = (node.content ?? []).map((c) => renderTextNode(c, ctx)).join('')
    const style = `margin:0 0 14px;line-height:1.6;color:#111827;font-size:15px;${alignFromAttrs(node.attrs)}`
    return `<p${styleAttr(style)}>${children || '&nbsp;'}</p>`
  }

  if (node.type === 'heading') {
    const level = Math.min(3, Math.max(1, Number(node.attrs?.level ?? 1)))
    const children = (node.content ?? []).map((c) => renderTextNode(c, ctx)).join('')
    const sizes: Record<number, string> = { 1: '24px', 2: '20px', 3: '16px' }
    const margins: Record<number, string> = {
      1: '16px 0 8px',
      2: '14px 0 6px',
      3: '12px 0 4px',
    }
    const style = `font-size:${sizes[level]};font-weight:700;line-height:1.3;color:#111827;margin:${margins[level]};${alignFromAttrs(node.attrs)}`
    return `<h${level}${styleAttr(style)}>${children || '&nbsp;'}</h${level}>`
  }

  if (node.type === 'bulletList') {
    const children = (node.content ?? []).map((c) => renderTextNode(c, ctx)).join('')
    return `<ul${styleAttr('margin:0 0 14px 20px;padding:0;color:#111827;font-size:15px;')}>${children}</ul>`
  }

  if (node.type === 'orderedList') {
    const children = (node.content ?? []).map((c) => renderTextNode(c, ctx)).join('')
    return `<ol${styleAttr('margin:0 0 14px 20px;padding:0;color:#111827;font-size:15px;')}>${children}</ol>`
  }

  if (node.type === 'listItem') {
    const children = (node.content ?? []).map((c) => renderTextNode(c, ctx)).join('')
    return `<li${styleAttr('margin:0 0 8px;')}>${children}</li>`
  }

  return (node.content ?? []).map((c) => renderTextNode(c, ctx)).join('')
}

function renderTextBlock(block: Extract<EmailBlock, { type: 'text' }>, ctx: RenderContext): string {
  const root = block.props.doc
  const body = (root.content ?? []).map((node) => renderTextNode(node, ctx)).join('')
  return `<tr><td${styleAttr('padding:0 0 16px;')}>${body}</td></tr>`
}

function renderImageBlock(block: Extract<EmailBlock, { type: 'image' }>): string {
  if (!block.props.url) return ''
  const align = block.props.align
  const width = he.escape(block.props.width || '100%')
  const alt = he.escape(block.props.alt || '')
  const src = he.escape(block.props.url)
  const img = `<img src="${src}" alt="${alt}" width="${width.replace('%', '')}"${styleAttr('display:block;border:0;max-width:100%;height:auto;')}/>`
  const wrapped = block.props.linkUrl
    ? `<a href="${he.escape(block.props.linkUrl)}" target="_blank" rel="noopener noreferrer">${img}</a>`
    : img
  return `<tr><td align="${align}"${styleAttr('padding:0 0 16px;')}>${wrapped}</td></tr>`
}

function renderButtonBlock(block: Extract<EmailBlock, { type: 'button' }>): string {
  const label = he.escape(block.props.label || 'Button')
  const href = he.escape(block.props.href || '#')
  const radius = Math.max(0, block.props.borderRadius || 0)
  const tdAlign = block.props.fullWidth ? 'center' : 'left'
  const tableWidth = block.props.fullWidth ? '100%' : 'auto'
  return `<tr><td align="${tdAlign}"${styleAttr('padding:0 0 16px;')}><table role="presentation" cellspacing="0" cellpadding="0" border="0" width="${tableWidth}"><tr><td bgcolor="${he.escape(
    block.props.backgroundColor,
  )}"${styleAttr(`border-radius:${radius}px;text-align:center;`)}><a href="${href}" target="_blank" rel="noopener noreferrer"${styleAttr(
    `display:block;padding:12px 20px;color:${he.escape(block.props.textColor)};text-decoration:none;font-weight:600;`,
  )}>${label}</a></td></tr></table></td></tr>`
}

function renderDividerBlock(block: Extract<EmailBlock, { type: 'divider' }>): string {
  return `<tr><td${styleAttr('padding:8px 0 16px;')}><hr${styleAttr(
    `border:0;border-top:${Math.max(1, block.props.thickness)}px ${he.escape(
      block.props.lineStyle,
    )} ${he.escape(block.props.color)};margin:0;`,
  )}/></td></tr>`
}

function renderSpacerBlock(block: Extract<EmailBlock, { type: 'spacer' }>): string {
  return `<tr><td height="${Math.max(0, block.props.height)}"${styleAttr(
    `line-height:${Math.max(0, block.props.height)}px;font-size:0;`,
  )}>&nbsp;</td></tr>`
}

function getPathValue(input: Record<string, unknown>, path: string): unknown {
  if (!path) return undefined
  return path.split('.').reduce<unknown>((acc, segment) => {
    if (!acc || typeof acc !== 'object') return undefined
    return (acc as Record<string, unknown>)[segment]
  }, input)
}

function stringifyForCompare(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return JSON.stringify(value)
}

function evaluateCondition(
  block: Extract<EmailBlock, { type: 'conditional' }>,
  ctx: RenderContext,
): boolean {
  const source = ctx.sampleData ?? {}
  const value = getPathValue(source, block.props.variableKey)
  const compare = block.props.compareValue
  switch (block.props.operator) {
    case 'equals':
      return stringifyForCompare(value) === compare
    case 'not_equals':
      return stringifyForCompare(value) !== compare
    case 'contains':
      if (typeof value === 'string') return value.includes(compare)
      if (Array.isArray(value)) return value.some((x) => stringifyForCompare(x) === compare)
      return false
    case 'not_empty':
      if (Array.isArray(value)) return value.length > 0
      return stringifyForCompare(value).trim().length > 0
    case 'truthy':
    default:
      return Boolean(value)
  }
}

function renderBlocks(blocks: EmailBlock[], ctx: RenderContext): string {
  return blocks.map((b) => renderBlock(b, ctx)).join('')
}

function renderConditionalBlock(
  block: Extract<EmailBlock, { type: 'conditional' }>,
  ctx: RenderContext,
): string {
  if (ctx.mode === 'plain') {
    const pass = evaluateCondition(block, ctx)
    return renderBlocks(pass ? block.props.thenBlocks : block.props.elseBlocks, ctx)
  }

  const escapedCompare = JSON.stringify(block.props.compareValue ?? '')
  const conditionExpr =
    block.props.operator === 'truthy'
      ? block.props.variableKey
      : block.props.operator === 'equals'
        ? `(eq ${block.props.variableKey} ${escapedCompare})`
        : block.props.operator === 'not_equals'
          ? `(ne ${block.props.variableKey} ${escapedCompare})`
          : block.props.operator === 'contains'
            ? `(contains ${block.props.variableKey} ${escapedCompare})`
            : `(notEmpty ${block.props.variableKey})`
  const thenHtml = renderBlocks(block.props.thenBlocks, ctx)
  const elseHtml = renderBlocks(block.props.elseBlocks, ctx)
  if (elseHtml) {
    return `{{#if ${conditionExpr}}}${thenHtml}{{else}}${elseHtml}{{/if}}`
  }
  return `{{#if ${conditionExpr}}}${thenHtml}{{/if}}`
}

function renderLoopBlock(
  block: Extract<EmailBlock, { type: 'loop' }>,
  ctx: RenderContext,
): string {
  if (ctx.mode === 'plain') {
    const source = ctx.sampleData ?? {}
    const arrValue = getPathValue(source, block.props.arrayKey)
    if (!Array.isArray(arrValue) || arrValue.length === 0) {
      return renderBlocks(block.props.emptyBlocks, ctx)
    }
    return arrValue
      .map((item) =>
        renderBlocks(block.props.bodyBlocks, {
          ...ctx,
          sampleData: {
            ...(ctx.sampleData ?? {}),
            [block.props.itemAlias || 'item']: item,
          },
        }),
      )
      .join('')
  }

  const body = renderBlocks(block.props.bodyBlocks, ctx)
  const empty = renderBlocks(block.props.emptyBlocks, ctx)
  if (empty) {
    return `{{#each ${block.props.arrayKey}}}${body}{{else}}${empty}{{/each}}`
  }
  return `{{#each ${block.props.arrayKey}}}${body}{{/each}}`
}

function renderTwoColumnBlock(
  block: Extract<EmailBlock, { type: 'two_column' }>,
  ctx: RenderContext,
): string {
  const left = renderBlocks(block.props.leftBlocks, ctx)
  const right = renderBlocks(block.props.rightBlocks, ctx)
  return `<tr><td style="padding:0 0 16px;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td width="50%" valign="top" style="padding-right:8px;">${left}</td><td width="50%" valign="top" style="padding-left:8px;">${right}</td></tr></table></td></tr>`
}

function renderThreeColumnBlock(
  block: Extract<EmailBlock, { type: 'three_column' }>,
  ctx: RenderContext,
): string {
  const left = renderBlocks(block.props.leftBlocks, ctx)
  const center = renderBlocks(block.props.centerBlocks, ctx)
  const right = renderBlocks(block.props.rightBlocks, ctx)
  return `<tr><td style="padding:0 0 16px;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td width="33.33%" valign="top" style="padding-right:6px;">${left}</td><td width="33.33%" valign="top" style="padding:0 3px;">${center}</td><td width="33.33%" valign="top" style="padding-left:6px;">${right}</td></tr></table></td></tr>`
}

export function renderBlock(block: EmailBlock, ctx: RenderContext): string {
  if (block.type === 'text') return renderTextBlock(block, ctx)
  if (block.type === 'image') return renderImageBlock(block)
  if (block.type === 'button') return renderButtonBlock(block)
  if (block.type === 'divider') return renderDividerBlock(block)
  if (block.type === 'spacer') return renderSpacerBlock(block)
  if (block.type === 'conditional') return renderConditionalBlock(block, ctx)
  if (block.type === 'loop') return renderLoopBlock(block, ctx)
  if (block.type === 'two_column') return renderTwoColumnBlock(block, ctx)
  return renderThreeColumnBlock(block, ctx)
}

function renderAttachment(item: AttachmentItem, ctx: RenderContext): string {
  const hydratedUrl =
    ctx.mode === 'plain'
      ? hydrateAttachmentUrl(item.url, ctx.sampleData)
      : item.url
  if (!hydratedUrl.trim()) return ''
  const hint = classifyAttachment(hydratedUrl)
  const label = he.escape(attachmentDisplayLabel(item, hint))
  const href = he.escape(hydratedUrl)
  const buttonStyle =
    item.style === 'button'
      ? 'display:inline-block;padding:10px 14px;background:#1f2937;color:#fff;border-radius:6px;text-decoration:none;font-size:13px;font-weight:600;'
      : 'color:#1d4ed8;text-decoration:underline;font-size:14px;'
  const downloadAttr = hint.download ? ' download' : ''

  if (hint.kind === 'image') {
    return `<tr><td${styleAttr('padding:0 0 14px;')}><a href="${href}" target="_blank" rel="noopener noreferrer"><img src="${href}" alt="${label}"${styleAttr('display:block;max-width:100%;height:auto;border:0;')}/></a></td></tr>`
  }

  if (hint.kind === 'video') {
    return `<tr><td${styleAttr('padding:0 0 14px;')}><a href="${href}" target="_blank" rel="noopener noreferrer"${styleAttr(
      buttonStyle,
    )}>${label || 'Watch Video'}</a></td></tr>`
  }

  return `<tr><td${styleAttr('padding:0 0 12px;')}><a href="${href}" target="_blank" rel="noopener noreferrer"${downloadAttr}${styleAttr(
    buttonStyle,
  )}>${label}</a></td></tr>`
}

export function renderAttachments(
  attachments: AttachmentItem[] | undefined,
  ctx: RenderContext,
): string {
  if (!attachments || attachments.length === 0) return ''
  const rows = attachments.map((item) => renderAttachment(item, ctx)).join('')
  if (!rows) return ''
  return `<tr><td${styleAttr('padding:8px 0 0;')}><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">${rows}</table></td></tr>`
}
