import { ArrowDown, ArrowUp, FileText, History, Paperclip, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { AttachmentItem, EditorDocumentV1 } from '../types/editorDocument'
import { defaultAttachment, newAttachmentId } from '../types/editorDocument'
import type { TemplateVersion } from '../../types'
import { formatRelative } from '../utils/date'
import { resolveAttachmentFileVisual } from './attachmentFileIcons'

type AttachmentKind = NonNullable<AttachmentItem['kind']>
type AttachmentDisplayType = AttachmentItem['type']

const ATTACHMENT_KIND_OPTIONS: Array<{ value: AttachmentKind; label: string; badge: string }> = [
  { value: 'auto', label: 'Auto', badge: 'AUTO' },
  { value: 'pdf', label: 'PDF', badge: 'PDF' },
  { value: 'spreadsheet', label: 'Spreadsheet', badge: 'XLS' },
  { value: 'csv', label: 'CSV', badge: 'CSV' },
  { value: 'archive', label: 'Archive', badge: 'ZIP' },
  { value: 'image', label: 'Image', badge: 'IMG' },
  { value: 'video', label: 'Video', badge: 'VID' },
  { value: 'link', label: 'Link', badge: 'URL' },
]

const SIZE_ESTIMATE_BY_KIND: Record<AttachmentKind, number> = {
  auto: 1024 * 1024,
  pdf: 2.6 * 1024 * 1024,
  spreadsheet: 1.9 * 1024 * 1024,
  csv: 0.45 * 1024 * 1024,
  archive: 4.2 * 1024 * 1024,
  image: 1.4 * 1024 * 1024,
  video: 14 * 1024 * 1024,
  link: 0,
}

const URL_KIND_HINTS: Array<{ kind: AttachmentKind; ext: string[] }> = [
  { kind: 'pdf', ext: ['pdf'] },
  { kind: 'spreadsheet', ext: ['xls', 'xlsx', 'ods'] },
  { kind: 'csv', ext: ['csv', 'tsv'] },
  { kind: 'archive', ext: ['zip', 'rar', '7z', 'gz', 'tar'] },
  { kind: 'image', ext: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'] },
  { kind: 'video', ext: ['mp4', 'mov', 'avi', 'm4v', 'webm'] },
]

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return ''
  const units = ['B', 'KB', 'MB', 'GB']
  let value = bytes
  let idx = 0
  while (value >= 1024 && idx < units.length - 1) {
    value /= 1024
    idx += 1
  }
  const rounded = idx === 0 ? Math.round(value).toString() : value.toFixed(value >= 10 ? 1 : 2)
  return `${rounded} ${units[idx]}`
}

function kindFromUrl(url: string): AttachmentKind {
  const clean = url.split('?')[0]?.split('#')[0] ?? ''
  const dot = clean.lastIndexOf('.')
  if (dot < 0) return 'link'
  const ext = clean.slice(dot + 1).toLowerCase()
  for (const hint of URL_KIND_HINTS) {
    if (hint.ext.includes(ext)) return hint.kind
  }
  return ext ? 'auto' : 'link'
}

async function detectAttachmentMetadata(url: string): Promise<{ kind: AttachmentKind; size: string }> {
  const kind = kindFromUrl(url)
  try {
    const response = await fetch(url, { method: 'HEAD' })
    const len = response.headers.get('content-length')
    const bytes = len ? Number(len) : Number.NaN
    if (Number.isFinite(bytes) && bytes > 0) {
      return { kind, size: formatBytes(bytes) }
    }
  } catch {
    // Ignore blocked/CORS requests and fallback to deterministic estimate.
  }
  const estimated = SIZE_ESTIMATE_BY_KIND[kind] ?? SIZE_ESTIMATE_BY_KIND.auto
  return { kind, size: formatBytes(estimated) }
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
  onAppendAttachmentToCanvas,
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
  onAppendAttachmentToCanvas?: (attachment: AttachmentItem) => void
  readOnly: boolean
}) {
  const [activeTab, setActiveTab] = useState<'metadata' | 'attachments' | 'history'>(
    'metadata',
  )
  const setAttachments = (attachments: EditorDocumentV1['attachments']) =>
    onChange({ ...work, version: 1, attachments })

  const attachments = work.attachments ?? []
  const [draftAttachment, setDraftAttachment] = useState<AttachmentItem>(() => ({
    ...defaultAttachment(),
    id: newAttachmentId(),
  }))
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

  const attachmentKindLabel = (kind?: AttachmentItem['kind']) =>
    ATTACHMENT_KIND_OPTIONS.find((x) => x.value === (kind ?? 'auto'))?.label ?? 'Auto'

  const handleAddAttachment = async () => {
    const url = draftAttachment.url.trim()
    if (!url) return
    const detected = await detectAttachmentMetadata(url)
    setAttachments([
      ...attachments,
      {
        ...draftAttachment,
        id: newAttachmentId(),
        label: draftAttachment.label.trim() || 'Attachment',
        url,
        kind: detected.kind,
        size: detected.size,
      },
    ])
    setDraftAttachment({ ...defaultAttachment(), id: newAttachmentId() })
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
          <Paperclip size={13} aria-hidden="true" />
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
            placeholder="E.g Greeting Template"
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
            placeholder="E.g Welcome to ACME"
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
            placeholder="E.g Quick update for your account"
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
          <span>HTML title</span>
          <input
            data-ec-input=""
            placeholder="E.g Greeting Template"
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
        <div className="ec-meta-row">
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
              <option value="">E.g EN</option>
              {supportedLanguages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang.toUpperCase()}
                </option>
              ))}
            </select>
          </label>
          <label className="ec-rfield ec-rfield--toggle" data-ec-field="">
            <span>RTL mode</span>
            <button
              type="button"
              data-ec-btn=""
              data-ec-variant={rtl ? 'primary' : 'ghost'}
              disabled={readOnly}
              onClick={() =>
                onMetaChange({
                  name,
                  subject,
                  preheader,
                  fromName,
                  replyTo,
                  htmlTitle,
                  rtl: !rtl,
                  language,
                })
              }
            >
              {rtl ? 'Enabled' : 'Disabled'}
            </button>
          </label>
        </div>
      </div>
      ) : null}

      {activeTab === 'attachments' ? (
        <div
          id="ec-right-panel-attachments"
          data-ec-sidebar-section=""
          className="ec-sidebar-section"
        >
          <h3 data-ec-h3="">Attachments</h3>
          <form
            className="ec-attachment-row ec-attachment-row--new"
            onSubmit={(e) => {
              e.preventDefault()
              void handleAddAttachment()
            }}
          >
            <label data-ec-field="">
              <span>File name</span>
              <input
                data-ec-input=""
                placeholder="design-draft.pdf"
                value={draftAttachment.label}
                disabled={readOnly}
                onChange={(e) =>
                  setDraftAttachment((prev) => ({ ...prev, label: e.target.value }))
                }
              />
            </label>
            <label data-ec-field="">
              <span>File URL</span>
              <input
                data-ec-input=""
                placeholder="https://example.com/file.pdf"
                value={draftAttachment.url}
                disabled={readOnly}
                onChange={(e) =>
                  setDraftAttachment((prev) => ({ ...prev, url: e.target.value }))
                }
                onBlur={() => {
                  const url = draftAttachment.url.trim()
                  if (!url) return
                  void (async () => {
                    const detected = await detectAttachmentMetadata(url)
                    setDraftAttachment((prev) => ({
                      ...prev,
                      kind: detected.kind,
                      size: detected.size,
                    }))
                  })()
                }}
              />
            </label>
            <div className="ec-rfield-inline">
              <label data-ec-field="">
                <span>Type</span>
                <select
                  data-ec-input=""
                  value={draftAttachment.type}
                  disabled={readOnly}
                  onChange={(e) =>
                    setDraftAttachment((prev) => ({
                      ...prev,
                      type: e.target.value as AttachmentDisplayType,
                    }))
                  }
                >
                  <option value="file">file</option>
                  <option value="link">link</option>
                  <option value="button">button</option>
                </select>
              </label>
            </div>
            <div className="ec-rfield-inline">
              <button
                type="submit"
                data-ec-btn=""
                data-ec-variant="primary"
                disabled={readOnly || !draftAttachment.url.trim()}
              >
                <Plus size={14} />
                Add attachment
              </button>
            </div>
          </form>
          {attachments.length === 0 ? (
            <p className="ec-muted">No attachments</p>
          ) : (
            <div className="ec-attachments-scroll">
              {attachments.map((attachment, idx) => (
              <div key={attachment.id} className="ec-attachment-row">
                <div className="ec-attachment-preview" data-ec-kind={attachment.kind ?? 'auto'}>
                  <span className="ec-attachment-preview__badge">
                    <img
                      src={resolveAttachmentFileVisual(attachment.url).iconSrc}
                      alt=""
                      aria-hidden="true"
                    />
                  </span>
                  <div className="ec-attachment-preview__meta">
                    <strong>{attachment.label || 'Attachment'}</strong>
                    <span>
                      {resolveAttachmentFileVisual(attachment.url).extensionLabel || attachmentKindLabel(attachment.kind)}
                      {attachment.size?.trim() ? ` · ${attachment.size.trim()}` : ''}
                    </span>
                  </div>
                </div>
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
                    onBlur={() => {
                      const url = attachment.url.trim()
                      if (!url) return
                      void (async () => {
                        const detected = await detectAttachmentMetadata(url)
                        updateAttachment(attachment.id, {
                          kind: detected.kind,
                          size: detected.size,
                        })
                      })()
                    }}
                  />
                </label>
                <div className="ec-rfield-inline">
                  <label data-ec-field="">
                    <span>Calculated size</span>
                    <input data-ec-input="" value={attachment.size ?? ''} disabled readOnly />
                  </label>
                  <label data-ec-field="">
                    <span>Type</span>
                    <select
                      data-ec-input=""
                      value={attachment.type}
                      disabled={readOnly}
                      onChange={(e) =>
                        updateAttachment(attachment.id, {
                          type: e.target.value as AttachmentDisplayType,
                        })
                      }
                    >
                      <option value="file">file</option>
                      <option value="link">link</option>
                      <option value="button">button</option>
                    </select>
                  </label>
                  <label data-ec-field="">
                    <span>Detected file type</span>
                    <input data-ec-input="" value={attachmentKindLabel(attachment.kind)} disabled readOnly />
                  </label>
                </div>
                <div className="ec-rfield-inline">
                  <button
                    type="button"
                    data-ec-btn=""
                    data-ec-variant="primary"
                    disabled={readOnly || !attachment.url.trim() || !onAppendAttachmentToCanvas}
                    onClick={() => onAppendAttachmentToCanvas?.(attachment)}
                  >
                    <Paperclip size={14} />
                    Append to canvas
                  </button>
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
              ))}
            </div>
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
