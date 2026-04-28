import { Download, File, Paperclip } from 'lucide-react'
import type { Template } from '../../types'
import { formatRelative } from '../utils/date'
import { migrateEditorJson } from '../types/editorDocument'
import { StatusBadge } from './StatusBadge'
import { TemplateCardMenu } from './TemplateCardMenu'

interface TemplateCardProps {
  template: Template
  onEdit: () => void
  onPreview: () => void
  onPreviewHtml: () => void
  onExportHtml: () => void
  onDuplicate: () => void
  onRename: () => void
  onDelete: () => void
  thumbnailHtml?: string
  canEdit?: boolean
  canDelete?: boolean
  canMoveFolder?: boolean
}

export function TemplateCard({
  template,
  onEdit,
  onPreview,
  onPreviewHtml,
  onExportHtml,
  onDuplicate,
  onRename,
  onDelete,
  thumbnailHtml,
  canEdit = true,
  canDelete = true,
  canMoveFolder = false,
}: TemplateCardProps) {
  const languages = Object.keys(template.languages)
  const hasAttachments = Object.values(template.languages).some((variant) => {
    try {
      return migrateEditorJson(variant.editorJson).attachments.length > 0
    } catch {
      return false
    }
  })

  return (
    <article data-ec-card="" data-ec-card-status={template.status}>
      <div
        data-ec-card-thumb=""
        role="button"
        tabIndex={0}
        onClick={canEdit ? onEdit : onPreview}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            if (canEdit) onEdit()
            else onPreview()
          }
        }}
        aria-label={`${canEdit ? 'Edit' : 'Preview'} ${template.name}`}
      >
        <File size={34} aria-hidden="true" />
      </div>

      <div data-ec-card-body="">
        <div data-ec-card-head="">
          <h3 data-ec-card-title="" title={template.name}>
            {template.name}
          </h3>
          <TemplateCardMenu
            onEdit={onEdit}
            onPreview={onPreview}
            onPreviewHtml={onPreviewHtml}
            onExportHtml={onExportHtml}
            onDuplicate={onDuplicate}
            onRename={onRename}
            onDelete={onDelete}
            canEdit={canEdit}
            canDelete={canDelete}
            canMoveFolder={canMoveFolder}
          />
        </div>
        <div data-ec-card-meta="">
          <StatusBadge status={template.status} />
          {hasAttachments ? (
            <span data-ec-card-attachment="" title="Has attachments" aria-label="Has attachments">
              <Paperclip size={14} aria-hidden="true" />
            </span>
          ) : null}
          <span data-ec-card-dot="" aria-hidden="true">
            ·
          </span>
          <span data-ec-card-time="">
            Updated {formatRelative(template.updatedAt)}
          </span>
        </div>
        {template.rejectionNote ? (
          <p className="ec-muted" data-ec-rejection-note="">
            Rejection note: {template.rejectionNote}
          </p>
        ) : null}
        <div data-ec-card-langs="" aria-label="Languages">
          {languages.map((code) => (
            <span key={code} data-ec-lang-pill="">
              {code.toUpperCase()}
            </span>
          ))}
        </div>
        <div data-ec-card-actions="">
          <button
            type="button"
            data-ec-btn=""
            data-ec-variant="ghost"
            onClick={onExportHtml}
            aria-label={`Download ${template.name} as HTML`}
            title="Download HTML"
          >
            <Download size={14} aria-hidden="true" />
            Download HTML
          </button>
        </div>
      </div>
    </article>
  )
}
