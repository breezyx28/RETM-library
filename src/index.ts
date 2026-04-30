/**
 * RETM Library — visual email template components for React.
 *
 * Public API barrel. See `retm-library-spec.md` for the full product spec.
 */

export { EmailTemplatePanel } from './components/EmailTemplatePanel'
export { EmailTemplateViewer } from './components/EmailTemplateViewer'

export type {
  EmailTemplatePanelProps,
  StorageMode,
  UserRole,
  PublishMode,
  OrganizationMode,
  ExportMode,
  ExportMetadata,
  ExportPayload,
} from './components/EmailTemplatePanel'

export type {
  EmailTemplateViewerProps,
  ViewerDefaultView,
  ViewerDefaultTab,
  ViewerCodeViewConfig,
} from './components/EmailTemplateViewer'

export type {
  Variable,
  VariableGroup,
  VariableSchema,
  VariableType,
  TokenFormat,
  CustomTokenFormat,
  Template,
  TemplateLanguageVariant,
  TemplateStatus,
  TemplateVersion,
  VersionType,
  ThemeName,
} from './types'

export type {
  EmailTemplatePanelClassNames,
  EmailTemplateViewerClassNames,
  PanelControlsSlots,
  PanelDialogsSlots,
  PanelEditorSlots,
  PanelLibrarySlots,
  ViewerSlots,
} from './lib/theme'

export { formatVariableKey } from './lib/tokens/formatToken'
export { exportTemplate } from './lib/export'

export type {
  EditorDocumentV1,
  EmailBlock,
  TiptapDocJson,
  AttachmentItem,
} from './lib/types/editorDocument'
export { EDITOR_DOC_VERSION, migrateEditorJson } from './lib/types/editorDocument'
