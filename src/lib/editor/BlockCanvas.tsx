import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import type { Editor } from '@tiptap/react'
import type { EmailBlock, EditorDocumentV1, TiptapDocJson } from '../types/editorDocument'
import { SortableBlock } from './SortableBlock'
import { TextBlockEditor } from './blocks/TextBlockEditor'
import { ImageBlockView } from './blocks/ImageBlockView'
import { ButtonBlockView } from './blocks/ButtonBlockView'
import { DividerBlockView } from './blocks/DividerBlockView'
import { SpacerBlockView } from './blocks/SpacerBlockView'
import { ConditionalBlockView } from './blocks/ConditionalBlockView'
import { LoopBlockView } from './blocks/LoopBlockView'
import { usePanelStore } from '../store'

export interface BlockCanvasProps {
  work: EditorDocumentV1
  onChange: (next: EditorDocumentV1) => void
  readOnly: boolean
  onRegisterTextEditor: (id: string, ed: Editor | null) => void
  onSaveReusableBlock?: (block: EmailBlock) => void
}

export function BlockCanvas({
  work,
  onChange,
  readOnly,
  onRegisterTextEditor,
  onSaveReusableBlock,
}: BlockCanvasProps) {
  const selectedId = usePanelStore((s) => s.selectedBlockId)

  const setBlocks = (blocks: EmailBlock[]) => onChange({ ...work, version: 1, blocks })

  const updateBlock = (id: string, fn: (b: EmailBlock) => EmailBlock) => {
    setBlocks(work.blocks.map((b) => (b.id === id ? fn(b) : b)))
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const oldIndex = work.blocks.findIndex((b) => b.id === String(active.id))
    const newIndex = work.blocks.findIndex((b) => b.id === String(over.id))
    if (oldIndex < 0 || newIndex < 0) return
    setBlocks(arrayMove(work.blocks, oldIndex, newIndex))
  }

  const onTextChange = (id: string, doc: TiptapDocJson) => {
    updateBlock(id, (b) => {
      if (b.type !== 'text') return b
      return { ...b, props: { doc } }
    })
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <div data-ec-canvas-outer="" className="ec-canvas-outer">
        <SortableContext
          items={work.blocks.map((b) => b.id)}
          strategy={verticalListSortingStrategy}
        >
          <div data-ec-canvas-scroller="" className="ec-canvas-scroller">
            {work.blocks.map((block) => {
              const isSelected = selectedId === block.id
              return (
                <SortableBlock
                  key={block.id}
                  id={block.id}
                  disabled={readOnly}
                  isSelected={isSelected}
                  dataBlock={block.type}
                >
                  {block.type === 'text' && (
                    <TextBlockEditor
                      blockId={block.id}
                      doc={block.props.doc}
                      isSelected={isSelected}
                      onDocChange={(doc) => onTextChange(block.id, doc)}
                      onRegister={onRegisterTextEditor}
                      readOnly={readOnly}
                    />
                  )}
                  {block.type === 'image' && (
                    <ImageBlockView
                      blockId={block.id}
                      props={block.props}
                      isSelected={isSelected}
                    />
                  )}
                  {block.type === 'button' && (
                    <ButtonBlockView
                      blockId={block.id}
                      props={block.props}
                      isSelected={isSelected}
                    />
                  )}
                  {block.type === 'divider' && (
                    <DividerBlockView
                      blockId={block.id}
                      props={block.props}
                      isSelected={isSelected}
                    />
                  )}
                  {block.type === 'spacer' && (
                    <SpacerBlockView
                      blockId={block.id}
                      props={block.props}
                      isSelected={isSelected}
                    />
                  )}
                  {block.type === 'conditional' && (
                    <ConditionalBlockView
                      blockId={block.id}
                      props={block.props}
                      isSelected={isSelected}
                    />
                  )}
                  {block.type === 'loop' && (
                    <LoopBlockView
                      blockId={block.id}
                      props={block.props}
                      isSelected={isSelected}
                    />
                  )}
                  {block.type === 'two_column' && (
                    <div className="ec-block ec-block__logic">
                      <div className="ec-block__logic-head">Two Column Layout</div>
                      <div className="ec-block__logic-row">
                        {block.props.leftBlocks.length} left / {block.props.rightBlocks.length} right
                      </div>
                    </div>
                  )}
                  {block.type === 'three_column' && (
                    <div className="ec-block ec-block__logic">
                      <div className="ec-block__logic-head">Three Column Layout</div>
                      <div className="ec-block__logic-row">
                        {block.props.leftBlocks.length} / {block.props.centerBlocks.length} / {block.props.rightBlocks.length}
                      </div>
                    </div>
                  )}
                  {onSaveReusableBlock ? (
                    <div className="ec-rfield-inline" style={{ marginTop: 8 }}>
                      <button
                        type="button"
                        data-ec-btn=""
                        data-ec-variant="ghost"
                        disabled={readOnly}
                        onClick={() => onSaveReusableBlock(block)}
                      >
                        Save as reusable
                      </button>
                    </div>
                  ) : null}
                </SortableBlock>
              )
            })}
          </div>
        </SortableContext>
      </div>
    </DndContext>
  )
}
