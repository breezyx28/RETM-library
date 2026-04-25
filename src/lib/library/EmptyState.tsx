import { Mail, Plus } from 'lucide-react'

interface EmptyStateProps {
  onCreate: () => void
}

export function EmptyState({ onCreate }: EmptyStateProps) {
  return (
    <div data-ec-empty="">
      <div data-ec-empty-icon="" aria-hidden="true">
        <Mail size={28} />
      </div>
      <h3 data-ec-empty-title="">No templates yet</h3>
      <p data-ec-empty-body="">
        Create your first email template to get started. You can design it
        visually and export production-ready HTML.
      </p>
      <button
        type="button"
        data-ec-btn=""
        data-ec-variant="primary"
        onClick={onCreate}
      >
        <Plus size={16} aria-hidden="true" />
        <span>New template</span>
      </button>
    </div>
  )
}
