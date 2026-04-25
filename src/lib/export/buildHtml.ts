import juice from 'juice'
import type { ExportInput, RenderContext } from './types'
import { renderAttachments, renderBlock } from './renderBlocks'

const BASE_CSS = `
  body { margin: 0; padding: 0; background: #f3f4f6; }
  table { border-collapse: collapse; }
  img { border: 0; outline: none; text-decoration: none; }
`

export function buildEmailHtml(input: ExportInput, mode: 'production' | 'plain'): string {
  const ctx: RenderContext = {
    mode,
    variableSchema: input.variableSchema,
    tokenFormat: input.tokenFormat,
    customTokenFormat: input.customTokenFormat,
    sampleData: input.sampleData,
  }

  const rows = input.document.blocks.map((block) => renderBlock(block, ctx)).join('')
  const attachmentRows = renderAttachments(input.document.attachments, ctx)
  const preheader = input.preheader?.trim()
    ? `<div style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;mso-hide:all;">${input.preheader}</div>`
    : ''

  const html = `<!doctype html>
<html dir="${input.rtl ? 'rtl' : 'ltr'}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${input.templateName}</title>
    <style>${BASE_CSS}</style>
  </head>
  <body dir="${input.rtl ? 'rtl' : 'ltr'}">
    ${preheader}
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f3f4f6;">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;">
            <tr><td style="padding:24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                ${rows}
                ${attachmentRows}
              </table>
            </td></tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`

  return juice(html)
}
