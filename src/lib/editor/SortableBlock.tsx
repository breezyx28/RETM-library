import type { CSSProperties, ReactNode } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { cn } from '../../utils/cn'

export function SortableBlock({
  id,
  disabled,
  isSelected,
  dataBlock,
  children,
  className,
}: {
  id: string
  disabled: boolean
  isSelected: boolean
  dataBlock: string
  className?: string
  children: ReactNode
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled })

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-ec-block=""
      data-ec-block-type={dataBlock}
      data-ec-block-selected={isSelected ? '' : undefined}
      className={cn(
        'ec-block',
        isSelected && 'ec-block--selected',
        isDragging && 'ec-block--dragging',
        className,
      )}
    >
      <button
        type="button"
        className="ec-block__handle"
        data-ec-drag-handle=""
        aria-label="Drag to reorder"
        disabled={disabled}
        {...attributes}
        {...listeners}
      >
        <GripVertical size={16} />
      </button>
      <div className="ec-block__inner">{children}</div>
    </div>
  )
}
