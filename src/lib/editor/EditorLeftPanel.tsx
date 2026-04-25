import {
  Type,
  Image,
  MousePointer2,
  Minus,
  MoveVertical,
  GitBranch,
  Repeat,
  Columns2,
  Columns3,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { usePanelConfig, type FlatVariable } from '../context/PanelConfigContext'
import { usePanelStore } from '../store'
import type { EmailBlock } from '../types/editorDocument'
import {
  defaultButton,
  defaultConditional,
  defaultDivider,
  defaultImage,
  defaultLoop,
  defaultSpacer,
  defaultThreeColumn,
  defaultTwoColumn,
  newBlockId,
} from '../types/editorDocument'
import type { EditorDocumentV1 } from '../types/editorDocument'
import type { SavedBlock } from '../types/savedBlock'

const emptyTiptap = {
  type: 'doc' as const,
  content: [{ type: 'paragraph' as const }],
}

export function EditorLeftPanel({
  work,
  onChange,
  readOnly,
  onInsertVariable,
  savedBlocks,
  onInsertSavedBlock,
  onDeleteSavedBlock,
}: {
  work: EditorDocumentV1
  onChange: (next: EditorDocumentV1) => void
  readOnly: boolean
  onInsertVariable: (v: FlatVariable) => void
  savedBlocks: SavedBlock[]
  onInsertSavedBlock: (saved: SavedBlock) => void
  onDeleteSavedBlock: (savedBlockId: string) => void
}) {
  const { variableSchema } = usePanelConfig()
  const activeTextBlockId = usePanelStore((s) => s.activeTextBlockId)
  const setActiveTextBlockId = usePanelStore((s) => s.setActiveTextBlockId)
  const [tab, setTab] = useState<'blocks' | 'saved'>('blocks')
  const [savedQuery, setSavedQuery] = useState('')
  const filteredSaved = useMemo(() => {
    const q = savedQuery.trim().toLowerCase()
    if (!q) return savedBlocks
    return savedBlocks.filter((item) =>
      `${item.name} ${(item.tags ?? []).join(' ')}`.toLowerCase().includes(q),
    )
  }, [savedBlocks, savedQuery])

  const addBlock = (b: EmailBlock) => {
    onChange({ ...work, version: 1, blocks: [...work.blocks, b] })
  }

  if (readOnly) {
    return (
      <aside data-ec-sidebar="" data-ec-sidebar-left="" className="ec-sidebar">
        <p className="ec-muted">Read only</p>
      </aside>
    )
  }

  return (
    <aside
      data-ec-sidebar=""
      data-ec-sidebar-left=""
      className="ec-sidebar"
    >
      <div data-ec-sidebar-section="" className="ec-sidebar-section">
        <div className="ec-rfield-inline" style={{ marginBottom: 8 }}>
          <button type="button" data-ec-btn="" data-ec-variant={tab === 'blocks' ? 'primary' : 'ghost'} onClick={() => setTab('blocks')}>
            Blocks
          </button>
          <button type="button" data-ec-btn="" data-ec-variant={tab === 'saved' ? 'primary' : 'ghost'} onClick={() => setTab('saved')}>
            Saved
          </button>
        </div>
        {tab === 'blocks' ? (
          <>
        <h3 data-ec-h3="">Blocks</h3>
        <div className="ec-palette">
          <button
            type="button"
            className="ec-palette__btn"
            onClick={() =>
              addBlock({ id: newBlockId(), type: 'text', props: { doc: emptyTiptap } })
            }
          >
            <Type size={16} />
            <span>Text</span>
          </button>
          <button
            type="button"
            className="ec-palette__btn"
            onClick={() =>
              addBlock({ id: newBlockId(), type: 'image', props: defaultImage() })
            }
          >
            <Image size={16} />
            <span>Image</span>
          </button>
          <button
            type="button"
            className="ec-palette__btn"
            onClick={() =>
              addBlock({ id: newBlockId(), type: 'button', props: defaultButton() })
            }
          >
            <MousePointer2 size={16} />
            <span>Button</span>
          </button>
          <button
            type="button"
            className="ec-palette__btn"
            onClick={() =>
              addBlock({ id: newBlockId(), type: 'divider', props: defaultDivider() })
            }
          >
            <Minus size={16} />
            <span>Divider</span>
          </button>
          <button
            type="button"
            className="ec-palette__btn"
            onClick={() =>
              addBlock({ id: newBlockId(), type: 'spacer', props: defaultSpacer() })
            }
          >
            <MoveVertical size={16} />
            <span>Spacer</span>
          </button>
          <button
            type="button"
            className="ec-palette__btn"
            onClick={() =>
              addBlock({
                id: newBlockId(),
                type: 'conditional',
                props: defaultConditional(),
              })
            }
          >
            <GitBranch size={16} />
            <span>Conditional</span>
          </button>
          <button
            type="button"
            className="ec-palette__btn"
            onClick={() =>
              addBlock({ id: newBlockId(), type: 'loop', props: defaultLoop() })
            }
          >
            <Repeat size={16} />
            <span>Loop</span>
          </button>
          <button
            type="button"
            className="ec-palette__btn"
            onClick={() =>
              addBlock({ id: newBlockId(), type: 'two_column', props: defaultTwoColumn() })
            }
          >
            <Columns2 size={16} />
            <span>2 Columns</span>
          </button>
          <button
            type="button"
            className="ec-palette__btn"
            onClick={() =>
              addBlock({ id: newBlockId(), type: 'three_column', props: defaultThreeColumn() })
            }
          >
            <Columns3 size={16} />
            <span>3 Columns</span>
          </button>
        </div>
          </>
        ) : (
          <>
            <h3 data-ec-h3="">Saved Blocks</h3>
            <input
              data-ec-input=""
              placeholder="Search saved blocks..."
              value={savedQuery}
              onChange={(e) => setSavedQuery(e.target.value)}
            />
            {filteredSaved.length === 0 ? (
              <p className="ec-muted">No saved blocks yet.</p>
            ) : (
              filteredSaved.map((item) => (
                <div key={item.id} className="ec-attachment-row">
                  <strong>{item.name}</strong>
                  <div className="ec-rfield-inline" style={{ marginTop: 6 }}>
                    <button type="button" data-ec-btn="" data-ec-variant="ghost" onClick={() => onInsertSavedBlock(item)}>
                      Insert
                    </button>
                    <button type="button" data-ec-btn="" data-ec-variant="ghost" onClick={() => onDeleteSavedBlock(item.id)}>
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>
      <div data-ec-sidebar-section="" className="ec-sidebar-section">
        <h3 data-ec-h3="">Variables</h3>
        <p className="ec-hint">Click to insert a chip in the active text block.</p>
        {variableSchema.length === 0 ? (
          <p className="ec-muted">No variable schema on this panel.</p>
        ) : (
          variableSchema.map((g) => (
            <div key={g.group} className="ec-var-group">
              <div className="ec-var-group__name">{g.group}</div>
              {g.variables.map((v) => (
                <button
                  key={v.key}
                  type="button"
                  className="ec-var-pill"
                  style={
                    g.color
                      ? { borderColor: g.color, color: g.color }
                      : undefined
                  }
                  onClick={() => {
                    if (!activeTextBlockId) {
                      const firstText = work.blocks.find((b) => b.type === 'text')
                      if (firstText) {
                        setActiveTextBlockId(firstText.id)
                      }
                    }
                    onInsertVariable({
                      key: v.key,
                      label: v.label,
                      type: v.type,
                      group: g.group,
                      color: g.color,
                      sample: v.sample,
                    })
                  }}
                >
                  {v.label}
                </button>
              ))}
            </div>
          ))
        )}
      </div>
    </aside>
  )
}
