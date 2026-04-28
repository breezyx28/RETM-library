import { createId } from '../utils/id'
import type { JSONContent } from '@tiptap/core'

export const EDITOR_DOC_VERSION = 1 as const

/**
 * ProseMirror / TipTap JSON for a text block (includes variable chip nodes).
 */
export type TiptapDocJson = JSONContent

export type AttachmentType = 'file' | 'link' | 'button'

export interface AttachmentItem {
  id: string
  label: string
  url: string
  type: AttachmentType
  kind?: 'auto' | 'pdf' | 'image' | 'video' | 'archive' | 'spreadsheet' | 'csv' | 'link'
  size?: string
}

export interface TextBlockProps {
  /** TipTap document JSON. */
  doc: TiptapDocJson
}

export interface ImageBlockProps {
  url: string
  alt: string
  width: string
  align: 'left' | 'center' | 'right'
  linkUrl?: string
}

export interface ButtonBlockProps {
  label: string
  href: string
  fullWidth: boolean
  backgroundColor: string
  textColor: string
  borderRadius: number
}

export type DividerLineStyle = 'solid' | 'dashed' | 'dotted'

export interface DividerBlockProps {
  lineStyle: DividerLineStyle
  thickness: number
  color: string
}

export interface SpacerBlockProps {
  height: number
}

export type ConditionalOperator =
  | 'truthy'
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_empty'

export interface ConditionalBlockProps {
  variableKey: string
  operator: ConditionalOperator
  compareValue: string
  thenBlocks: EmailBlock[]
  elseBlocks: EmailBlock[]
}

export interface LoopBlockProps {
  arrayKey: string
  itemAlias: string
  bodyBlocks: EmailBlock[]
  emptyBlocks: EmailBlock[]
}

export interface TwoColumnBlockProps {
  leftBlocks: EmailBlock[]
  rightBlocks: EmailBlock[]
}

export interface ThreeColumnBlockProps {
  leftBlocks: EmailBlock[]
  centerBlocks: EmailBlock[]
  rightBlocks: EmailBlock[]
}

export type BlockType =
  | 'text'
  | 'image'
  | 'button'
  | 'divider'
  | 'spacer'
  | 'conditional'
  | 'loop'
  | 'two_column'
  | 'three_column'

export type EmailBlock =
  | { id: string; type: 'text'; props: TextBlockProps }
  | { id: string; type: 'image'; props: ImageBlockProps }
  | { id: string; type: 'button'; props: ButtonBlockProps }
  | { id: string; type: 'divider'; props: DividerBlockProps }
  | { id: string; type: 'spacer'; props: SpacerBlockProps }
  | { id: string; type: 'conditional'; props: ConditionalBlockProps }
  | { id: string; type: 'loop'; props: LoopBlockProps }
  | { id: string; type: 'two_column'; props: TwoColumnBlockProps }
  | { id: string; type: 'three_column'; props: ThreeColumnBlockProps }

/**
 * Versioned document stored in `TemplateLanguageVariant.editorJson`.
 */
export interface EditorDocumentV1 {
  version: typeof EDITOR_DOC_VERSION
  blocks: EmailBlock[]
  attachments: AttachmentItem[]
}

const emptyTiptapDoc: TiptapDocJson = {
  type: 'doc',
  content: [{ type: 'paragraph' }],
}

function defaultTextBlock(id: string): EmailBlock {
  return {
    id,
    type: 'text',
    props: { doc: emptyTiptapDoc },
  }
}

/**
 * Coerce any legacy `editorJson` into a valid v1 document.
 * Never throws: invalid input yields a single empty text block.
 */
export function migrateEditorJson(raw: unknown): EditorDocumentV1 {
  if (
    raw &&
    typeof raw === 'object' &&
    'version' in raw &&
    (raw as { version: unknown }).version === EDITOR_DOC_VERSION &&
    'blocks' in raw &&
    Array.isArray((raw as EditorDocumentV1).blocks)
  ) {
    const doc = raw as EditorDocumentV1
    const sanitized = doc.blocks.map(sanitizeBlock).filter(Boolean) as EmailBlock[]
    const migratedInline = migrateLegacyInlineBlocks(sanitized)
    return {
      version: EDITOR_DOC_VERSION,
      blocks: migratedInline.length
        ? migratedInline
        : [defaultTextBlock(createId('blk'))],
      attachments: sanitizeAttachments(
        (doc as EditorDocumentV1).attachments,
      ),
    }
  }

  // Old Slice A: bare TipTap doc — preserve as a single text block
  if (raw && typeof raw === 'object' && (raw as JSONContent).type === 'doc') {
    return {
      version: EDITOR_DOC_VERSION,
      blocks: [
        {
          id: createId('blk'),
          type: 'text',
          props: { doc: raw as TiptapDocJson },
        },
      ],
      attachments: [],
    }
  }

  // Unknown / empty
  if (
    !raw ||
    (typeof raw === 'object' && !Array.isArray(raw) && !('type' in (raw as object)))
  ) {
    return {
      version: EDITOR_DOC_VERSION,
      blocks: [defaultTextBlock(createId('blk'))],
      attachments: [],
    }
  }

  return {
    version: EDITOR_DOC_VERSION,
    blocks: [defaultTextBlock(createId('blk'))],
    attachments: [],
  }
}

function legacyInlineNodeFromBlock(
  block: Extract<EmailBlock, { type: 'image' | 'button' | 'divider' | 'spacer' }>,
): JSONContent {
  if (block.type === 'image') {
    return {
      type: 'ecPlugin',
      attrs: {
        id: block.id,
        kind: 'image',
        label: 'Image',
        url: block.props.url,
        alt: block.props.alt,
        width: block.props.width,
        align: block.props.align,
        linkUrl: block.props.linkUrl ?? '',
      },
    }
  }
  if (block.type === 'button') {
    return {
      type: 'ecPlugin',
      attrs: {
        id: block.id,
        kind: 'button',
        label: 'Button',
        buttonLabel: block.props.label,
        buttonHref: block.props.href,
        fullWidth: block.props.fullWidth,
        backgroundColor: block.props.backgroundColor,
        textColor: block.props.textColor,
        borderRadius: block.props.borderRadius,
      },
    }
  }
  if (block.type === 'divider') {
    return {
      type: 'ecPlugin',
      attrs: {
        id: block.id,
        kind: 'divider',
        label: 'Divider',
        lineStyle: block.props.lineStyle,
        thickness: block.props.thickness,
        color: block.props.color,
      },
    }
  }
  return {
    type: 'ecPlugin',
    attrs: {
      id: block.id,
      kind: 'spacer',
      label: 'Spacer',
      height: block.props.height,
    },
  }
}

function migrateLegacyInlineBlocks(blocks: EmailBlock[]): EmailBlock[] {
  if (!blocks.some((b) => b.type === 'image' || b.type === 'button' || b.type === 'divider' || b.type === 'spacer')) {
    return blocks
  }

  const firstTextIndex = blocks.findIndex((b) => b.type === 'text')
  if (firstTextIndex < 0) return blocks

  const firstText = blocks[firstTextIndex] as Extract<EmailBlock, { type: 'text' }>
  const incoming = Array.isArray(firstText.props.doc?.content)
    ? [...(firstText.props.doc.content as JSONContent[])]
    : [{ type: 'paragraph' }]

  for (const block of blocks) {
    if (block.type === 'image' || block.type === 'button' || block.type === 'divider' || block.type === 'spacer') {
      incoming.push(legacyInlineNodeFromBlock(block))
      incoming.push({ type: 'paragraph' })
    }
  }

  const migratedText: EmailBlock = {
    ...firstText,
    props: {
      doc: {
        ...(firstText.props.doc ?? { type: 'doc' }),
        type: 'doc',
        content: incoming,
      },
    },
  }

  return blocks
    .filter(
      (b) =>
        b.type !== 'image' &&
        b.type !== 'button' &&
        b.type !== 'divider' &&
        b.type !== 'spacer',
    )
    .map((b, idx) => (idx === firstTextIndex ? migratedText : b))
}

function sanitizeBlock(b: unknown): EmailBlock | null {
  if (!b || typeof b !== 'object') return null
  const o = b as { id?: string; type?: string; props?: unknown }
  const id = typeof o.id === 'string' && o.id ? o.id : createId('blk')
  const t = o.type
  if (t === 'text' && o.props && typeof o.props === 'object' && 'doc' in o.props) {
    return { id, type: 'text', props: { doc: o.props.doc as TiptapDocJson } }
  }
  if (t === 'image' && o.props && typeof o.props === 'object') {
    return { id, type: 'image', props: { ...defaultImage(), ...(o.props as object) } as ImageBlockProps }
  }
  if (t === 'button' && o.props && typeof o.props === 'object') {
    return { id, type: 'button', props: { ...defaultButton(), ...(o.props as object) } as ButtonBlockProps }
  }
  if (t === 'divider' && o.props && typeof o.props === 'object') {
    return { id, type: 'divider', props: { ...defaultDivider(), ...(o.props as object) } as DividerBlockProps }
  }
  if (t === 'spacer' && o.props && typeof o.props === 'object') {
    return { id, type: 'spacer', props: { ...defaultSpacer(), ...(o.props as object) } as SpacerBlockProps }
  }
  if (t === 'conditional' && o.props && typeof o.props === 'object') {
    const incoming = o.props as Partial<ConditionalBlockProps>
    const next = { ...defaultConditional(), ...incoming }
    return {
      id,
      type: 'conditional',
      props: {
        ...next,
        thenBlocks: Array.isArray(incoming.thenBlocks)
          ? incoming.thenBlocks.map(sanitizeBlock).filter(Boolean) as EmailBlock[]
          : next.thenBlocks,
        elseBlocks: Array.isArray(incoming.elseBlocks)
          ? incoming.elseBlocks.map(sanitizeBlock).filter(Boolean) as EmailBlock[]
          : next.elseBlocks,
      },
    }
  }
  if (t === 'loop' && o.props && typeof o.props === 'object') {
    const incoming = o.props as Partial<LoopBlockProps>
    const next = { ...defaultLoop(), ...incoming }
    return {
      id,
      type: 'loop',
      props: {
        ...next,
        bodyBlocks: Array.isArray(incoming.bodyBlocks)
          ? incoming.bodyBlocks.map(sanitizeBlock).filter(Boolean) as EmailBlock[]
          : next.bodyBlocks,
        emptyBlocks: Array.isArray(incoming.emptyBlocks)
          ? incoming.emptyBlocks.map(sanitizeBlock).filter(Boolean) as EmailBlock[]
          : next.emptyBlocks,
      },
    }
  }
  if (t === 'two_column' && o.props && typeof o.props === 'object') {
    const incoming = o.props as Partial<TwoColumnBlockProps>
    const next = { ...defaultTwoColumn(), ...incoming }
    return {
      id,
      type: 'two_column',
      props: {
        ...next,
        leftBlocks: Array.isArray(incoming.leftBlocks)
          ? incoming.leftBlocks.map(sanitizeBlock).filter(Boolean) as EmailBlock[]
          : next.leftBlocks,
        rightBlocks: Array.isArray(incoming.rightBlocks)
          ? incoming.rightBlocks.map(sanitizeBlock).filter(Boolean) as EmailBlock[]
          : next.rightBlocks,
      },
    }
  }
  if (t === 'three_column' && o.props && typeof o.props === 'object') {
    const incoming = o.props as Partial<ThreeColumnBlockProps>
    const next = { ...defaultThreeColumn(), ...incoming }
    return {
      id,
      type: 'three_column',
      props: {
        ...next,
        leftBlocks: Array.isArray(incoming.leftBlocks)
          ? incoming.leftBlocks.map(sanitizeBlock).filter(Boolean) as EmailBlock[]
          : next.leftBlocks,
        centerBlocks: Array.isArray(incoming.centerBlocks)
          ? incoming.centerBlocks.map(sanitizeBlock).filter(Boolean) as EmailBlock[]
          : next.centerBlocks,
        rightBlocks: Array.isArray(incoming.rightBlocks)
          ? incoming.rightBlocks.map(sanitizeBlock).filter(Boolean) as EmailBlock[]
          : next.rightBlocks,
      },
    }
  }
  return null
}

export function defaultImage(): ImageBlockProps {
  return {
    url: '',
    alt: '',
    width: '100%',
    align: 'center',
  }
}

export function defaultButton(): ButtonBlockProps {
  return {
    label: 'Button',
    href: '',
    fullWidth: true,
    backgroundColor: '#2563eb',
    textColor: '#ffffff',
    borderRadius: 6,
  }
}

export function defaultDivider(): DividerBlockProps {
  return {
    lineStyle: 'solid',
    thickness: 1,
    color: '#e5e7eb',
  }
}

export function defaultSpacer(): SpacerBlockProps {
  return { height: 24 }
}

export function defaultConditional(): ConditionalBlockProps {
  return {
    variableKey: '',
    operator: 'truthy',
    compareValue: '',
    thenBlocks: [
      {
        id: createId('blk'),
        type: 'text',
        props: { doc: emptyTiptapDoc },
      },
    ],
    elseBlocks: [],
  }
}

export function defaultLoop(): LoopBlockProps {
  return {
    arrayKey: '',
    itemAlias: 'item',
    bodyBlocks: [
      {
        id: createId('blk'),
        type: 'text',
        props: { doc: emptyTiptapDoc },
      },
    ],
    emptyBlocks: [],
  }
}

export function defaultTwoColumn(): TwoColumnBlockProps {
  return {
    leftBlocks: [{ id: createId('blk'), type: 'text', props: { doc: emptyTiptapDoc } }],
    rightBlocks: [{ id: createId('blk'), type: 'text', props: { doc: emptyTiptapDoc } }],
  }
}

export function defaultThreeColumn(): ThreeColumnBlockProps {
  return {
    leftBlocks: [{ id: createId('blk'), type: 'text', props: { doc: emptyTiptapDoc } }],
    centerBlocks: [{ id: createId('blk'), type: 'text', props: { doc: emptyTiptapDoc } }],
    rightBlocks: [{ id: createId('blk'), type: 'text', props: { doc: emptyTiptapDoc } }],
  }
}

export function createEmptyDocument(): EditorDocumentV1 {
  return {
    version: EDITOR_DOC_VERSION,
    blocks: [defaultTextBlock(createId('blk'))],
    attachments: [],
  }
}

export function newBlockId(): string {
  return createId('blk')
}

export function newAttachmentId(): string {
  return createId('att')
}

export function defaultAttachment(): AttachmentItem {
  return {
    id: newAttachmentId(),
    label: 'Attachment',
    url: '',
    type: 'file',
    kind: 'auto',
    size: '',
  }
}

function sanitizeAttachments(raw: unknown): AttachmentItem[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const rec = item as Partial<AttachmentItem>
      const legacyStyle = (item as { style?: unknown }).style
      return {
        id:
          typeof rec.id === 'string' && rec.id
            ? rec.id
            : newAttachmentId(),
        label: typeof rec.label === 'string' ? rec.label : 'Attachment',
        url: typeof rec.url === 'string' ? rec.url : '',
        type:
          rec.type === 'button' || rec.type === 'link' || rec.type === 'file'
            ? rec.type
            : legacyStyle === 'button'
              ? 'button'
              : legacyStyle === 'link'
                ? 'link'
                : 'file',
        kind: rec.kind ?? 'auto',
        size: typeof rec.size === 'string' ? rec.size : '',
      } as AttachmentItem
    })
    .filter(Boolean) as AttachmentItem[]
}
