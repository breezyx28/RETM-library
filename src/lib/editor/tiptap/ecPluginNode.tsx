import { Node, mergeAttributes, type JSONContent } from '@tiptap/core'
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react'
import { Image, MousePointer2, Minus, MoveVertical, Pencil } from 'lucide-react'
import { createId } from '../../utils/id'
import { cn } from '../../../utils/cn'
import { usePanelStore } from '../../store'

export type EcPluginKind = 'image' | 'button' | 'divider' | 'spacer'

export interface EcPluginAttrs {
  id: string
  kind: EcPluginKind
  label: string
  url: string
  alt: string
  width: string
  align: 'left' | 'center' | 'right'
  linkUrl: string
  buttonLabel: string
  buttonHref: string
  fullWidth: boolean
  backgroundColor: string
  textColor: string
  borderRadius: number
  lineStyle: 'solid' | 'dashed' | 'dotted'
  thickness: number
  color: string
  height: number
}

export const defaultEcPluginAttrs = (kind: EcPluginKind): EcPluginAttrs => ({
  id: createId('plug'),
  kind,
  label:
    kind === 'image'
      ? 'Image'
      : kind === 'button'
        ? 'Button'
        : kind === 'divider'
          ? 'Divider'
          : 'Spacer',
  url: '',
  alt: '',
  width: '100%',
  align: 'center',
  linkUrl: '',
  buttonLabel: 'Button',
  buttonHref: '',
  fullWidth: true,
  backgroundColor: '#2563eb',
  textColor: '#ffffff',
  borderRadius: 6,
  lineStyle: 'solid',
  thickness: 1,
  color: '#e5e7eb',
  height: 24,
})

export const ecPluginFromLegacyBlock = (
  block:
    | { id: string; type: 'image'; props: { url: string; alt: string; width: string; align: 'left' | 'center' | 'right'; linkUrl?: string } }
    | { id: string; type: 'button'; props: { label: string; href: string; fullWidth: boolean; backgroundColor: string; textColor: string; borderRadius: number } }
    | { id: string; type: 'divider'; props: { lineStyle: 'solid' | 'dashed' | 'dotted'; thickness: number; color: string } }
    | { id: string; type: 'spacer'; props: { height: number } },
): JSONContent => {
  if (block.type === 'image') {
    return {
      type: 'ecPlugin',
      attrs: {
        ...defaultEcPluginAttrs('image'),
        id: block.id,
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
        ...defaultEcPluginAttrs('button'),
        id: block.id,
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
        ...defaultEcPluginAttrs('divider'),
        id: block.id,
        lineStyle: block.props.lineStyle,
        thickness: block.props.thickness,
        color: block.props.color,
      },
    }
  }
  return {
    type: 'ecPlugin',
    attrs: {
      ...defaultEcPluginAttrs('spacer'),
      id: block.id,
      height: block.props.height,
    },
  }
}

function EcPluginView({ node, editor, selected }: NodeViewProps) {
  const setSelectedInlinePlugin = usePanelStore((s) => s.setSelectedInlinePlugin)
  const setActiveTextBlockId = usePanelStore((s) => s.setActiveTextBlockId)

  const attrs = node.attrs as EcPluginAttrs
  const isImage = attrs.kind === 'image'
  const isButton = attrs.kind === 'button'
  const icon =
    attrs.kind === 'image' ? Image : attrs.kind === 'button' ? MousePointer2 : attrs.kind === 'divider' ? Minus : MoveVertical
  const Icon = icon

  const activate = () => {
    setActiveTextBlockId(
      editor.options.element
        ?.closest('[data-ec-text-id]')
        ?.getAttribute('data-ec-text-id') ?? null,
    )
    setSelectedInlinePlugin({
      pluginId: attrs.id,
      pluginKind: attrs.kind,
    })
  }

  return (
    <NodeViewWrapper
      as="div"
      className={cn('ec-inline-plugin', selected && 'ec-inline-plugin--selected')}
      data-kind={attrs.kind}
      onClick={activate}
    >
      <span className="ec-inline-plugin__meta">
        <Icon size={13} aria-hidden="true" />
        <strong>{attrs.label}</strong>
      </span>
      <button
        type="button"
        className="ec-inline-plugin__edit"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          activate()
        }}
        aria-label="Edit block in right panel"
      >
        <Pencil size={12} aria-hidden="true" />
        <span>Edit</span>
      </button>
      <div className="ec-inline-plugin__preview" aria-hidden="true">
        {isImage ? (
          <span>{attrs.url ? attrs.url : 'No image URL set'}</span>
        ) : null}
        {isButton ? (
          <span>{attrs.buttonLabel || 'Button'}</span>
        ) : null}
        {attrs.kind === 'divider' ? (
          <span>Line {attrs.lineStyle}</span>
        ) : null}
        {attrs.kind === 'spacer' ? (
          <span>Spacer {attrs.height}px</span>
        ) : null}
      </div>
    </NodeViewWrapper>
  )
}

export const ecPluginNode = Node.create({
  name: 'ecPlugin',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: false,

  addAttributes() {
    return {
      id: { default: createId('plug') },
      kind: { default: 'image' },
      label: { default: 'Image' },
      url: { default: '' },
      alt: { default: '' },
      width: { default: '100%' },
      align: { default: 'center' },
      linkUrl: { default: '' },
      buttonLabel: { default: 'Button' },
      buttonHref: { default: '' },
      fullWidth: { default: true },
      backgroundColor: { default: '#2563eb' },
      textColor: { default: '#ffffff' },
      borderRadius: { default: 6 },
      lineStyle: { default: 'solid' },
      thickness: { default: 1 },
      color: { default: '#e5e7eb' },
      height: { default: 24 },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-ec-plugin]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-ec-plugin': '' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(EcPluginView)
  },
})
