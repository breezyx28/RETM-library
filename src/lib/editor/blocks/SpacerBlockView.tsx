import type { SpacerBlockProps } from '../../types/editorDocument'
import { usePanelStore } from '../../store'
import { cn } from '../../../utils/cn'

export function SpacerBlockView({
  blockId,
  props,
  isSelected,
}: {
  blockId: string
  props: SpacerBlockProps
  isSelected: boolean
}) {
  const setSelected = usePanelStore((s) => s.setSelectedBlockId)
  return (
    <div
      className={cn('ec-block__spacer', isSelected && 'ec-block__text--active')}
      data-ec-canvas=""
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      onClick={() => setSelected(blockId)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          setSelected(blockId)
        }
      }}
    >
      <div style={{ height: props.height, minHeight: 8 }} className="ec-block__spacer-bar" />
    </div>
  )
}
