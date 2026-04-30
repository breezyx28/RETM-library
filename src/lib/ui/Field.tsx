import { forwardRef, type LabelHTMLAttributes, type HTMLAttributes } from 'react'
import { cn } from '../../utils/cn'
import { useSlot } from '../theme'

export interface FieldProps extends LabelHTMLAttributes<HTMLLabelElement> {}

/** Field wrapper (`<label data-ec-field>`). */
export const Field = forwardRef<HTMLLabelElement, FieldProps>(function Field(
  { className, children, ...rest },
  ref,
) {
  const [t, u] = useSlot('controls.field')
  return (
    <label
      ref={ref}
      data-ec-field=""
      className={cn(t, u, className)}
      {...rest}
    >
      {children}
    </label>
  )
})

export interface LabelTextProps extends HTMLAttributes<HTMLSpanElement> {}

/** Field label text (`<span data-ec-label>`). */
export const LabelText = forwardRef<HTMLSpanElement, LabelTextProps>(
  function LabelText({ className, children, ...rest }, ref) {
    const [t, u] = useSlot('controls.label')
    return (
      <span
        ref={ref}
        data-ec-label=""
        className={cn(t, u, className)}
        {...rest}
      >
        {children}
      </span>
    )
  },
)
