/**
 * Variable schema (spec §4).
 *
 * The backend passes an array of `VariableGroup` objects describing every
 * variable the operation team may embed into a template. Chips in the editor
 * are rendered by picking from this schema — free-text variable entry is
 * disallowed by design.
 */

export type VariableType =
  | 'string'
  | 'image'
  | 'file'
  | 'url'
  | 'currency'
  | 'boolean'
  | 'array'

export type VariableRenderAs = 'text' | 'link' | 'image' | 'table' | 'list'

export type VariableListSample = string[]

export interface VariableTableSample {
  table: {
    headers: string[]
    rows: Record<string, unknown>[]
  }
}

export type VariableSampleValue =
  | string
  | number
  | boolean
  | VariableListSample
  | VariableTableSample
  | Record<string, unknown>

export interface Variable {
  /** Dot-path key used on export, e.g. `user.firstName`. */
  key: string
  /** Human-readable label shown in the side panel. */
  label: string
  /** Drives chip rendering and the exported HTML node (spec §4, §7.3). */
  type: VariableType
  /** If true, pre-export validation fails when the template doesn't use it. */
  required?: boolean
  /** Example value used in Hydrated Preview and Plain HTML export (spec §8, §9). */
  sample?: VariableSampleValue
  /** Optional description shown in chip tooltip. */
  description?: string
}

export interface VariableGroup {
  /** Group header label. */
  group: string
  /** Chip color for variables in this group. */
  color?: string
  variables: Variable[]
}

export type VariableSchema = VariableGroup[]
