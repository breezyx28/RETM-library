import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '../../utils/cn'
import { useSlot } from '../theme'

export type AlertVariant = 'error' | 'warning' | 'info' | 'success'

export interface AlertProps extends HTMLAttributes<HTMLParagraphElement> {
  variant?: AlertVariant
}

/** `<p data-ec-alert>` with slot wiring. */
export const Alert = forwardRef<HTMLParagraphElement, AlertProps>(function Alert(
  { variant = 'info', className, children, role = 'alert', ...rest },
  ref,
) {
  const [baseT, baseU] = useSlot('controls.alert')
  const [errT, errU] = useSlot('controls.alertError')
  const isError = variant === 'error'
  return (
    <p
      ref={ref}
      role={role}
      data-ec-alert=""
      data-ec-variant={variant}
      className={cn(baseT, baseU, isError ? errT : undefined, isError ? errU : undefined, className)}
      {...rest}
    >
      {children}
    </p>
  )
})
