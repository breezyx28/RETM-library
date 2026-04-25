import type { ConditionalBlockProps } from '../../types/editorDocument'
import { usePanelStore } from '../../store'
import { cn } from '../../../utils/cn'

export function ConditionalBlockView({
  blockId,
  props,
  isSelected,
}: {
  blockId: string
  props: ConditionalBlockProps
  isSelected: boolean
}) {
  const setSelected = usePanelStore((s) => s.setSelectedBlockId)
  return (
    <div
      className={cn('ec-block__logic', isSelected && 'ec-block__text--active')}
      data-ec-canvas=""
      onClick={() => setSelected(blockId)}
    >
      <div className="ec-block__logic-head">Conditional</div>
      <div className="ec-block__logic-row">
        IF <code>{props.variableKey || 'variable.key'}</code> {props.operator}
        {props.operator === 'truthy' || props.operator === 'not_empty'
          ? null
          : ` "${props.compareValue || 'value'}"`}
      </div>
      <div className="ec-block__logic-row">
        Then: {props.thenBlocks.length} block(s) · Else: {props.elseBlocks.length} block(s)
      </div>
    </div>
  )
}
