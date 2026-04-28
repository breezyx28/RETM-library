import { Variable, FolderSearch, MoreVertical, Mail } from 'lucide-react'
import { useMemo, useState } from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { usePanelConfig, type FlatVariable } from '../context/PanelConfigContext'
import { usePanelStore } from '../store'
import type { EditorDocumentV1 } from '../types/editorDocument'
import type { SavedBlock } from '../types/savedBlock'
import { EMAIL_PRESETS, type EmailPreset } from './presets/emailPresets'

export function EditorLeftPanel({
  work,
  onChange,
  readOnly,
  onInsertVariable,
  savedBlocks,
  onInsertSavedBlock,
  onDeleteSavedBlock,
  onPickPreset,
}: {
  work: EditorDocumentV1
  onChange: (next: EditorDocumentV1) => void
  readOnly: boolean
  onInsertVariable: (
    v: FlatVariable,
    options?: {
      renderAs?: 'text' | 'link' | 'image' | 'table' | 'list'
      listStyle?: 'ordered' | 'unordered'
    },
  ) => void
  savedBlocks: SavedBlock[]
  onInsertSavedBlock: (saved: SavedBlock) => void
  onDeleteSavedBlock: (savedBlockId: string) => void
  onPickPreset: (preset: EmailPreset) => void
}) {
  const { variableSchema } = usePanelConfig()
  const activeTextBlockId = usePanelStore((s) => s.activeTextBlockId)
  const setActiveTextBlockId = usePanelStore((s) => s.setActiveTextBlockId)
  const [tab, setTab] = useState<'variables' | 'templates' | 'saved'>('variables')
  const [savedQuery, setSavedQuery] = useState('')
  const [openVarMenuKey, setOpenVarMenuKey] = useState<string | null>(null)
  const filteredSaved = useMemo(() => {
    const q = savedQuery.trim().toLowerCase()
    if (!q) return savedBlocks
    return savedBlocks.filter((item) =>
      `${item.name} ${(item.tags ?? []).join(' ')}`.toLowerCase().includes(q),
    )
  }, [savedBlocks, savedQuery])

  const ensureActiveTextTarget = () => {
    if (activeTextBlockId) return
    const firstText = work.blocks.find((b) => b.type === 'text')
    if (firstText) setActiveTextBlockId(firstText.id)
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
      <div className="ec-left-nav-head">
        <p className="ec-left-nav-title">Templates Editor</p>
      </div>
      <div data-ec-sidebar-section="" className="ec-sidebar-section ec-sidebar-section--compact">
        <div className="ec-left-tabs" aria-label="Editor insertion options">
          <button
            type="button"
            className="ec-left-tab ec-left-nav-item"
            aria-pressed={tab === 'variables'}
            onClick={() => setTab('variables')}
            title="Variables"
          >
            <Variable size={14} />
            <span>My Templates</span>
          </button>
          <button
            type="button"
            className="ec-left-tab ec-left-nav-item"
            aria-pressed={tab === 'templates'}
            onClick={() => setTab('templates')}
            title="Templates"
          >
            <Mail size={14} />
            <span>Templates</span>
          </button>
          <button
            type="button"
            className="ec-left-tab ec-left-nav-item"
            aria-pressed={tab === 'saved'}
            onClick={() => setTab('saved')}
            title="Saved"
          >
            <FolderSearch size={14} />
            <span>Saved</span>
          </button>
        </div>
        {tab === 'variables' ? (
          <section
            id="ec-left-panel-variables"
            className="ec-left-panel-content"
          >
            <h3 data-ec-h3="">Variables</h3>
            <p className="ec-hint">Insert variable chips in the active text block.</p>
            {variableSchema.length === 0 ? (
              <p className="ec-muted">No variable schema on this panel.</p>
            ) : (
              variableSchema.map((g) => (
                <div key={g.group} className="ec-var-group">
                  <div className="ec-var-group__name">{g.group}</div>
                  {g.variables.map((v) => (
                    <div
                      key={v.key}
                      className="ec-var-pill-wrap"
                    >
                      <button
                        type="button"
                        className="ec-var-pill"
                        onClick={() => {
                          ensureActiveTextTarget()
                          onInsertVariable({
                            key: v.key,
                            label: v.label,
                            type: v.type,
                            group: g.group,
                            color: g.color,
                            sample: v.sample,
                          })
                          setOpenVarMenuKey(null)
                        }}
                      >
                        {v.label}
                      </button>
                      <DropdownMenu.Root
                        open={openVarMenuKey === v.key}
                        onOpenChange={(open) => setOpenVarMenuKey(open ? v.key : null)}
                      >
                        <DropdownMenu.Trigger asChild>
                          <button
                            type="button"
                            className="ec-var-pill-more"
                            aria-label={`Variable options for ${v.label}`}
                          >
                            <MoreVertical size={12} />
                          </button>
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Portal>
                          <DropdownMenu.Content
                            data-ec-menu=""
                            className="ec-var-menu"
                            sideOffset={6}
                            align="end"
                          >
                            <DropdownMenu.Item
                              data-ec-menu-item=""
                              className="ec-var-menu__item"
                              onSelect={() => {
                                ensureActiveTextTarget()
                                onInsertVariable(
                                  {
                                    key: v.key,
                                    label: v.label,
                                    type: v.type,
                                    group: g.group,
                                    color: g.color,
                                    sample: v.sample,
                                  },
                                  { renderAs: 'text' },
                                )
                                setOpenVarMenuKey(null)
                              }}
                            >
                              Text
                            </DropdownMenu.Item>
                            <DropdownMenu.Item
                              data-ec-menu-item=""
                              className="ec-var-menu__item"
                              onSelect={() => {
                                ensureActiveTextTarget()
                                onInsertVariable(
                                  {
                                    key: v.key,
                                    label: v.label,
                                    type: v.type,
                                    group: g.group,
                                    color: g.color,
                                    sample: v.sample,
                                  },
                                  { renderAs: 'link' },
                                )
                                setOpenVarMenuKey(null)
                              }}
                            >
                              Link
                            </DropdownMenu.Item>
                            <DropdownMenu.Item
                              data-ec-menu-item=""
                              className="ec-var-menu__item"
                              onSelect={() => {
                                ensureActiveTextTarget()
                                onInsertVariable(
                                  {
                                    key: v.key,
                                    label: v.label,
                                    type: v.type,
                                    group: g.group,
                                    color: g.color,
                                    sample: v.sample,
                                  },
                                  { renderAs: 'image' },
                                )
                                setOpenVarMenuKey(null)
                              }}
                            >
                              Image
                            </DropdownMenu.Item>
                            <DropdownMenu.Item
                              data-ec-menu-item=""
                              className="ec-var-menu__item"
                              onSelect={() => {
                                ensureActiveTextTarget()
                                onInsertVariable(
                                  {
                                    key: v.key,
                                    label: v.label,
                                    type: v.type,
                                    group: g.group,
                                    color: g.color,
                                    sample: v.sample,
                                  },
                                  { renderAs: 'table' },
                                )
                                setOpenVarMenuKey(null)
                              }}
                            >
                              Table
                            </DropdownMenu.Item>
                            <DropdownMenu.Item
                              data-ec-menu-item=""
                              className="ec-var-menu__item"
                              onSelect={() => {
                                ensureActiveTextTarget()
                                onInsertVariable(
                                  {
                                    key: v.key,
                                    label: v.label,
                                    type: v.type,
                                    group: g.group,
                                    color: g.color,
                                    sample: v.sample,
                                  },
                                  { renderAs: 'list', listStyle: 'unordered' },
                                )
                                setOpenVarMenuKey(null)
                              }}
                            >
                              List (unordered)
                            </DropdownMenu.Item>
                            <DropdownMenu.Item
                              data-ec-menu-item=""
                              className="ec-var-menu__item"
                              onSelect={() => {
                                ensureActiveTextTarget()
                                onInsertVariable(
                                  {
                                    key: v.key,
                                    label: v.label,
                                    type: v.type,
                                    group: g.group,
                                    color: g.color,
                                    sample: v.sample,
                                  },
                                  { renderAs: 'list', listStyle: 'ordered' },
                                )
                                setOpenVarMenuKey(null)
                              }}
                            >
                              List (ordered)
                            </DropdownMenu.Item>
                          </DropdownMenu.Content>
                        </DropdownMenu.Portal>
                      </DropdownMenu.Root>
                    </div>
                  ))}
                </div>
              ))
            )}
          </section>
        ) : null}
        {tab === 'templates' ? (
          <section
            id="ec-left-panel-templates"
            className="ec-left-panel-content"
          >
            <h3 data-ec-h3="">Email templates</h3>
            <p className="ec-hint">
              Pick a starter template to add to the canvas.
            </p>
            <div className="ec-preset-list">
              {EMAIL_PRESETS.map((preset) => {
                const Icon = preset.icon
                return (
                  <button
                    key={preset.id}
                    type="button"
                    className="ec-preset-card"
                    onClick={() => onPickPreset(preset)}
                  >
                    <span className="ec-preset-card__icon" aria-hidden="true">
                      <Icon size={18} />
                    </span>
                    <span className="ec-preset-card__body">
                      <span className="ec-preset-card__title">{preset.name}</span>
                      <span className="ec-preset-card__desc">{preset.description}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          </section>
        ) : null}
        {tab === 'saved' ? (
          <section
            id="ec-left-panel-saved"
            className="ec-left-panel-content"
          >
            <h3 data-ec-h3="">Saved Snippets</h3>
            <label data-ec-field="">
              <span data-ec-label="">Search saved blocks</span>
              <input
                data-ec-input=""
                placeholder="Search saved snippets..."
                value={savedQuery}
                onChange={(e) => setSavedQuery(e.target.value)}
              />
            </label>
            {filteredSaved.length === 0 ? (
              <p className="ec-muted">No saved snippets yet.</p>
            ) : (
              filteredSaved.map((item) => (
                <div key={item.id} className="ec-attachment-row ec-attachment-row--compact">
                  <strong>{item.name}</strong>
                  <div className="ec-rfield-inline ec-saved-actions">
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
          </section>
        ) : null}
      </div>
    </aside>
  )
}
