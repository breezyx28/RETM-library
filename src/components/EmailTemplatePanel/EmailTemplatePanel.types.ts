import type { ReactNode } from 'react'
import type {
  VariableSchema,
  TokenFormat,
  CustomTokenFormat,
  Template,
  TemplateVersion,
  ThemeName,
  ThemeOverride,
} from '../../types'
import type { SavedBlock } from '../../lib/types/savedBlock'

export type StorageMode = 'backend' | 'local' | 'hybrid'

export type UserRole = 'admin' | 'editor' | 'viewer'

export type PublishMode = 'direct' | 'approval'

export type OrganizationMode = 'tags' | 'folders' | 'both'

export type ExportMode = 'production' | 'plain'

export interface ExportMetadata {
  name: string
  subject: string
  preheader?: string
  tags?: string[]
  variablesUsed: string[]
  requiredVariablesMissing: string[]
  createdAt: string
  updatedAt: string
}

export interface ExportPayload {
  html: string
  mode: ExportMode
  language: string
  json: unknown
  metadata: ExportMetadata
}

/**
 * Props for `<EmailTemplatePanel>` (spec §3.1).
 *
 * Every feature behind these props is implemented progressively across
 * phases 1–3 (spec §23). The full surface is declared now so consumers can
 * compile-check against the final shape.
 */
export interface EmailTemplatePanelProps {
  // Schema
  variableSchema: VariableSchema

  // Token format (spec §6)
  tokenFormat?: TokenFormat
  customTokenFormat?: CustomTokenFormat

  // Storage (spec §9.6)
  storageMode?: StorageMode
  onSave?: (template: Template) => void | Promise<void>
  onLoad?: () => Promise<Template[]> | Template[]
  onDelete?: (id: string) => void | Promise<void>
  onListVersions?: (
    templateId: string,
    language: string,
  ) => Promise<TemplateVersion[]> | TemplateVersion[]
  onGetVersion?: (versionId: string) => Promise<TemplateVersion | null> | TemplateVersion | null
  onSaveVersion?: (version: TemplateVersion) => void | Promise<void>
  onListSavedBlocks?: () => Promise<SavedBlock[]> | SavedBlock[]
  onSaveSavedBlock?: (savedBlock: SavedBlock) => void | Promise<void>
  onDeleteSavedBlock?: (savedBlockId: string) => void | Promise<void>

  // Sample data used for Hydrated Preview (spec §8)
  sampleData?: Record<string, unknown>

  // Multi-language (spec §5)
  supportedLanguages?: string[]
  defaultLanguage?: string
  rtlLanguages?: string[]

  // Permissions (spec §13)
  userRole?: UserRole
  publishMode?: PublishMode

  // Template organization (spec §6.1)
  organizationMode?: OrganizationMode

  // Theming (spec §19)
  theme?: ThemeName
  themeOverride?: ThemeOverride
  headless?: boolean

  // Editor-level flags
  readOnly?: boolean

  // Mounting (spec §6 "Dialog (configurable)")
  /** When true (default) the panel renders inside a Radix Dialog. */
  asDialog?: boolean
  /** Controlled open state. Ignored when `asDialog={false}`. */
  open?: boolean
  /** Uncontrolled initial open state. Ignored when `asDialog={false}`. */
  defaultOpen?: boolean
  /** Open-state change callback. Ignored when `asDialog={false}`. */
  onOpenChange?: (open: boolean) => void
  /**
   * Node rendered inside the Dialog trigger. Commonly a button; use `asChild`
   * semantics (the first child is cloned as the trigger).
   */
  trigger?: ReactNode

  // Persistence key for localStorage mode (spec §9.6)
  /** Override the localStorage key used in `storageMode="local"`. */
  storageKey?: string

  // Callbacks
  onExport?: (payload: ExportPayload) => void
  onTestSend?: (args: {
    html: string
    metadata: ExportMetadata
    recipient: string
  }) => void | Promise<void>

  /** Optional className forwarded to the root `data-ec-panel` element. */
  className?: string
}
