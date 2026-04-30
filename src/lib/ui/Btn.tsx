import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '../../utils/cn'
import { useSlot } from '../theme'

export type BtnVariant = 'primary' | 'ghost' | 'destructive'

export interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual variant — sets `data-ec-variant` (used by `theme.css`). */
  variant?: BtnVariant
}

/**
 * Internal button wrapper.
 *
 * Emits `data-ec-btn` (and `data-ec-variant` when set) so the library's
 * Tailwind v4 component layer styles it. Pulls `controls.btn` /
 * `controls.btn{Primary,Ghost,Destructive}` from `useSlot` so consumers can
 * override per slot via the `<EmailTemplatePanel classNames={{ ... }} />`
 * prop. User-supplied `className` still wins (via `tailwind-merge` in
 * `cn()`).
 */
export const Btn = forwardRef<HTMLButtonElement, BtnProps>(function Btn(
  { variant, className, children, type = 'button', ...rest },
  ref,
) {
  const [baseT, baseU] = useSlot('controls.btn')
  const variantSlot =
    variant === 'primary'
      ? 'controls.btnPrimary'
      : variant === 'ghost'
        ? 'controls.btnGhost'
        : variant === 'destructive'
          ? 'controls.btnDestructive'
          : undefined
  const [varT, varU] = useSlot(variantSlot ?? 'controls.__none__')

  return (
    <button
      ref={ref}
      type={type}
      data-ec-btn=""
      data-ec-variant={variant}
      className={cn(baseT, baseU, varT, varU, className)}
      {...rest}
    >
      {children}
    </button>
  )
})
