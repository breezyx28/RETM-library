import { createEmptyDocument } from '../types/editorDocument'
import { exportTemplate, htmlToPlainText } from './index'
import type { ExportInput } from './types'

function makeInput(partial?: Partial<ExportInput>): ExportInput {
  return {
    templateId: 'tpl_1',
    templateName: 'Welcome',
    language: 'en',
    subject: 'Hello {{user.firstName}}',
    preheader: 'Preview text',
    tags: ['onboarding'],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    document: createEmptyDocument(),
    variableSchema: [
      {
        group: 'User',
        variables: [
          { key: 'user.firstName', label: 'First Name', type: 'string', required: true },
        ],
      },
    ],
    ...partial,
  }
}

describe('exportTemplate', () => {
  it('returns artifacts with metadata and html', () => {
    const artifacts = exportTemplate(makeInput(), 'production')
    expect(artifacts.mode).toBe('production')
    expect(artifacts.language).toBe('en')
    expect(artifacts.html).toContain('<html')
    expect(artifacts.metadata.name).toBe('Welcome')
    expect(artifacts.metadata.variablesUsed).toEqual([])
    expect(artifacts.metadata.requiredVariablesMissing).toEqual(['user.firstName'])
  })
})

describe('htmlToPlainText', () => {
  it('strips tags and preserves readable lines', () => {
    const plain = htmlToPlainText(
      '<style>.x{}</style><div>Hello<br/>World</div><p>Line 2</p>&amp;&nbsp;',
    )
    expect(plain).toContain('Hello')
    expect(plain).toContain('World')
    expect(plain).toContain('Line 2')
    expect(plain).toContain('&')
    expect(plain).not.toContain('<div>')
  })
})
