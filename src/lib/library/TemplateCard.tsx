import { Mail } from 'lucide-react'
import type { Template } from '../../types'
import { formatRelative } from '../utils/date'
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

  return (
    <article data-ec-card="" data-ec-card-status={template.status}>
      <button
        type="button"
        data-ec-card-thumb=""
        onClick={canEdit ? onEdit : onPreview}
        aria-label={`Edit ${template.name}`}
      >
        {thumbnailHtml ? (
          <iframe
            title={`${template.name} thumbnail`}
            srcDoc={thumbnailHtml}
            style={{ width: '100%', height: '100%', border: 0, pointerEvents: 'none' }}
            sandbox="allow-same-origin"
          />
        ) : (
          <Mail size={28} aria-hidden="true" />
        )}
      </button>

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
      </div>
    </article>
  )
}
