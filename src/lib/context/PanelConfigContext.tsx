import { createContext, useContext, useMemo, type ReactNode } from 'react'
import type {
  CustomTokenFormat,
  TokenFormat,
} from '../../types'
import { formatVariableKey } from '../tokens/formatToken'

export interface FlatVariable {
  key: string
  label: string
  type: string
  group: string
  color?: string
  sample?: string | number | boolean
}

type ExportCallbackPayload = {
  html: string
  mode: 'production' | 'plain'
  language: string
  json: unknown
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

type TestSendPayload = {
  html: string
  metadata: ExportCallbackPayload['metadata']
  recipient: string
}

export interface PanelConfigValue {
  variableSchema: import('../../types').VariableSchema
  tokenFormat: TokenFormat
  customTokenFormat?: CustomTokenFormat
  sampleData?: Record<string, unknown>
  readOnly: boolean
  onExport?: (payload: ExportCallbackPayload) => void
  onTestSend?: (payload: TestSendPayload) => void | Promise<void>
  userRole: 'admin' | 'editor' | 'viewer'
  publishMode: 'direct' | 'approval'
  organizationMode: 'tags' | 'folders' | 'both'
  /** Flat list for @ menu and tooltips */
  flatVariables: FlatVariable[]
  getTokenPreview: (key: string) => string
}

const defaultConfig: PanelConfigValue = {
  variableSchema: [],
  tokenFormat: 'handlebars',
  readOnly: false,
  userRole: 'admin',
  publishMode: 'direct',
  organizationMode: 'both',
  flatVariables: [],
  getTokenPreview: (key) => `{{${key}}}`,
}

const PanelConfigContext = createContext<PanelConfigValue>(defaultConfig)

function flattenVariableSchema(
  groups: import('../../types').VariableSchema,
): FlatVariable[] {
  const out: FlatVariable[] = []
  for (const g of groups) {
    for (const v of g.variables) {
      out.push({
        key: v.key,
        label: v.label,
        type: v.type,
        group: g.group,
        color: g.color,
        sample: v.sample,
      })
    }
  }
  return out
}

export interface PanelConfigProviderProps {
  variableSchema: import('../../types').VariableSchema
  tokenFormat?: TokenFormat
  customTokenFormat?: CustomTokenFormat
  sampleData?: Record<string, unknown>
  readOnly?: boolean
  onExport?: (payload: ExportCallbackPayload) => void
  onTestSend?: (payload: TestSendPayload) => void | Promise<void>
  userRole?: 'admin' | 'editor' | 'viewer'
  publishMode?: 'direct' | 'approval'
  organizationMode?: 'tags' | 'folders' | 'both'
  children: ReactNode
}

export function PanelConfigProvider({
  variableSchema,
  tokenFormat = 'handlebars',
  customTokenFormat,
  sampleData,
  readOnly = false,
  onExport,
  onTestSend,
  userRole = 'admin',
  publishMode = 'direct',
  organizationMode = 'both',
  children,
}: PanelConfigProviderProps) {
  const value = useMemo<PanelConfigValue>(() => {
    const flatVariables = flattenVariableSchema(variableSchema)
    return {
      variableSchema,
      tokenFormat,
      customTokenFormat,
      sampleData,
      readOnly,
      onExport,
      onTestSend,
      userRole,
      publishMode,
      organizationMode,
      flatVariables,
      getTokenPreview: (key) =>
        formatVariableKey(key, tokenFormat, customTokenFormat),
    }
  }, [
    variableSchema,
    tokenFormat,
    customTokenFormat,
    sampleData,
    readOnly,
    onExport,
    onTestSend,
    userRole,
    publishMode,
    organizationMode,
  ])

  return (
    <PanelConfigContext.Provider value={value}>
      {children}
    </PanelConfigContext.Provider>
  )
}

export function usePanelConfig(): PanelConfigValue {
  return useContext(PanelConfigContext)
}

export { flattenVariableSchema }

/** Find variable by key in schema; used for chip labels. */
export function findVariableInSchema(
  groups: import('../../types').VariableSchema,
  key: string,
): FlatVariable | undefined {
  for (const g of groups) {
    for (const v of g.variables) {
      if (v.key === key) {
        return {
          key: v.key,
          label: v.label,
          type: v.type,
          group: g.group,
          color: g.color,
          sample: v.sample,
        }
      }
    }
  }
  return undefined
}
