import type { ExportInput, ExportArtifacts } from './types'
import { buildEmailHtml } from './buildHtml'

function collectVariableStats(input: ExportInput): {
  variablesUsed: string[]
  requiredVariablesMissing: string[]
} {
  const joined = JSON.stringify(input.document)
  const used = new Set<string>()
  const requiredMissing: string[] = []
  for (const group of input.variableSchema) {
    for (const variable of group.variables) {
      const has = joined.includes(`"key":"${variable.key}"`)
      if (has) used.add(variable.key)
      if (variable.required && !has) requiredMissing.push(variable.key)
    }
  }
  return {
    variablesUsed: Array.from(used),
    requiredVariablesMissing: requiredMissing,
  }
}

export function exportTemplate(input: ExportInput, mode: 'production' | 'plain'): ExportArtifacts {
  const html = buildEmailHtml(input, mode)
  const variableStats = collectVariableStats(input)
  return {
    mode,
    html,
    language: input.language,
    json: input.document,
    metadata: {
      name: input.templateName,
      subject: input.subject,
      preheader: input.preheader,
      tags: input.tags,
      variablesUsed: variableStats.variablesUsed,
      requiredVariablesMissing: variableStats.requiredVariablesMissing,
      createdAt: input.createdAt,
      updatedAt: input.updatedAt,
    },
  }
}

export function htmlToPlainText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|li|tr)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export type {
  ExportArtifacts,
  ExportInput,
  ExportMode,
  PreviewViewport,
  RenderContext,
} from './types'
