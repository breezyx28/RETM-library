/**
 * Template data model (spec §5, §12).
 *
 * A template is a language container: one entry holds N language variants.
 * Every variant has its own editor JSON + exported HTML, but shares metadata
 * and variable schema with its siblings.
 */

export type TemplateStatus = 'draft' | 'pending_review' | 'published' | 'archived'

export type VersionType = 'autosave' | 'manual' | 'restore' | 'pre-export'

export interface TemplateLanguageVariant {
  subject: string
  preheader?: string
  /** Serialized TipTap ProseMirror document. Opaque to consumers. */
  editorJson: unknown
  /** Production HTML produced by the export pipeline. */
  html: string
  updatedAt: string
}

export interface TemplateVersion {
  versionId: string
  templateId: string
  /** Versions are per-language (spec §12). */
  language: string
  savedAt: string
  savedBy?: string
  type: VersionType
  note?: string
  editorJson: unknown
  html: string
}

export interface Template {
  id: string
  name: string
  description?: string
  defaultLanguage: string
  languages: Record<string, TemplateLanguageVariant>
  tags?: string[]
  folderIds?: string[]
  status: TemplateStatus
  createdAt: string
  updatedAt: string
  createdBy?: string
  updatedBy?: string
  /** SEO / delivery metadata (spec §10). */
  fromName?: string
  replyTo?: string
  htmlTitle?: string
  rtl?: boolean
  rejectionNote?: string
}
