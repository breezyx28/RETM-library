import type { TemplateStatus } from '../../types'

const LABEL: Record<TemplateStatus, string> = {
  draft: 'Draft',
  pending_review: 'Pending review',
  published: 'Published',
  archived: 'Archived',
}

export function StatusBadge({ status }: { status: TemplateStatus }) {
  return (
    <span data-ec-badge="" data-ec-status={status}>
      {LABEL[status]}
    </span>
  )
}
