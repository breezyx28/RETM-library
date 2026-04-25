import { fireEvent, render, screen } from '@testing-library/react'
import { LibraryView } from './LibraryView'

const setStatus = vi.fn()

vi.mock('../store', () => ({
  usePanelStore: (selector: (state: any) => unknown) =>
    selector({
      templates: [
        {
          id: 'tpl_1',
          name: 'Welcome',
          defaultLanguage: 'en',
          languages: {
            en: {
              subject: '',
              preheader: '',
              editorJson: { version: 1, blocks: [], attachments: [] },
              html: '<html/>',
              updatedAt: '2026-01-01T00:00:00.000Z',
            },
          },
          status: 'draft',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
          tags: ['welcome'],
          folderIds: [],
        },
      ],
      loading: false,
      error: null,
      createBlank: vi.fn(),
      duplicate: vi.fn(),
      openEditor: vi.fn(),
      setRenameTarget: vi.fn(),
      setDeleteTarget: vi.fn(),
      setStatus,
    }),
}))

vi.mock('../context/PanelConfigContext', () => ({
  usePanelConfig: () => ({
    variableSchema: [],
    tokenFormat: 'handlebars',
    customTokenFormat: undefined,
    sampleData: undefined,
    onExport: vi.fn(),
    userRole: 'admin',
    publishMode: 'approval',
    organizationMode: 'both',
  }),
}))

describe('LibraryView', () => {
  it('shows approval action and triggers status transition', () => {
    render(<LibraryView />)
    const submitButton = screen.getByRole('button', { name: 'Submit review' })
    fireEvent.click(submitButton)
    expect(setStatus).toHaveBeenCalledWith('tpl_1', 'pending_review')
  })
})
