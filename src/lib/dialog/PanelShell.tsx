import type { ReactNode } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { useControlledOpen } from './useControlledOpen'

export interface PanelShellProps {
  asDialog?: boolean
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: ReactNode
  /** Optional dialog a11y title (not rendered visually by default). */
  title?: string
  children: ReactNode
}

/**
 * Layout shell for the panel. When `asDialog` (default) the content is
 * wrapped in a Radix Dialog with an overlay + focus trap + esc-to-close.
 * When `asDialog={false}` the content is rendered inline as a full-surface
 * `<section>` — useful for embedding on a dedicated admin route.
 *
 * The inner markup is identical in both modes so styling and behavior do not
 * diverge.
 */
export function PanelShell(props: PanelShellProps) {
  const {
    asDialog = true,
    open: controlledOpen,
    defaultOpen,
    onOpenChange,
    trigger,
    title = 'RETM Library — Template Panel',
    children,
  } = props

  const { open, setOpen } = useControlledOpen({
    open: controlledOpen,
    defaultOpen,
    onOpenChange,
  })

  if (!asDialog) {
    return (
      <section data-ec-shell="" data-ec-mode="inline">
        {children}
      </section>
    )
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      {trigger ? <Dialog.Trigger asChild>{trigger}</Dialog.Trigger> : null}
      <Dialog.Portal>
        <Dialog.Overlay data-ec-overlay="" />
        <Dialog.Content
          data-ec-shell=""
          data-ec-mode="dialog"
          aria-describedby={undefined}
          onOpenAutoFocus={(e) => {
            // Avoid auto-focusing the close button: let the library view take
            // focus instead for a calmer first paint.
            e.preventDefault()
          }}
        >
          <Dialog.Title data-ec-visually-hidden="">{title}</Dialog.Title>
          {children}
          <Dialog.Close asChild>
            <button
              type="button"
              data-ec-close=""
              aria-label="Close panel"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

