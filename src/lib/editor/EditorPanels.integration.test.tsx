import { fireEvent, render, screen } from '@testing-library/react'
import { EditorLeftPanel } from './EditorLeftPanel'
import { EditorRightPanel } from './EditorRightPanel'
import { PreviewFrame } from './PreviewFrame'

vi.mock('../context/PanelConfigContext', () => ({
  usePanelConfig: () => ({
    variableSchema: [
      {
        group: 'User',
        color: '#123456',
        variables: [{ key: 'user.firstName', label: 'First Name', type: 'string' }],
      },
    ],
  }),
}))

vi.mock('../store', () => ({
  usePanelStore: (selector: (s: any) => unknown) =>
    selector({ activeTextBlockId: null, setActiveTextBlockId: vi.fn(), selectedBlockId: null, setSelectedBlockId: vi.fn() }),
}))

describe('Editor panel integration flows', () => {
  it('supports saved block insert and delete from left panel', () => {
    const onInsertSavedBlock = vi.fn()
    const onDeleteSavedBlock = vi.fn()
    render(
      <EditorLeftPanel
        work={{ version: 1, blocks: [], attachments: [] }}
        onChange={vi.fn()}
        readOnly={false}
        onInsertVariable={vi.fn()}
        savedBlocks={[
          {
            id: 's1',
            name: 'Hero',
            visibility: 'personal',
            createdAt: '2026-01-01T00:00:00.000Z',
            snapshot: { id: 'b1', type: 'spacer', props: { height: 20 } },
          },
        ]}
        onInsertSavedBlock={onInsertSavedBlock}
        onDeleteSavedBlock={onDeleteSavedBlock}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Saved' }))
    fireEvent.click(screen.getByRole('button', { name: 'Insert' }))
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    expect(onInsertSavedBlock).toHaveBeenCalledTimes(1)
    expect(onDeleteSavedBlock).toHaveBeenCalledWith('s1')
  })

  it('wires version compare selector callbacks in right panel', () => {
    const onCompareChange = vi.fn()
    render(
      <EditorRightPanel
        work={{ version: 1, blocks: [{ id: 'x', type: 'spacer', props: { height: 8 } }], attachments: [] }}
        onChange={vi.fn()}
        name="Template"
        subject="Subject"
        preheader=""
        fromName=""
        replyTo=""
        htmlTitle=""
        rtl={false}
        language="en"
        supportedLanguages={['en']}
        onMetaChange={vi.fn()}
        versions={[
          {
            versionId: 'v1',
            templateId: 't1',
            language: 'en',
            savedAt: '2026-01-01T00:00:00.000Z',
            type: 'manual',
            editorJson: {},
            html: '<html>1</html>',
          },
          {
            versionId: 'v2',
            templateId: 't1',
            language: 'en',
            savedAt: '2026-01-02T00:00:00.000Z',
            type: 'manual',
            editorJson: {},
            html: '<html>2</html>',
          },
        ]}
        compareLeftId=""
        compareRightId=""
        onCompareChange={onCompareChange}
        readOnly={false}
      />,
    )
    const selects = screen.getAllByRole('combobox')
    expect(selects.length).toBeGreaterThanOrEqual(3)
    fireEvent.change(selects[1]!, { target: { value: 'v1' } })
    fireEvent.change(selects[2]!, { target: { value: 'v2' } })
    expect(onCompareChange).toHaveBeenCalled()
  })

  it('renders preview frame in mobile dark mode', () => {
    const { container } = render(<PreviewFrame html="<p>Hi</p>" viewport="mobile" darkMode />)
    const frame = container.querySelector('iframe')
    expect(frame?.style.width).toBe('375px')
    expect(frame?.style.filter).toContain('invert')
  })
})
