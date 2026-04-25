import { validateExportInput } from './validateExport'
import type { ExportInput } from '../export'

function makeBaseInput(): ExportInput {
  return {
    templateId: 'tpl_1',
    templateName: 'Validation',
    language: 'en',
    subject: '',
    preheader: '',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    document: {
      version: 1,
      attachments: [],
      blocks: [
        {
          id: 'img1',
          type: 'image',
          props: { url: '', alt: '', width: '100%', align: 'center' },
        },
        {
          id: 'btn1',
          type: 'button',
          props: {
            label: '',
            href: '',
            fullWidth: true,
            backgroundColor: '#ffffff',
            textColor: '#ffffff',
            borderRadius: 4,
          },
        },
      ],
    },
    variableSchema: [
      {
        group: 'User',
        variables: [{ key: 'user.firstName', label: 'First Name', type: 'string', required: true }],
      },
    ],
    tokenFormat: 'handlebars',
  }
}

describe('validateExportInput', () => {
  it('returns expected errors and warnings', () => {
    const result = validateExportInput(makeBaseInput())
    expect(result.hasErrors).toBe(true)
    expect(result.hasWarnings).toBe(true)
    expect(result.issues.some((x) => x.code === 'subject_missing')).toBe(true)
    expect(result.issues.some((x) => x.code === 'preheader_missing')).toBe(true)
    expect(result.issues.some((x) => x.code === 'button_href_missing')).toBe(true)
    expect(result.issues.some((x) => x.code === 'required_variable_missing')).toBe(true)
    expect(result.issues.some((x) => x.code === 'button_low_contrast')).toBe(true)
  })

  it('passes with clean content', () => {
    const input = makeBaseInput()
    input.subject = 'Subject'
    input.preheader = 'Preheader'
    input.document.blocks = [
      {
        id: 'txt1',
        type: 'text',
        props: {
          doc: {
            type: 'doc',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'ecVariable', attrs: { key: 'user.firstName', label: 'First Name' } }],
              },
            ],
          },
        },
      },
    ]
    const result = validateExportInput(input)
    expect(result.hasErrors).toBe(false)
  })
})
