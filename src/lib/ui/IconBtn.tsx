import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '../../utils/cn'
import { useSlot } from '../theme'

export interface IconBtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {}

/**
 * Internal icon button (square, no text). Reads `controls.iconBtn`.
 */
export const IconBtn = forwardRef<HTMLButtonElement, IconBtnProps>(
  function IconBtn({ className, type = 'button', children, ...rest }, ref) {
    const [t, u] = useSlot('controls.iconBtn')
    return (
      <button
        ref={ref}
        type={type}
        data-ec-icon-btn=""
        className={cn(t, u, className)}
        {...rest}
      >
        {children}
      </button>
    )
  },
)
