import { useEffect, useMemo, useRef } from 'react'
import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import TextStyle from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import FontFamily from '@tiptap/extension-font-family'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import type { TiptapDocJson } from '../../types/editorDocument'
import { variableNode } from '../tiptap/variableNode'
import { createVariableAtExtension } from '../tiptap/variableAtExtension'
import { FontSize } from '../tiptap/fontSizeMark'
import { ecPluginNode } from '../tiptap/ecPluginNode'
import { usePanelConfig } from '../../context/PanelConfigContext'
import { usePanelStore } from '../../store'
import { cn } from '../../../utils/cn'

function sanitizePastedHtml(html: string): string {
  return html
    .replace(/\s(style|class)="[^"]*"/gi, '')
    .replace(/<(\w+)[^>]*\sxmlns[^>]*>/gi, '<$1>')
}

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
  const setSelectedInlinePlugin = usePanelStore((s) => s.setSelectedInlinePlugin)

  const onDocChangeRef = useRef(onDocChange)
  onDocChangeRef.current = onDocChange

  const extensions = useMemo(
    () => [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
        dropcursor: { color: 'var(--ec-primary, #2563eb)', width: 2 },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      Color,
      FontFamily,
      FontSize,
      Image.configure({ inline: false, allowBase64: false }),
      Placeholder.configure({
        placeholder: 'Write your email here...',
        emptyEditorClass: 'is-editor-empty',
      }),
      ecPluginNode,
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
      editorProps: {
        transformPastedHTML: (html) => sanitizePastedHtml(html),
      },
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
      data-ec-text-id={blockId}
      onPointerDownCapture={() => {
        setActiveTextBlockId(blockId)
        setSelectedInlinePlugin(null)
      }}
    >
      {editor && <EditorContent editor={editor} data-ec-canvas-inner="" />}
    </div>
  )
}
