import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { EmailTemplateViewer } from './EmailTemplateViewer'

const baseTemplate = {
  id: 'tpl_1',
  name: 'Welcome Email',
  defaultLanguage: 'en',
  languages: {
    en: {
      subject: 'Subject',
      preheader: 'Preheader',
      editorJson: {},
      html: '<html><body><p>Hello</p></body></html>',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  },
  status: 'published' as const,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  tags: ['onboarding'],
  folderIds: [],
}

describe('EmailTemplateViewer', () => {
  it('filters by search query', async () => {
    render(
      <EmailTemplateViewer
        storageMode="backend"
        searchable
        onLoad={() => Promise.resolve([baseTemplate])}
      />,
    )
    await screen.findByText('Welcome Email')
    fireEvent.change(screen.getByPlaceholderText('Search templates...'), {
      target: { value: 'invoice' },
    })
    expect(screen.getByText('No templates found.')).toBeTruthy()
  })

  it(
    'shows failure feedback when clipboard write fails',
    async () => {
    const execSpy = vi.fn().mockReturnValue(true)
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: execSpy,
    })
    const writeText = vi.fn().mockRejectedValue(new Error('no clipboard'))
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })

    render(
      <EmailTemplateViewer
        storageMode="backend"
        codeView={{ enabled: true, copyButton: true, defaultTab: 'code' }}
        onLoad={() => Promise.resolve([baseTemplate])}
      />,
    )

    await screen.findByText('Welcome Email')
    fireEvent.click(screen.getByRole('button', { name: 'Copy HTML' }))
    await waitFor(
      () => expect(screen.getByRole('button', { name: 'Copy failed' })).toBeTruthy(),
      { timeout: 12000 },
    )
    expect(execSpy).not.toHaveBeenCalled()
    },
    15000,
  )
})
