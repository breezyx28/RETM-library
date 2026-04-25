import type { CustomTokenFormat, TokenFormat, VariableSchema } from '../../types'
import type { EditorDocumentV1 } from '../types/editorDocument'

export type ExportMode = 'production' | 'plain'
export type PreviewViewport = 'desktop' | 'mobile'

export interface ExportInput {
  templateId: string
  templateName: string
  language: string
  subject: string
  preheader?: string
  tags?: string[]
  createdAt: string
  updatedAt: string
  rtl?: boolean
  document: EditorDocumentV1
  variableSchema: VariableSchema
  tokenFormat?: TokenFormat
  customTokenFormat?: CustomTokenFormat
  sampleData?: Record<string, unknown>
}

export interface RenderContext {
  mode: ExportMode
  variableSchema: VariableSchema
  tokenFormat?: TokenFormat
  customTokenFormat?: CustomTokenFormat
  sampleData?: Record<string, unknown>
}

export interface ExportArtifacts {
  mode: ExportMode
  html: string
  language: string
  json: EditorDocumentV1
  metadata: {
    name: string
    subject: string
    preheader?: string
    tags?: string[]
    variablesUsed: string[]
    requiredVariablesMissing: string[]
    createdAt: string
    updatedAt: string
  }
}
