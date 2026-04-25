import he from 'he'
import type { RenderContext } from './types'
import { formatVariableKey } from '../tokens/formatToken'

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
  if (ctx.mode === 'plain') {
    const fromData = ctx.sampleData ? getPathValue(ctx.sampleData, key) : undefined
    const fromSchema = sampleFromSchema(ctx, key)
    const value = fromData ?? fromSchema ?? ''
    return he.escape(String(value))
  }

  return he.escape(
    formatVariableKey(key, ctx.tokenFormat ?? 'handlebars', ctx.customTokenFormat),
  )
}
