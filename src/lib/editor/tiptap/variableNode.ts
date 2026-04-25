import { Node, mergeAttributes } from '@tiptap/core'

/**
 * Inline atomic variable "chip" in rich text. Cannot be half-deleted.
 * Serialized as a span in HTML; export pipeline will replace with tokens in Slice C.
 */
export const variableNode = Node.create({
  name: 'ecVariable',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,
  draggable: false,

  addAttributes() {
    return {
      key: { default: '' },
      label: { default: '' },
      color: { default: null as string | null },
    }
  },

  parseHTML() {
    return [
      { tag: 'span[data-ec-var-chip][data-key]' },
      { tag: 'span[data-ec-var-chip]' },
    ]
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-ec-var-chip': '',
        'data-key': node.attrs.key,
        'data-ec-var': node.attrs.key,
        title: String(node.attrs.key),
        style: node.attrs.color
          ? `border-color: ${String(node.attrs.color)}; --ec-var-chip: ${String(node.attrs.color)}`
          : undefined,
      }),
      String(node.attrs.label),
    ]
  },
})
