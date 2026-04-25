import type { ButtonBlockProps } from '../../types/editorDocument'
import { usePanelStore } from '../../store'
import { cn } from '../../../utils/cn'

export function ButtonBlockView({
  blockId,
  props,
  isSelected,
}: {
  blockId: string
  props: ButtonBlockProps
  isSelected: boolean
}) {
  const setSelected = usePanelStore((s) => s.setSelectedBlockId)
  return (
    <div
      className={cn('ec-block__btnwrap', isSelected && 'ec-block__text--active')}
      data-ec-canvas=""
      onClick={() => setSelected(blockId)}
    >
      <a
        href={props.href || '#'}
        data-ec-canvas-btn=""
        style={{
          display: props.fullWidth ? 'block' : 'inline-block',
          textAlign: 'center',
          padding: '12px 20px',
          background: props.backgroundColor,
          color: props.textColor,
          borderRadius: props.borderRadius,
          textDecoration: 'none',
          width: props.fullWidth ? '100%' : 'auto',
        }}
        onClick={(e) => e.preventDefault()}
      >
        {props.label}
      </a>
    </div>
  )
}
