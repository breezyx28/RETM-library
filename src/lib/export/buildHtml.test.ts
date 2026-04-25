import { buildEmailHtml } from './buildHtml'
import { createEmptyDocument } from '../types/editorDocument'

describe('buildEmailHtml', () => {
  it('builds email skeleton and applies rtl attributes', () => {
    const html = buildEmailHtml(
      {
        templateId: 'tpl_1',
        templateName: 'RTL Template',
        language: 'ar',
        subject: 'Hi',
        preheader: 'Preview',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        rtl: true,
        document: createEmptyDocument(),
        variableSchema: [],
      },
      'plain',
    )
    expect(html).toContain('<html dir="rtl">')
    expect(html).toContain('dir="rtl"')
    expect(html).toContain('RTL Template')
  })
})
