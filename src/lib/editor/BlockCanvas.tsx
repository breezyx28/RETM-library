import type { Editor } from '@tiptap/react'
import type { EmailBlock, EditorDocumentV1, TiptapDocJson } from '../types/editorDocument'
import { TextBlockEditor } from './blocks/TextBlockEditor'
import { ConditionalBlockView } from './blocks/ConditionalBlockView'
import { LoopBlockView } from './blocks/LoopBlockView'
import { EditorFormatBar } from './EditorFormatBar'

export interface BlockCanvasProps {
  work: EditorDocumentV1
  onChange: (next: EditorDocumentV1) => void
  readOnly: boolean
  onRegisterTextEditor: (id: string, ed: Editor | null) => void
  onSaveReusableBlock?: (block: EmailBlock) => void
  getActiveEditor?: () => Editor | null
}

export function BlockCanvas({
  work,
  onChange,
  readOnly,
  onRegisterTextEditor,
  onSaveReusableBlock,
  getActiveEditor,
}: BlockCanvasProps) {
  const canvasBlocks = work.blocks.filter(
    (block) =>
      block.type !== 'image' &&
      block.type !== 'button' &&
      block.type !== 'divider' &&
      block.type !== 'spacer',
  )

  const setBlocks = (blocks: EmailBlock[]) => onChange({ ...work, version: 1, blocks })

  const updateBlock = (id: string, fn: (b: EmailBlock) => EmailBlock) => {
    setBlocks(work.blocks.map((b) => (b.id === id ? fn(b) : b)))
  }

  const onTextChange = (id: string, doc: TiptapDocJson) => {
    updateBlock(id, (b) => {
      if (b.type !== 'text') return b
      return { ...b, props: { doc } }
    })
  }

  return (
    <div data-ec-canvas-outer="" className="ec-canvas-outer">
      <div className="ec-composer-chrome" data-ec-composer-chrome="">
        <span className="ec-composer-chrome__label">Body</span>
      </div>
      {getActiveEditor ? (
        <EditorFormatBar getActiveEditor={getActiveEditor} readOnly={readOnly} />
      ) : null}
      <div data-ec-canvas-scroller="" className="ec-canvas-scroller ec-composer-body">
        {canvasBlocks.map((block) => (
          <div key={block.id} className="ec-composer-node" data-ec-canvas-node="">
            {block.type === 'text' && (
              <TextBlockEditor
                blockId={block.id}
                doc={block.props.doc}
                isSelected={false}
                onDocChange={(doc) => onTextChange(block.id, doc)}
                onRegister={onRegisterTextEditor}
                readOnly={readOnly}
              />
            )}
            {block.type === 'conditional' && (
              <ConditionalBlockView
                blockId={block.id}
                props={block.props}
                isSelected={false}
              />
            )}
            {block.type === 'loop' && (
              <LoopBlockView
                blockId={block.id}
                props={block.props}
                isSelected={false}
              />
            )}
            {block.type === 'two_column' && (
              <div className="ec-block__logic">
                <div className="ec-block__logic-head">Two Column Layout</div>
                <div className="ec-block__logic-row">
                  {block.props.leftBlocks.length} left / {block.props.rightBlocks.length} right
                </div>
              </div>
            )}
            {block.type === 'three_column' && (
              <div className="ec-block__logic">
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
          </div>
        ))}
      </div>
    </div>
  )
}
