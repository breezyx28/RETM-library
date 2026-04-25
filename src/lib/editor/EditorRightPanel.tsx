import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { usePanelStore } from '../store'
import type { EmailBlock, EditorDocumentV1 } from '../types/editorDocument'
import { defaultAttachment, newAttachmentId, newBlockId } from '../types/editorDocument'
import type { TemplateVersion } from '../../types'
import { formatRelative } from '../utils/date'

const emptyTiptap = {
  type: 'doc' as const,
  content: [{ type: 'paragraph' as const }],
}

export function EditorRightPanel({
  work,
  onChange,
  name,
  subject,
  preheader,
  fromName,
  replyTo,
  htmlTitle,
  rtl,
  language,
  supportedLanguages,
  onMetaChange,
  versions = [],
  onRestore,
  activeVersionId = null,
  compareLeftId = '',
  compareRightId = '',
  onCompareChange,
  diffLeftHtml = '',
  diffRightHtml = '',
  readOnly,
}: {
  work: EditorDocumentV1
  onChange: (next: EditorDocumentV1) => void
  name: string
  subject: string
  preheader: string
  fromName: string
  replyTo: string
  htmlTitle: string
  rtl: boolean
  language: string
  supportedLanguages: string[]
  onMetaChange: (m: {
    name: string
    subject: string
    preheader: string
    fromName: string
    replyTo: string
    htmlTitle: string
    rtl: boolean
    language: string
  }) => void
  versions?: TemplateVersion[]
  onRestore?: (versionId: string) => void
  activeVersionId?: string | null
  compareLeftId?: string
  compareRightId?: string
  onCompareChange?: (leftVersionId: string, rightVersionId: string) => void
  diffLeftHtml?: string
  diffRightHtml?: string
  readOnly: boolean
}) {
  const selectedId = usePanelStore((s) => s.selectedBlockId)
  const setSelected = usePanelStore((s) => s.setSelectedBlockId)

  const block =
    (selectedId ? work.blocks.find((b) => b.id === selectedId) : null) ??
    work.blocks[0] ??
    null
  const targetId = selectedId ?? work.blocks[0]?.id ?? null

  const setBlocks = (blocks: typeof work.blocks) =>
    onChange({ ...work, version: 1, blocks })
  const setAttachments = (attachments: EditorDocumentV1['attachments']) =>
    onChange({ ...work, version: 1, attachments })

  const updateSelected = (fn: (b: EmailBlock) => EmailBlock) => {
    if (!targetId) return
    setBlocks(
      work.blocks.map((b) => (b.id === targetId ? fn(b) : b)),
    )
  }

  const removeSelected = () => {
    if (!targetId || work.blocks.length <= 1) return
    if (!window.confirm('Remove this block?')) return
    setBlocks(work.blocks.filter((b) => b.id !== targetId))
    setSelected(null)
  }

  const attachments = work.attachments ?? []
  const updateAttachment = (
    id: string,
    patch: Partial<EditorDocumentV1['attachments'][number]>,
  ) => {
    setAttachments(
      attachments.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    )
  }

  const moveAttachment = (id: string, direction: -1 | 1) => {
    const idx = attachments.findIndex((item) => item.id === id)
    if (idx < 0) return
    const nextIdx = idx + direction
    if (nextIdx < 0 || nextIdx >= attachments.length) return
    const next = attachments.slice()
    const [picked] = next.splice(idx, 1)
    if (!picked) return
    next.splice(nextIdx, 0, picked)
    setAttachments(next)
  }

  return (
    <aside
      data-ec-sidebar=""
      data-ec-properties=""
      className="ec-sidebar ec-sidebar--right"
    >
      <div data-ec-sidebar-section="" className="ec-sidebar-section">
        <h3 data-ec-h3="">Metadata</h3>
        <label className="ec-rfield" data-ec-field="">
          <span>Template name</span>
          <input
            data-ec-input=""
            value={name}
            disabled={readOnly}
            onChange={(e) =>
              onMetaChange({
                name: e.target.value,
                subject,
                preheader,
                fromName,
                replyTo,
                htmlTitle,
                rtl,
                language,
              })
            }
          />
        </label>
        <label className="ec-rfield" data-ec-field="">
          <span>Subject</span>
          <input
            data-ec-input=""
            value={subject}
            disabled={readOnly}
            onChange={(e) =>
              onMetaChange({
                name,
                subject: e.target.value,
                preheader,
                fromName,
                replyTo,
                htmlTitle,
                rtl,
                language,
              })
            }
          />
        </label>
        <label className="ec-rfield" data-ec-field="">
          <span>Preheader</span>
          <input
            data-ec-input=""
            value={preheader}
            disabled={readOnly}
            onChange={(e) =>
              onMetaChange({
                name,
                subject,
                preheader: e.target.value,
                fromName,
                replyTo,
                htmlTitle,
                rtl,
                language,
              })
            }
          />
        </label>
        <label className="ec-rfield" data-ec-field="">
          <span>From name</span>
          <input
            data-ec-input=""
            value={fromName}
            disabled={readOnly}
            onChange={(e) =>
              onMetaChange({
                name,
                subject,
                preheader,
                fromName: e.target.value,
                replyTo,
                htmlTitle,
                rtl,
                language,
              })
            }
          />
        </label>
        <label className="ec-rfield" data-ec-field="">
          <span>Reply-To</span>
          <input
            data-ec-input=""
            value={replyTo}
            disabled={readOnly}
            onChange={(e) =>
              onMetaChange({
                name,
                subject,
                preheader,
                fromName,
                replyTo: e.target.value,
                htmlTitle,
                rtl,
                language,
              })
            }
          />
        </label>
        <label className="ec-rfield" data-ec-field="">
          <span>HTML title</span>
          <input
            data-ec-input=""
            value={htmlTitle}
            disabled={readOnly}
            onChange={(e) =>
              onMetaChange({
                name,
                subject,
                preheader,
                fromName,
                replyTo,
                htmlTitle: e.target.value,
                rtl,
                language,
              })
            }
          />
        </label>
        <label className="ec-rfield" data-ec-field="">
          <span>Language</span>
          <select
            data-ec-input=""
            value={language}
            disabled={readOnly}
            onChange={(e) =>
              onMetaChange({
                name,
                subject,
                preheader,
                fromName,
                replyTo,
                htmlTitle,
                rtl,
                language: e.target.value,
              })
            }
          >
            {supportedLanguages.map((lang) => (
              <option key={lang} value={lang}>
                {lang.toUpperCase()}
              </option>
            ))}
          </select>
        </label>
        <label className="ec-rfield" data-ec-field="">
          <span>RTL</span>
          <input
            type="checkbox"
            checked={rtl}
            disabled={readOnly}
            onChange={(e) =>
              onMetaChange({
                name,
                subject,
                preheader,
                fromName,
                replyTo,
                htmlTitle,
                rtl: e.target.checked,
                language,
              })
            }
          />
        </label>
      </div>

      <div data-ec-sidebar-section="" className="ec-sidebar-section">
        <h3 data-ec-h3="">Attachments</h3>
        <div className="ec-rfield-inline">
          <button
            type="button"
            data-ec-btn=""
            data-ec-variant="ghost"
            disabled={readOnly}
            onClick={() =>
              setAttachments([
                ...attachments,
                { ...defaultAttachment(), id: newAttachmentId() },
              ])
            }
          >
            <Plus size={14} />
            Add attachment
          </button>
        </div>
        {attachments.length === 0 ? (
          <p className="ec-muted">No attachments</p>
        ) : (
          attachments.map((attachment, idx) => (
            <div key={attachment.id} className="ec-attachment-row">
              <label data-ec-field="">
                <span>Label</span>
                <input
                  data-ec-input=""
                  value={attachment.label}
                  disabled={readOnly}
                  onChange={(e) =>
                    updateAttachment(attachment.id, { label: e.target.value })
                  }
                />
              </label>
              <label data-ec-field="">
                <span>URL</span>
                <input
                  data-ec-input=""
                  value={attachment.url}
                  disabled={readOnly}
                  onChange={(e) =>
                    updateAttachment(attachment.id, { url: e.target.value })
                  }
                />
              </label>
              <label data-ec-field="">
                <span>Style</span>
                <select
                  data-ec-input=""
                  value={attachment.style}
                  disabled={readOnly}
                  onChange={(e) =>
                    updateAttachment(attachment.id, {
                      style: e.target.value as 'link' | 'button',
                    })
                  }
                >
                  <option value="link">link</option>
                  <option value="button">button</option>
                </select>
              </label>
              <div className="ec-rfield-inline">
                <button
                  type="button"
                  data-ec-btn=""
                  data-ec-variant="ghost"
                  disabled={readOnly || idx === 0}
                  onClick={() => moveAttachment(attachment.id, -1)}
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  type="button"
                  data-ec-btn=""
                  data-ec-variant="ghost"
                  disabled={readOnly || idx === attachments.length - 1}
                  onClick={() => moveAttachment(attachment.id, 1)}
                >
                  <ArrowDown size={14} />
                </button>
                <button
                  type="button"
                  data-ec-btn=""
                  data-ec-variant="ghost"
                  disabled={readOnly}
                  onClick={() =>
                    setAttachments(attachments.filter((x) => x.id !== attachment.id))
                  }
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div data-ec-sidebar-section="" className="ec-sidebar-section">
        <h3 data-ec-h3="">History</h3>
        {versions.length === 0 ? (
          <p className="ec-muted">No versions yet</p>
        ) : (
          <div className="ec-history-list">
            {versions
              .slice()
              .reverse()
              .map((version) => (
                <div
                  key={version.versionId}
                  className="ec-history-item"
                  data-ec-kind={version.type}
                  data-ec-active={
                    activeVersionId === version.versionId ? '' : undefined
                  }
                >
                  <div className="ec-history-item__meta">
                    <strong>{version.type}</strong>
                    <span>{formatRelative(version.savedAt)}</span>
                  </div>
                  <button
                    type="button"
                    data-ec-btn=""
                    data-ec-variant="ghost"
                    disabled={readOnly || !onRestore}
                    onClick={() => onRestore?.(version.versionId)}
                  >
                    Restore
                  </button>
                </div>
              ))}
          </div>
        )}
        {versions.length > 1 ? (
          <div className="ec-rfield-stack">
            <label data-ec-field="">
              <span>Compare left</span>
              <select
                data-ec-input=""
                value={compareLeftId}
                onChange={(e) => onCompareChange?.(e.target.value, compareRightId)}
              >
                <option value="">Select version</option>
                {versions.map((version) => (
                  <option key={`l-${version.versionId}`} value={version.versionId}>
                    {version.type} · {formatRelative(version.savedAt)}
                  </option>
                ))}
              </select>
            </label>
            <label data-ec-field="">
              <span>Compare right</span>
              <select
                data-ec-input=""
                value={compareRightId}
                onChange={(e) => onCompareChange?.(compareLeftId, e.target.value)}
              >
                <option value="">Select version</option>
                {versions.map((version) => (
                  <option key={`r-${version.versionId}`} value={version.versionId}>
                    {version.type} · {formatRelative(version.savedAt)}
                  </option>
                ))}
              </select>
            </label>
            {compareLeftId && compareRightId ? (
              <div className="ec-rfield-inline">
                <pre className="ec-diff-pane">{diffLeftHtml || '<!-- empty -->'}</pre>
                <pre className="ec-diff-pane">{diffRightHtml || '<!-- empty -->'}</pre>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <div data-ec-sidebar-section="" className="ec-sidebar-section">
        <h3 data-ec-h3="">Block</h3>
        {!block ? (
          <p className="ec-muted">No blocks</p>
        ) : (
          <>
            <p className="ec-muted" data-ec-kicker="">
              {block.type} · {block.id.slice(0, 8)}…
            </p>
            {block.type === 'image' && (
              <div className="ec-rfield-stack">
                <label data-ec-field="">
                  <span>Image URL</span>
                  <input
                    data-ec-input=""
                    value={block.props.url}
                    disabled={readOnly}
                    onChange={(e) =>
                      updateSelected((b) =>
                        b.type === 'image'
                          ? {
                              ...b,
                              props: { ...b.props, url: e.target.value },
                            }
                          : b,
                      )
                    }
                  />
                </label>
                <label data-ec-field="">
                  <span>Alt</span>
                  <input
                    data-ec-input=""
                    value={block.props.alt}
                    disabled={readOnly}
                    onChange={(e) =>
                      updateSelected((b) =>
                        b.type === 'image'
                          ? {
                              ...b,
                              props: { ...b.props, alt: e.target.value },
                            }
                          : b,
                      )
                    }
                  />
                </label>
                <label data-ec-field="">
                  <span>Width (e.g. 100% or 400px)</span>
                  <input
                    data-ec-input=""
                    value={block.props.width}
                    disabled={readOnly}
                    onChange={(e) =>
                      updateSelected((b) =>
                        b.type === 'image'
                          ? {
                              ...b,
                              props: { ...b.props, width: e.target.value },
                            }
                          : b,
                      )
                    }
                  />
                </label>
              </div>
            )}
            {block.type === 'button' && (
              <div className="ec-rfield-stack">
                <label data-ec-field="">
                  <span>Label</span>
                  <input
                    data-ec-input=""
                    value={block.props.label}
                    disabled={readOnly}
                    onChange={(e) =>
                      updateSelected((b) =>
                        b.type === 'button'
                          ? {
                              ...b,
                              props: { ...b.props, label: e.target.value },
                            }
                          : b,
                      )
                    }
                  />
                </label>
                <label data-ec-field="">
                  <span>Link (URL or variable in Slice C)</span>
                  <input
                    data-ec-input=""
                    value={block.props.href}
                    disabled={readOnly}
                    onChange={(e) =>
                      updateSelected((b) =>
                        b.type === 'button'
                          ? {
                              ...b,
                              props: { ...b.props, href: e.target.value },
                            }
                          : b,
                      )
                    }
                  />
                </label>
                <label data-ec-field="">
                  <span>Full width</span>
                  <input
                    type="checkbox"
                    checked={block.props.fullWidth}
                    disabled={readOnly}
                    onChange={(e) =>
                      updateSelected((b) =>
                        b.type === 'button'
                          ? {
                              ...b,
                              props: { ...b.props, fullWidth: e.target.checked },
                            }
                          : b,
                      )
                    }
                  />
                </label>
                <label data-ec-field="">
                  <span>Background</span>
                  <input
                    data-ec-input=""
                    type="color"
                    value={block.props.backgroundColor}
                    disabled={readOnly}
                    onChange={(e) =>
                      updateSelected((b) =>
                        b.type === 'button'
                          ? {
                              ...b,
                              props: {
                                ...b.props,
                                backgroundColor: e.target.value,
                              },
                            }
                          : b,
                      )
                    }
                  />
                </label>
              </div>
            )}
            {block.type === 'divider' && (
              <div className="ec-rfield-stack">
                <label data-ec-field="">
                  <span>Thickness (px)</span>
                  <input
                    data-ec-input=""
                    type="number"
                    min={1}
                    max={8}
                    value={block.props.thickness}
                    disabled={readOnly}
                    onChange={(e) =>
                      updateSelected((b) =>
                        b.type === 'divider'
                          ? {
                              ...b,
                              props: {
                                ...b.props,
                                thickness: Number(e.target.value) || 1,
                              },
                            }
                          : b,
                      )
                    }
                  />
                </label>
                <label data-ec-field="">
                  <span>Color</span>
                  <input
                    data-ec-input=""
                    type="color"
                    value={block.props.color}
                    disabled={readOnly}
                    onChange={(e) =>
                      updateSelected((b) =>
                        b.type === 'divider'
                          ? {
                              ...b,
                              props: { ...b.props, color: e.target.value },
                            }
                          : b,
                      )
                    }
                  />
                </label>
              </div>
            )}
            {block.type === 'spacer' && (
              <label data-ec-field="">
                <span>Height (px)</span>
                <input
                  data-ec-input=""
                  type="number"
                  min={4}
                  max={400}
                  value={block.props.height}
                  disabled={readOnly}
                  onChange={(e) =>
                    updateSelected((b) =>
                      b.type === 'spacer'
                        ? {
                            ...b,
                            props: {
                              ...b.props,
                              height: Number(e.target.value) || 8,
                            },
                          }
                        : b,
                    )
                  }
                />
              </label>
            )}
            {block.type === 'text' && (
              <p className="ec-muted">Tip: use @ in text for variables</p>
            )}
            {block.type === 'conditional' && (
              <div className="ec-rfield-stack">
                <label data-ec-field="">
                  <span>Variable key</span>
                  <input
                    data-ec-input=""
                    value={block.props.variableKey}
                    disabled={readOnly}
                    onChange={(e) =>
                      updateSelected((b) =>
                        b.type === 'conditional'
                          ? {
                              ...b,
                              props: { ...b.props, variableKey: e.target.value },
                            }
                          : b,
                      )
                    }
                  />
                </label>
                <label data-ec-field="">
                  <span>Operator</span>
                  <select
                    data-ec-input=""
                    value={block.props.operator}
                    disabled={readOnly}
                    onChange={(e) =>
                      updateSelected((b) =>
                        b.type === 'conditional'
                          ? {
                              ...b,
                              props: {
                                ...b.props,
                                operator: e.target.value as typeof b.props.operator,
                              },
                            }
                          : b,
                      )
                    }
                  >
                    <option value="truthy">truthy</option>
                    <option value="equals">equals</option>
                    <option value="not_equals">not_equals</option>
                    <option value="contains">contains</option>
                    <option value="not_empty">not_empty</option>
                  </select>
                </label>
                <label data-ec-field="">
                  <span>Compare value</span>
                  <input
                    data-ec-input=""
                    value={block.props.compareValue}
                    disabled={readOnly}
                    onChange={(e) =>
                      updateSelected((b) =>
                        b.type === 'conditional'
                          ? {
                              ...b,
                              props: { ...b.props, compareValue: e.target.value },
                            }
                          : b,
                      )
                    }
                  />
                </label>
                <div className="ec-rfield-inline">
                  <button
                    type="button"
                    data-ec-btn=""
                    data-ec-variant="ghost"
                    disabled={readOnly}
                    onClick={() =>
                      updateSelected((b) =>
                        b.type === 'conditional'
                          ? {
                              ...b,
                              props: {
                                ...b.props,
                                thenBlocks: [
                                  ...b.props.thenBlocks,
                                  { id: newBlockId(), type: 'text', props: { doc: emptyTiptap } },
                                ],
                              },
                            }
                          : b,
                      )
                    }
                  >
                    Add Then block
                  </button>
                  <button
                    type="button"
                    data-ec-btn=""
                    data-ec-variant="ghost"
                    disabled={readOnly}
                    onClick={() =>
                      updateSelected((b) =>
                        b.type === 'conditional'
                          ? {
                              ...b,
                              props: {
                                ...b.props,
                                elseBlocks: [
                                  ...b.props.elseBlocks,
                                  { id: newBlockId(), type: 'text', props: { doc: emptyTiptap } },
                                ],
                              },
                            }
                          : b,
                      )
                    }
                  >
                    Add Else block
                  </button>
                </div>
              </div>
            )}
            {block.type === 'loop' && (
              <div className="ec-rfield-stack">
                <label data-ec-field="">
                  <span>Array key</span>
                  <input
                    data-ec-input=""
                    value={block.props.arrayKey}
                    disabled={readOnly}
                    onChange={(e) =>
                      updateSelected((b) =>
                        b.type === 'loop'
                          ? {
                              ...b,
                              props: { ...b.props, arrayKey: e.target.value },
                            }
                          : b,
                      )
                    }
                  />
                </label>
                <label data-ec-field="">
                  <span>Item alias</span>
                  <input
                    data-ec-input=""
                    value={block.props.itemAlias}
                    disabled={readOnly}
                    onChange={(e) =>
                      updateSelected((b) =>
                        b.type === 'loop'
                          ? {
                              ...b,
                              props: { ...b.props, itemAlias: e.target.value || 'item' },
                            }
                          : b,
                      )
                    }
                  />
                </label>
                <div className="ec-rfield-inline">
                  <button
                    type="button"
                    data-ec-btn=""
                    data-ec-variant="ghost"
                    disabled={readOnly}
                    onClick={() =>
                      updateSelected((b) =>
                        b.type === 'loop'
                          ? {
                              ...b,
                              props: {
                                ...b.props,
                                bodyBlocks: [
                                  ...b.props.bodyBlocks,
                                  { id: newBlockId(), type: 'text', props: { doc: emptyTiptap } },
                                ],
                              },
                            }
                          : b,
                      )
                    }
                  >
                    Add Body block
                  </button>
                  <button
                    type="button"
                    data-ec-btn=""
                    data-ec-variant="ghost"
                    disabled={readOnly}
                    onClick={() =>
                      updateSelected((b) =>
                        b.type === 'loop'
                          ? {
                              ...b,
                              props: {
                                ...b.props,
                                emptyBlocks: [
                                  ...b.props.emptyBlocks,
                                  { id: newBlockId(), type: 'text', props: { doc: emptyTiptap } },
                                ],
                              },
                            }
                          : b,
                      )
                    }
                  >
                    Add Empty block
                  </button>
                </div>
              </div>
            )}

            {work.blocks.length > 1 && (
              <button
                type="button"
                data-ec-btn=""
                data-ec-variant="ghost"
                onClick={removeSelected}
                disabled={readOnly}
              >
                <Trash2 size={14} />
                Remove block
              </button>
            )}
          </>
        )}
      </div>
    </aside>
  )
}
