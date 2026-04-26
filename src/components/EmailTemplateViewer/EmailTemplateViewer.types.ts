import type {
  CustomTokenFormat,
  Template,
  ThemeName,
  ThemeOverride,
  TokenFormat,
  VariableSchema,
} from '../../types'
import type { StorageMode } from '../EmailTemplatePanel/EmailTemplatePanel.types'

export type ViewerDefaultView = 'grid' | 'list'

export type ViewerDefaultTab = 'preview' | 'code' | 'plain'

export interface ViewerCodeViewConfig {
  enabled?: boolean
  /** Syntax hint for Shiki. Always `"html"` for now. */
  syntax?: 'html'
  showLineNumbers?: boolean
  copyButton?: boolean
  defaultTab?: ViewerDefaultTab
}

/**
 * Props for `<EmailTemplateViewer>` (spec §3.2, §21).
 *
 * Read-only browser for published templates — no create/edit/delete controls
 * are ever rendered regardless of prop configuration.
 */
export interface EmailTemplateViewerProps {
  // Storage — viewer always loads (never saves) (spec §21)
  storageMode?: StorageMode
  storageKey?: string
  onLoad?: () => Promise<Template[]> | Template[]

  // Display
  defaultView?: ViewerDefaultView
  searchable?: boolean
  filterByTags?: boolean
  filterByLanguage?: boolean
  /** When true, lists published and draft templates (default: published only). */
  includeNonPublished?: boolean

  /**
   * When stored `html` is empty but `editorJson` exists, derive preview/code/plain
   * by exporting with this context (e.g. playground passes panel schema).
   */
  exportContext?: {
    variableSchema: VariableSchema
    tokenFormat?: TokenFormat
    customTokenFormat?: CustomTokenFormat
    sampleData?: Record<string, unknown>
  }

  // Code view
  allowCopy?: boolean
  codeView?: ViewerCodeViewConfig

  // Theming (spec §19)
  theme?: ThemeName
  themeOverride?: ThemeOverride
  headless?: boolean

  // Callback when the user copies code from the code pane
  onCopy?: (html: string, templateId: string) => void

  /** Optional className forwarded to the root `data-ec-viewer` element. */
  className?: string
}
