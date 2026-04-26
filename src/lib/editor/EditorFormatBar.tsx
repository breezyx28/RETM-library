import { useEffect, useReducer, useRef, useState } from 'react'
import * as AlertDialog from '@radix-ui/react-alert-dialog'
import type { Editor } from '@tiptap/react'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Link2,
  Image as ImageIcon,
} from 'lucide-react'
import { cn } from '../../utils/cn'

interface EditorFormatBarProps {
  getActiveEditor: () => Editor | null
  readOnly?: boolean
}

const FONT_FAMILIES: Array<{ label: string; value: string }> = [
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Times New Roman', value: '"Times New Roman", serif' },
  { label: 'Courier New', value: '"Courier New", monospace' },
  { label: 'Verdana', value: 'Verdana, sans-serif' },
]

const FONT_SIZES: Array<{ label: string; value: string }> = [
  { label: 'Small', value: '12px' },
  { label: 'Normal', value: '14px' },
  { label: 'Large', value: '18px' },
  { label: 'Huge', value: '24px' },
]

const HEADINGS = [
  { label: 'Paragraph', value: 'p' },
  { label: 'Heading 1', value: 'h1' },
  { label: 'Heading 2', value: 'h2' },
  { label: 'Heading 3', value: 'h3' },
] as const

type UrlModalState = { kind: 'link' | 'image'; value: string } | null

export function EditorFormatBar({ getActiveEditor, readOnly = false }: EditorFormatBarProps) {
  const [, force] = useReducer((x: number) => x + 1, 0)
  const editor = getActiveEditor()
  const lastEditorRef = useRef<Editor | null>(null)
  const [urlModal, setUrlModal] = useState<UrlModalState>(null)

  useEffect(() => {
    if (lastEditorRef.current === editor) return
    const prev = lastEditorRef.current
    if (prev) {
      prev.off('selectionUpdate', force)
      prev.off('transaction', force)
      prev.off('focus', force)
      prev.off('blur', force)
    }
    if (editor) {
      editor.on('selectionUpdate', force)
      editor.on('transaction', force)
      editor.on('focus', force)
      editor.on('blur', force)
    }
    lastEditorRef.current = editor
    return () => {
      if (editor) {
        editor.off('selectionUpdate', force)
        editor.off('transaction', force)
        editor.off('focus', force)
        editor.off('blur', force)
      }
    }
  }, [editor])

  const disabled = readOnly || !editor

  const isActive = (name: string, attrs?: Record<string, unknown>) =>
    !!editor?.isActive(name, attrs)
  const isAlign = (dir: 'left' | 'center' | 'right') =>
    !!editor?.isActive({ textAlign: dir })

  const run = (fn: (chain: ReturnType<Editor['chain']>) => ReturnType<Editor['chain']>) => {
    if (!editor) return
    fn(editor.chain().focus()).run()
  }

  const currentHeading = (() => {
    if (!editor) return 'p'
    if (editor.isActive('heading', { level: 1 })) return 'h1'
    if (editor.isActive('heading', { level: 2 })) return 'h2'
    if (editor.isActive('heading', { level: 3 })) return 'h3'
    return 'p'
  })()

  const currentFontFamily =
    (editor?.getAttributes('textStyle') as { fontFamily?: string } | undefined)?.fontFamily ?? ''
  const currentFontSize =
    (editor?.getAttributes('textStyle') as { fontSize?: string } | undefined)?.fontSize ?? ''
  const currentColor =
    (editor?.getAttributes('textStyle') as { color?: string } | undefined)?.color ?? '#202124'

  const align = (dir: 'left' | 'center' | 'right') => run((c) => c.setTextAlign(dir))
  const setHeading = (val: string) => {
    if (val === 'p') {
      run((c) => c.setParagraph())
      return
    }
    const level = Number(val.replace('h', '')) as 1 | 2 | 3
    run((c) => c.toggleHeading({ level }))
  }
  const setFamily = (val: string) => {
    if (!val) {
      run((c) => c.unsetFontFamily())
      return
    }
    run((c) => c.setFontFamily(val))
  }
  const setSize = (val: string) => {
    if (!val) {
      run((c) => c.unsetFontSize())
      return
    }
    run((c) => c.setFontSize(val))
  }
  const setColor = (val: string) => run((c) => c.setColor(val))
  const openLinkDialog = () => {
    if (!editor) return
    const previous =
      (editor.getAttributes('link') as { href?: string } | undefined)?.href ?? ''
    setUrlModal({ kind: 'link', value: previous })
  }
  const openImageDialog = () => {
    if (!editor) return
    setUrlModal({ kind: 'image', value: '' })
  }

  const applyUrlModal = () => {
    const ed = getActiveEditor()
    if (!ed || !urlModal) return
    if (urlModal.kind === 'link') {
      const trimmed = urlModal.value.trim()
      if (trimmed === '') {
        ed.chain().focus().extendMarkRange('link').unsetLink().run()
      } else {
        ed.chain().focus().extendMarkRange('link').setLink({ href: trimmed }).run()
      }
    } else {
      const trimmed = urlModal.value.trim()
      if (!trimmed) return
      ed
        .chain()
        .focus()
        .setImage({ src: trimmed })
        .createParagraphNear()
        .focus()
        .run()
    }
    setUrlModal(null)
  }

  return (
    <div
      className="ec-fmtbar"
      data-ec-fmtbar=""
      role="toolbar"
      aria-label="Text formatting"
      aria-disabled={disabled}
    >
      <div className="ec-fmtbar__group">
        <ToolbarButton
          label="Bold"
          shortcut="Ctrl+B"
          active={isActive('bold')}
          disabled={disabled}
          onClick={() => run((c) => c.toggleBold())}
        >
          <Bold size={14} aria-hidden="true" />
        </ToolbarButton>
        <ToolbarButton
          label="Italic"
          shortcut="Ctrl+I"
          active={isActive('italic')}
          disabled={disabled}
          onClick={() => run((c) => c.toggleItalic())}
        >
          <Italic size={14} aria-hidden="true" />
        </ToolbarButton>
        <ToolbarButton
          label="Underline"
          shortcut="Ctrl+U"
          active={isActive('underline')}
          disabled={disabled}
          onClick={() => run((c) => c.toggleUnderline())}
        >
          <UnderlineIcon size={14} aria-hidden="true" />
        </ToolbarButton>
      </div>

      <span className="ec-fmtbar__sep" aria-hidden="true" />

      <div className="ec-fmtbar__group">
        <select
          className="ec-fmtbar__select"
          aria-label="Font family"
          value={currentFontFamily}
          disabled={disabled}
          onChange={(e) => setFamily(e.target.value)}
        >
          <option value="">Font</option>
          {FONT_FAMILIES.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
        <select
          className="ec-fmtbar__select"
          aria-label="Font size"
          value={currentFontSize}
          disabled={disabled}
          onChange={(e) => setSize(e.target.value)}
        >
          <option value="">Size</option>
          {FONT_SIZES.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
        <label className="ec-fmtbar__color" aria-label="Text color">
          <input
            type="color"
            value={currentColor}
            disabled={disabled}
            onChange={(e) => setColor(e.target.value)}
          />
          <span className="ec-fmtbar__color-swatch" style={{ background: currentColor }} aria-hidden="true" />
        </label>
        <select
          className="ec-fmtbar__select"
          aria-label="Heading"
          value={currentHeading}
          disabled={disabled}
          onChange={(e) => setHeading(e.target.value)}
        >
          {HEADINGS.map((h) => (
            <option key={h.value} value={h.value}>
              {h.label}
            </option>
          ))}
        </select>
      </div>

      <span className="ec-fmtbar__sep" aria-hidden="true" />

      <div className="ec-fmtbar__group">
        <ToolbarButton
          label="Align left"
          active={isAlign('left') || (!isAlign('center') && !isAlign('right'))}
          disabled={disabled}
          onClick={() => align('left')}
        >
          <AlignLeft size={14} aria-hidden="true" />
        </ToolbarButton>
        <ToolbarButton
          label="Align center"
          active={isAlign('center')}
          disabled={disabled}
          onClick={() => align('center')}
        >
          <AlignCenter size={14} aria-hidden="true" />
        </ToolbarButton>
        <ToolbarButton
          label="Align right"
          active={isAlign('right')}
          disabled={disabled}
          onClick={() => align('right')}
        >
          <AlignRight size={14} aria-hidden="true" />
        </ToolbarButton>
      </div>

      <span className="ec-fmtbar__sep" aria-hidden="true" />

      <div className="ec-fmtbar__group">
        <ToolbarButton
          label="Bullet list"
          active={isActive('bulletList')}
          disabled={disabled}
          onClick={() => run((c) => c.toggleBulletList())}
        >
          <List size={14} aria-hidden="true" />
        </ToolbarButton>
        <ToolbarButton
          label="Numbered list"
          active={isActive('orderedList')}
          disabled={disabled}
          onClick={() => run((c) => c.toggleOrderedList())}
        >
          <ListOrdered size={14} aria-hidden="true" />
        </ToolbarButton>
      </div>

      <span className="ec-fmtbar__sep" aria-hidden="true" />

      <div className="ec-fmtbar__group">
        <ToolbarButton
          label="Insert link"
          active={isActive('link')}
          disabled={disabled}
          onClick={openLinkDialog}
        >
          <Link2 size={14} aria-hidden="true" />
        </ToolbarButton>
        <ToolbarButton label="Insert image" disabled={disabled} onClick={openImageDialog}>
          <ImageIcon size={14} aria-hidden="true" />
        </ToolbarButton>
      </div>
      <AlertDialog.Root
        open={urlModal !== null}
        onOpenChange={(open) => {
          if (!open) setUrlModal(null)
        }}
      >
        <AlertDialog.Portal>
          <AlertDialog.Overlay data-ec-overlay="" />
          <AlertDialog.Content data-ec-alertdialog="">
            <AlertDialog.Title data-ec-alertdialog-title="">
              {urlModal?.kind === 'image' ? 'Image URL' : 'Link URL'}
            </AlertDialog.Title>
            <AlertDialog.Description data-ec-alertdialog-body="">
              {urlModal?.kind === 'image'
                ? 'Paste the image address. It must be a non-empty URL.'
                : 'Paste a web address, or clear the field to remove the link from the selection.'}
            </AlertDialog.Description>
            <label data-ec-field="" style={{ display: 'block', marginTop: 8 }}>
              <span data-ec-label="">URL</span>
              <input
                data-ec-input=""
                type="url"
                autoFocus
                value={urlModal?.value ?? ''}
                onChange={(e) =>
                  setUrlModal((prev) => (prev ? { ...prev, value: e.target.value } : prev))
                }
                onKeyDown={(e) => {
                  if (e.key !== 'Enter') return
                  if (urlModal?.kind === 'image' && !urlModal.value.trim()) return
                  e.preventDefault()
                  applyUrlModal()
                }}
              />
            </label>
            <div data-ec-actions="">
              <AlertDialog.Cancel asChild>
                <button type="button" data-ec-btn="" data-ec-variant="ghost">
                  Cancel
                </button>
              </AlertDialog.Cancel>
              <button
                type="button"
                data-ec-btn=""
                data-ec-variant="primary"
                disabled={
                  urlModal?.kind === 'image' ? !urlModal.value.trim() : false
                }
                onClick={applyUrlModal}
              >
                {urlModal?.kind === 'image' ? 'Insert image' : 'Apply'}
              </button>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  )
}

interface ToolbarButtonProps {
  label: string
  shortcut?: string
  active?: boolean
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}

function ToolbarButton({ label, shortcut, active, disabled, onClick, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      className={cn('ec-fmtbar__btn', active && 'ec-fmtbar__btn--active')}
      aria-label={shortcut ? `${label} (${shortcut})` : label}
      aria-pressed={active ? true : undefined}
      title={shortcut ? `${label} (${shortcut})` : label}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
