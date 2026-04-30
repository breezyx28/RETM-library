import type { ReactNode } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { useControlledOpen } from './useControlledOpen'
import type { ThemeName } from '../../types'
import { useHeadless, useSlot } from '../theme'
import { cn } from '../../utils/cn'

export interface PanelShellProps {
  asDialog?: boolean
  theme?: ThemeName
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
 * Styling consumes `useSlot()` for the overlay, shell, and close-button
 * slots (`dialogs.overlay`, `dialogs.shell{,Inline,Dialog}`, `dialogs.close`)
 * so consumers can override either at the panel root via
 * `classNames={{ dialogs: { ... } }}` or via their own Tailwind utilities.
 */
export function PanelShell(props: PanelShellProps) {
  const {
    asDialog = true,
    theme = 'default',
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

  const headless = useHeadless()
  const [overlayT, overlayU] = useSlot('dialogs.overlay')
  const [shellT, shellU] = useSlot('dialogs.shell')
  const [shellInlineT, shellInlineU] = useSlot('dialogs.shellInline')
  const [shellDialogT, shellDialogU] = useSlot('dialogs.shellDialog')
  const [closeT, closeU] = useSlot('dialogs.close')

  if (!asDialog) {
    return (
      <section
        data-ec-shell=""
        data-ec-mode="inline"
        className={cn(shellT, shellU, shellInlineT, shellInlineU)}
      >
        {children}
      </section>
    )
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      {trigger ? <Dialog.Trigger asChild>{trigger}</Dialog.Trigger> : null}
      <Dialog.Portal>
        <Dialog.Overlay
          data-ec-overlay=""
          className={cn(overlayT, overlayU)}
        />
        <Dialog.Content
          className={cn(
            headless ? undefined : 'retm-library-root',
            shellT,
            shellU,
            shellDialogT,
            shellDialogU,
          )}
          data-ec-shell=""
          data-ec-mode="dialog"
          data-ec-theme={headless ? undefined : theme}
          aria-describedby={undefined}
          onOpenAutoFocus={(e) => {
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
              className={cn(closeT, closeU)}
            >
              <X size={18} aria-hidden="true" />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
