import { Node, mergeAttributes } from '@tiptap/core'
import type { VariableRenderAs } from '../../../types'

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
      renderAs: { default: 'text' as VariableRenderAs },
      listStyle: { default: 'unordered' as 'ordered' | 'unordered' },
      imageWidth: { default: 240 },
      imageHeight: { default: 120 },
      imageRadius: { default: 8 },
    }
  },

  parseHTML() {
    return [
      { tag: 'span[data-ec-var-chip][data-key]' },
      { tag: 'span[data-ec-var-chip]' },
    ]
  },

  renderHTML({ node, HTMLAttributes }) {
    const renderAs = String(node.attrs.renderAs || 'text')
    if (renderAs === 'image') {
      const w = Number(node.attrs.imageWidth || 240)
      const h = Number(node.attrs.imageHeight || 120)
      const r = Number(node.attrs.imageRadius || 8)
      return [
        'span',
        mergeAttributes(HTMLAttributes, {
          'data-ec-var-image': '',
          'data-key': node.attrs.key,
          'data-ec-var': node.attrs.key,
          style: `display:block;margin:8px 0;padding:10px;border:1px dashed #cbd5e1;border-radius:${r}px;min-height:${h}px;max-width:${w}px;`,
        }),
        String(node.attrs.label),
      ]
    }
    if (renderAs === 'table') {
      return [
        'span',
        mergeAttributes(HTMLAttributes, {
          'data-ec-var-table': '',
          'data-key': node.attrs.key,
          'data-ec-var': node.attrs.key,
          style: 'display:block;margin:8px 0;padding:8px;border:1px dashed #cbd5e1;border-radius:8px;',
        }),
        [
          'span',
          { style: 'display:block;margin-bottom:6px;font-size:11px;color:#64748b;' },
          `${String(node.attrs.label)} (table)`,
        ],
        [
          'table',
          { style: 'width:100%;border-collapse:collapse;' },
          [
            'tbody',
            {},
            ['tr', {}, ['td', { style: 'border:1px solid #e2e8f0;padding:4px;' }, 'A'], ['td', { style: 'border:1px solid #e2e8f0;padding:4px;' }, 'B'], ['td', { style: 'border:1px solid #e2e8f0;padding:4px;' }, 'C']],
            ['tr', {}, ['td', { style: 'border:1px solid #e2e8f0;padding:4px;' }, '1'], ['td', { style: 'border:1px solid #e2e8f0;padding:4px;' }, '2'], ['td', { style: 'border:1px solid #e2e8f0;padding:4px;' }, '3']],
            ['tr', {}, ['td', { style: 'border:1px solid #e2e8f0;padding:4px;' }, '4'], ['td', { style: 'border:1px solid #e2e8f0;padding:4px;' }, '5'], ['td', { style: 'border:1px solid #e2e8f0;padding:4px;' }, '6']],
          ],
        ],
      ]
    }
    if (renderAs === 'list') {
      return [
        'span',
        mergeAttributes(HTMLAttributes, {
          'data-ec-var-chip': '',
          'data-ec-var-list': '',
          'data-key': node.attrs.key,
          'data-ec-var': node.attrs.key,
          style: node.attrs.color
            ? `display:block;border-color: ${String(node.attrs.color)}; --ec-var-chip: ${String(node.attrs.color)}`
            : 'display:block;',
        }),
        `${String(node.attrs.label)} (${String(node.attrs.listStyle || 'unordered')} list)`,
      ]
    }
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-ec-var-chip': '',
        'data-key': node.attrs.key,
        'data-ec-var': node.attrs.key,
        'data-render-as': renderAs,
        title: String(node.attrs.key),
        style: node.attrs.color
          ? `border-color: ${String(node.attrs.color)}; --ec-var-chip: ${String(node.attrs.color)}`
          : undefined,
      }),
      renderAs === 'link'
        ? `${String(node.attrs.label)} (link)`
        : String(node.attrs.label),
    ]
  },
})
