import { Extension } from '@tiptap/core'
import Suggestion, { type SuggestionProps } from '@tiptap/suggestion'
import { PluginKey } from '@tiptap/pm/state'
import { createRoot, type Root } from 'react-dom/client'
import type { FlatVariable } from '../../context/PanelConfigContext'
import { AtMenuList } from './AtMenuList'

const pluginKey = new PluginKey('ecVariableAt')

function filterItems(query: string, getItems: () => FlatVariable[]) {
  const q = query.toLowerCase()
  return getItems().filter(
    (i) =>
      i.label.toLowerCase().includes(q) || i.key.toLowerCase().includes(q),
  )
}

/**
 * @-triggered variable picker. `getItems` should read from PanelConfig (ref).
 */
export function createVariableAtExtension(getItems: () => FlatVariable[]) {
  return Extension.create({
    name: 'ecVariableAt',

    addProseMirrorPlugins() {
      const editor = this.editor
      let reactRoot: Root | null = null
      let mountEl: HTMLDivElement | null = null

      const unmount = () => {
        if (reactRoot) {
          try {
            reactRoot.unmount()
          } catch {
            // ignore
          }
          reactRoot = null
        }
        mountEl?.remove()
        mountEl = null
      }

      return [
        Suggestion<FlatVariable, FlatVariable>({
          editor,
          pluginKey,
          char: '@',
          items: ({ query }) => filterItems(query, getItems),
          command: ({ editor: ed, range, props }) => {
            ed.chain()
              .focus()
              .insertContentAt(range, {
                type: 'ecVariable',
                attrs: {
                  key: props.key,
                  label: props.label,
                  color: props.color ?? null,
                  renderAs: 'text',
                },
              })
              .run()
          },
          allow: () => getItems().length > 0,
          render: () => ({
            onStart: (props: SuggestionProps<FlatVariable, FlatVariable>) => {
              unmount()
              mountEl = document.createElement('div')
              mountEl.setAttribute('data-ec-at-suggest', '')
              document.body.appendChild(mountEl)
              const pos = props.clientRect?.()
              if (pos) {
                mountEl.style.position = 'fixed'
                mountEl.style.zIndex = '1300'
                mountEl.style.top = `${pos.bottom + 4}px`
                mountEl.style.left = `${pos.left}px`
              }
              reactRoot = createRoot(mountEl)
              reactRoot.render(<AtMenuList suggestionProps={props} />)
            },
            onUpdate: (props: SuggestionProps<FlatVariable, FlatVariable>) => {
              const pos = props.clientRect?.()
              if (mountEl && pos) {
                mountEl.style.top = `${pos.bottom + 4}px`
                mountEl.style.left = `${pos.left}px`
              }
              reactRoot?.render(<AtMenuList suggestionProps={props} />)
            },
            onExit: () => {
              unmount()
            },
          }),
        }),
      ]
    },
  })
}
