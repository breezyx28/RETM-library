import type { CustomTokenFormat, TokenFormat } from '../../types'

/**
 * Formats a dot-path variable key for output per spec §6 (email template engines).
 * Used in chip tooltips and in Slice C HTML export.
 */
export function formatVariableKey(
  key: string,
  tokenFormat: TokenFormat = 'handlebars',
  custom?: CustomTokenFormat,
): string {
  if (tokenFormat === 'dollar') {
    return `$\{${key}}`
  }
  if (tokenFormat === 'jinja') {
    return `{{ ${key} }}`
  }
  if (tokenFormat === 'erb') {
    return `<%= ${key} %>`
  }
  if (tokenFormat === 'custom' && custom?.open && custom?.close) {
    return `${custom.open}${key}${custom.close}`
  }
  // handlebars, mustache
  return `{{${key}}}`
}
