import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import type { TiptapDocJson } from '../../types/editorDocument'
import { variableNode } from '../tiptap/variableNode'
import { createVariableAtExtension } from '../tiptap/variableAtExtension'
import { usePanelConfig } from '../../context/PanelConfigContext'
import { usePanelStore } from '../../store'
import { cn } from '../../../utils/cn'

export interface TextBlockEditorProps {
  blockId: string
  doc: TiptapDocJson
  isSelected: boolean
  onDocChange: (json: TiptapDocJson) => void
  onRegister: (id: string, editor: Editor | null) => void
  readOnly: boolean
}

export function TextBlockEditor({
  blockId,
  doc,
  isSelected,
  onDocChange,
  onRegister,
  readOnly,
}: TextBlockEditorProps) {
  const { flatVariables } = usePanelConfig()
  const getItemsRef = useRef(() => flatVariables)
  getItemsRef.current = () => flatVariables
  const setActiveTextBlockId = usePanelStore((s) => s.setActiveTextBlockId)
  const setSelected = usePanelStore((s) => s.setSelectedBlockId)

  const onDocChangeRef = useRef(onDocChange)
  onDocChangeRef.current = onDocChange

  const extensions = useMemo(
    () => [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
        dropcursor: { color: 'var(--ec-primary, #2563eb)', width: 2 },
      }),
      variableNode,
      createVariableAtExtension(() => getItemsRef.current()),
    ],
    [],
  )

  const editor = useEditor(
    {
      extensions,
      content: doc,
      editable: !readOnly,
      onUpdate: ({ editor: ed }) => {
        onDocChangeRef.current(ed.getJSON() as TiptapDocJson)
      },
    },
    [extensions, blockId],
  )

  useEffect(() => {
    onRegister(blockId, editor)
    return () => onRegister(blockId, null)
  }, [blockId, editor, onRegister])

  useEffect(() => {
    if (!editor) return
    const cur = JSON.stringify(editor.getJSON())
    const next = JSON.stringify(doc)
    if (cur !== next) {
      editor.commands.setContent(doc, false)
    }
  }, [doc, editor])

  return (
    <div
      className={cn(
        'ec-block__text',
        isSelected ? 'ec-block__text--active' : false,
      )}
      data-ec-canvas=""
      onPointerDownCapture={() => {
        setActiveTextBlockId(blockId)
        setSelected(blockId)
      }}
    >
      {editor && <EditorContent editor={editor} data-ec-canvas-inner="" />}
    </div>
  )
}
