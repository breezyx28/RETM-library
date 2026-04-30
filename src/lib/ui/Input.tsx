import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { cn } from '../../utils/cn'
import { useSlot } from '../theme'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

/** `<input data-ec-input>` with slot-aware className merge. */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, ...rest },
  ref,
) {
  const [t, u] = useSlot('controls.input')
  return (
    <input
      ref={ref}
      data-ec-input=""
      className={cn(t, u, className)}
      {...rest}
    />
  )
})

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {}

/** `<select data-ec-input>` (re-uses the input slot). */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, children, ...rest },
  ref,
) {
  const [t, u] = useSlot('controls.input')
  return (
    <select
      ref={ref}
      data-ec-input=""
      className={cn(t, u, className)}
      {...rest}
    >
      {children}
    </select>
  )
})

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {}

/** `<textarea data-ec-input>` (re-uses the input slot). */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ className, ...rest }, ref) {
    const [t, u] = useSlot('controls.input')
    return (
      <textarea
        ref={ref}
        data-ec-input=""
        className={cn(t, u, className)}
        {...rest}
      />
    )
  },
)
