import type { ImageBlockProps } from '../../types/editorDocument'
import { ImageIcon } from 'lucide-react'
import { cn } from '../../../utils/cn'
import { usePanelStore } from '../../store'

export function ImageBlockView({
  blockId,
  props,
  isSelected,
}: {
  blockId: string
  props: ImageBlockProps
  isSelected: boolean
}) {
  const setSelected = usePanelStore((s) => s.setSelectedBlockId)
  return (
    <div
      className={cn('ec-block__image', isSelected && 'ec-block__text--active')}
      data-ec-canvas=""
      onClick={() => {
        setSelected(blockId)
      }}
    >
      {props.url ? (
        <img
          src={props.url}
          alt={props.alt || ' '}
          style={{
            maxWidth: props.width === '100%' ? '100%' : props.width,
            display: 'block',
            margin:
              props.align === 'left'
                ? '0'
                : props.align === 'right'
                  ? '0 0 0 auto'
                  : '0 auto',
          }}
        />
      ) : (
        <div className="ec-block__ph" data-ec-placeholder="">
          <ImageIcon size={22} />
          <span>Image URL in properties</span>
        </div>
      )}
    </div>
  )
}
