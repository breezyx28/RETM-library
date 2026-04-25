export type ValidationSeverity = 'error' | 'warning'

export interface ValidationIssue {
  id: string
  severity: ValidationSeverity
  code: string
  message: string
}

export interface ValidationResult {
  issues: ValidationIssue[]
  hasErrors: boolean
  hasWarnings: boolean
}
