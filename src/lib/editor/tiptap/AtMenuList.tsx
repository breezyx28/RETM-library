import type { SuggestionProps } from '@tiptap/suggestion'
import type { FlatVariable } from '../../context/PanelConfigContext'

export function AtMenuList({
  suggestionProps,
}: {
  suggestionProps: SuggestionProps<FlatVariable, FlatVariable>
}) {
  const { items, command } = suggestionProps
  if (!items.length) {
    return (
      <div data-ec-at-menu="" data-ec-empty="">
        <span>No matching variables</span>
      </div>
    )
  }
  return (
    <div data-ec-at-menu="" role="listbox" aria-label="Insert variable">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          role="option"
          data-ec-at-item=""
          onMouseDown={(e) => {
            e.preventDefault()
            command(item)
          }}
        >
          <span data-ec-at-label="">{item.label}</span>
          <span data-ec-at-key="">{item.key}</span>
        </button>
      ))}
    </div>
  )
}
