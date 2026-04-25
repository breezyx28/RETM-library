import { renderAttachments, renderBlock } from './renderBlocks'
import type { RenderContext } from './types'

const ctx: RenderContext = {
  mode: 'plain',
  variableSchema: [],
  sampleData: {
    user: { name: 'John', subscribed: true },
    items: [{ name: 'A' }, { name: 'B' }],
    tags: ['A', 'B'],
    imageUrl: 'https://cdn.example.com/a.png',
  },
}

describe('renderBlock', () => {
  it('renders primitive blocks', () => {
    const text = renderBlock(
      {
        id: 't1',
        type: 'text',
        props: {
          doc: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello' }] }] },
        },
      },
      ctx,
    )
    const image = renderBlock(
      {
        id: 'i1',
        type: 'image',
        props: { url: 'https://x/y.png', alt: 'alt', width: '100%', align: 'center' },
      },
      ctx,
    )
    const button = renderBlock(
      {
        id: 'b1',
        type: 'button',
        props: {
          label: 'Click',
          href: 'https://example.com',
          fullWidth: true,
          backgroundColor: '#111111',
          textColor: '#ffffff',
          borderRadius: 8,
        },
      },
      ctx,
    )
    const divider = renderBlock(
      { id: 'd1', type: 'divider', props: { lineStyle: 'solid', thickness: 1, color: '#eee' } },
      ctx,
    )
    const spacer = renderBlock({ id: 's1', type: 'spacer', props: { height: 20 } }, ctx)

    expect(text).toContain('<p')
    expect(image).toContain('<img')
    expect(button).toContain('https://example.com')
    expect(divider).toContain('<hr')
    expect(spacer).toContain('height="20"')
  })

  it('renders conditional and loop in plain mode', () => {
    const conditional = renderBlock(
      {
        id: 'c1',
        type: 'conditional',
        props: {
          variableKey: 'user.subscribed',
          operator: 'truthy',
          compareValue: '',
          thenBlocks: [
            { id: 'txt1', type: 'text', props: { doc: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'YES' }] }] } } },
          ],
          elseBlocks: [
            { id: 'txt2', type: 'text', props: { doc: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'NO' }] }] } } },
          ],
        },
      },
      ctx,
    )
    const loop = renderBlock(
      {
        id: 'l1',
        type: 'loop',
        props: {
          arrayKey: 'items',
          itemAlias: 'item',
          bodyBlocks: [
            { id: 'txt3', type: 'text', props: { doc: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Row' }] }] } } },
          ],
          emptyBlocks: [],
        },
      },
      ctx,
    )
    expect(conditional).toContain('YES')
    expect(conditional).not.toContain('NO')
    expect(loop).toContain('Row')
  })

  it('supports conditional operators matrix in plain mode', () => {
    const equals = renderBlock(
      {
        id: 'c-eq',
        type: 'conditional',
        props: {
          variableKey: 'user.name',
          operator: 'equals',
          compareValue: 'John',
          thenBlocks: [{ id: 't', type: 'spacer', props: { height: 9 } }],
          elseBlocks: [{ id: 'f', type: 'spacer', props: { height: 4 } }],
        },
      },
      ctx,
    )
    const notEquals = renderBlock(
      {
        id: 'c-ne',
        type: 'conditional',
        props: {
          variableKey: 'user.name',
          operator: 'not_equals',
          compareValue: 'Jane',
          thenBlocks: [{ id: 't', type: 'spacer', props: { height: 11 } }],
          elseBlocks: [{ id: 'f', type: 'spacer', props: { height: 2 } }],
        },
      },
      ctx,
    )
    const containsString = renderBlock(
      {
        id: 'c-cs',
        type: 'conditional',
        props: {
          variableKey: 'user.name',
          operator: 'contains',
          compareValue: 'oh',
          thenBlocks: [{ id: 't', type: 'spacer', props: { height: 13 } }],
          elseBlocks: [{ id: 'f', type: 'spacer', props: { height: 3 } }],
        },
      },
      ctx,
    )
    const containsArray = renderBlock(
      {
        id: 'c-ca',
        type: 'conditional',
        props: {
          variableKey: 'tags',
          operator: 'contains',
          compareValue: 'A',
          thenBlocks: [{ id: 'f', type: 'spacer', props: { height: 6 } }],
          elseBlocks: [{ id: 't', type: 'spacer', props: { height: 14 } }],
        },
      },
      ctx,
    )
    const notEmpty = renderBlock(
      {
        id: 'c-nep',
        type: 'conditional',
        props: {
          variableKey: 'items',
          operator: 'not_empty',
          compareValue: '',
          thenBlocks: [{ id: 't', type: 'spacer', props: { height: 15 } }],
          elseBlocks: [{ id: 'f', type: 'spacer', props: { height: 1 } }],
        },
      },
      ctx,
    )

    expect(equals).toContain('height="9"')
    expect(notEquals).toContain('height="11"')
    expect(containsString).toContain('height="13"')
    expect(containsArray).toContain('height="6"')
    expect(notEmpty).toContain('height="15"')
  })

  it('renders loop empty blocks in plain mode when source array is missing', () => {
    const missingArrayCtx: RenderContext = { ...ctx, sampleData: {} }
    const loop = renderBlock(
      {
        id: 'loop-empty',
        type: 'loop',
        props: {
          arrayKey: 'items',
          itemAlias: 'item',
          bodyBlocks: [{ id: 'b', type: 'spacer', props: { height: 20 } }],
          emptyBlocks: [{ id: 'e', type: 'spacer', props: { height: 10 } }],
        },
      },
      missingArrayCtx,
    )
    expect(loop).toContain('height="10"')
    expect(loop).not.toContain('height="20"')
  })

  it('renders column layouts and production handlebars wrappers', () => {
    const prodCtx: RenderContext = { ...ctx, mode: 'production' }
    const condProd = renderBlock(
      {
        id: 'cp',
        type: 'conditional',
        props: {
          variableKey: 'user.subscribed',
          operator: 'truthy',
          compareValue: '',
          thenBlocks: [],
          elseBlocks: [],
        },
      },
      prodCtx,
    )
    const loopProd = renderBlock(
      {
        id: 'lp',
        type: 'loop',
        props: {
          arrayKey: 'items',
          itemAlias: 'item',
          bodyBlocks: [{ id: 'b1', type: 'spacer', props: { height: 8 } }],
          emptyBlocks: [{ id: 'e1', type: 'spacer', props: { height: 6 } }],
        },
      },
      prodCtx,
    )
    const twoCol = renderBlock(
      {
        id: 'tc',
        type: 'two_column',
        props: {
          leftBlocks: [{ id: 'l', type: 'spacer', props: { height: 8 } }],
          rightBlocks: [{ id: 'r', type: 'spacer', props: { height: 8 } }],
        },
      },
      ctx,
    )
    const threeCol = renderBlock(
      {
        id: 'thc',
        type: 'three_column',
        props: {
          leftBlocks: [{ id: 'l', type: 'spacer', props: { height: 8 } }],
          centerBlocks: [{ id: 'c', type: 'spacer', props: { height: 8 } }],
          rightBlocks: [{ id: 'r', type: 'spacer', props: { height: 8 } }],
        },
      },
      ctx,
    )
    expect(condProd).toContain('{{#if')
    expect(condProd).toContain('{{/if}}')
    expect(loopProd).toContain('{{#each items}}')
    expect(loopProd).toContain('{{else}}')
    expect(twoCol).toContain('width="50%"')
    expect(threeCol).toContain('33.33%')
  })

  it('escapes text and link href in text nodes', () => {
    const html = renderBlock(
      {
        id: 'text-escape',
        type: 'text',
        props: {
          doc: {
            type: 'doc',
            content: [
              {
                type: 'paragraph',
                content: [
                  { type: 'text', text: '<script>alert(1)</script>' },
                  {
                    type: 'text',
                    text: 'safe',
                    marks: [{ type: 'link', attrs: { href: 'https://example.com/?q=<bad>' } }],
                  },
                ],
              },
            ],
          },
        },
      },
      ctx,
    )
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
    expect(html).toContain('href="https://example.com/?q=&lt;bad&gt;"')
  })
})

describe('renderAttachments', () => {
  it('renders file and image attachments with smart behavior', () => {
    const html = renderAttachments(
      [
        { id: 'a1', label: 'Invoice', url: 'https://x/invoice.pdf', style: 'link', kind: 'auto' },
        { id: 'a2', label: 'Gallery', url: '{{imageUrl}}', style: 'button', kind: 'auto' },
      ],
      ctx,
    )
    expect(html).toContain('Invoice')
    expect(html).toContain('download')
    expect(html).toContain('<img')
  })
})
