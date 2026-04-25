import type { LoopBlockProps } from '../../types/editorDocument'
import { usePanelStore } from '../../store'
import { cn } from '../../../utils/cn'

export function LoopBlockView({
  blockId,
  props,
  isSelected,
}: {
  blockId: string
  props: LoopBlockProps
  isSelected: boolean
}) {
  const setSelected = usePanelStore((s) => s.setSelectedBlockId)
  return (
    <div
      className={cn('ec-block__logic', isSelected && 'ec-block__text--active')}
      data-ec-canvas=""
      onClick={() => setSelected(blockId)}
    >
      <div className="ec-block__logic-head">Loop</div>
      <div className="ec-block__logic-row">
        EACH <code>{props.arrayKey || 'array.key'}</code> AS{' '}
        <code>{props.itemAlias || 'item'}</code>
      </div>
      <div className="ec-block__logic-row">
        Body: {props.bodyBlocks.length} block(s) · Empty: {props.emptyBlocks.length} block(s)
      </div>
    </div>
  )
}
