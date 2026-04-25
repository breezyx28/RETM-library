import { Plus } from 'lucide-react'

interface NewTemplateButtonProps {
  onCreate: () => void
  disabled?: boolean
}

export function NewTemplateButton({
  onCreate,
  disabled,
}: NewTemplateButtonProps) {
  return (
    <button
      type="button"
      data-ec-btn=""
      data-ec-variant="primary"
      onClick={onCreate}
      disabled={disabled}
    >
      <Plus size={16} aria-hidden="true" />
      <span>New template</span>
    </button>
  )
}
