import { ArrowDown, ArrowUp, FileText, History, Paperclip, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { EditorDocumentV1 } from '../types/editorDocument'
import { defaultAttachment, newAttachmentId } from '../types/editorDocument'
import type { TemplateVersion } from '../../types'
import { formatRelative } from '../utils/date'

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
  const [activeTab, setActiveTab] = useState<'metadata' | 'attachments' | 'history'>(
    'metadata',
  )
  const setAttachments = (attachments: EditorDocumentV1['attachments']) =>
    onChange({ ...work, version: 1, attachments })

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
      <div className="ec-right-tabs" aria-label="Editor properties sections">
        <button
          type="button"
          className="ec-right-tab"
          aria-pressed={activeTab === 'metadata'}
          onClick={() => setActiveTab('metadata')}
        >
          <FileText size={12} aria-hidden="true" />
          Metadata
        </button>
        <button
          type="button"
          className="ec-right-tab"
          aria-pressed={activeTab === 'attachments'}
          onClick={() => setActiveTab('attachments')}
        >
          <Paperclip size={12} aria-hidden="true" />
          Attachments
        </button>
        <button
          type="button"
          className="ec-right-tab"
          aria-pressed={activeTab === 'history'}
          onClick={() => setActiveTab('history')}
        >
          <History size={12} aria-hidden="true" />
          History
        </button>
      </div>
      {activeTab === 'metadata' ? (
        <div
          id="ec-right-panel-metadata"
          data-ec-sidebar-section=""
          className="ec-sidebar-section"
        >
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
      ) : null}

      {activeTab === 'attachments' ? (
        <div
          id="ec-right-panel-attachments"
          data-ec-sidebar-section=""
          className="ec-sidebar-section"
        >
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
      ) : null}

      {activeTab === 'history' ? (
        <div
          id="ec-right-panel-history"
          data-ec-sidebar-section=""
          className="ec-sidebar-section"
        >
          <h3 data-ec-h3="">History</h3>
          <div className="ec-history-scroll">
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
          </div>
          {versions.length > 1 ? (
            <div className="ec-rfield-stack ec-history-compare">
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
      ) : null}

    </aside>
  )
}
