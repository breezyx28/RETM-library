import type { DividerBlockProps } from '../../types/editorDocument'
import { usePanelStore } from '../../store'
import { cn } from '../../../utils/cn'

export function DividerBlockView({
  blockId,
  props,
  isSelected,
}: {
  blockId: string
  props: DividerBlockProps
  isSelected: boolean
}) {
  const setSelected = usePanelStore((s) => s.setSelectedBlockId)
  return (
    <div
      className={cn('ec-block__div', isSelected && 'ec-block__text--active')}
      data-ec-canvas=""
      tabIndex={0}
      aria-pressed={isSelected}
      onClick={() => setSelected(blockId)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          setSelected(blockId)
        }
      }}
      role="button"
    >
      <hr
        style={{
          border: 'none',
          borderTop: `${props.thickness}px ${props.lineStyle} ${props.color}`,
          margin: 0,
        }}
      />
    </div>
  )
}
