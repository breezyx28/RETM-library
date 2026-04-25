import type { Template, ThemeName, ThemeOverride } from '../../types'
import type { StorageMode } from '../EmailTemplatePanel/EmailTemplatePanel.types'

export type ViewerDefaultView = 'grid' | 'list'

export type ViewerDefaultTab = 'preview' | 'code'

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
