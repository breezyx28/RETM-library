/**
 * Token output formats (spec §6).
 *
 * The editor stores variables as structured chip nodes; on HTML export each
 * chip is serialized using the configured `TokenFormat`.
 */

export type TokenFormat =
  | 'handlebars'
  | 'mustache'
  | 'jinja'
  | 'erb'
  | 'dollar'
  | 'custom'

export interface CustomTokenFormat {
  /** Opening delimiter, e.g. `<<` or `[[`. */
  open: string
  /** Closing delimiter, e.g. `>>` or `]]`. */
  close: string
}
