import { useMemo } from 'react'
import type { PreviewViewport } from '../export'

export function PreviewFrame({
  html,
  viewport,
  darkMode = false,
}: {
  html: string
  viewport: PreviewViewport
  darkMode?: boolean
}) {
  const srcDoc = useMemo(() => html, [html])
  return (
    <div data-ec-preview="" className="ec-preview">
      <iframe
        title="Email preview"
        sandbox="allow-same-origin"
        srcDoc={srcDoc}
        className="ec-preview__frame"
        style={{
          width: viewport === 'mobile' ? 375 : '100%',
          filter: darkMode ? 'invert(1) hue-rotate(180deg)' : undefined,
        }}
      />
    </div>
  )
}
