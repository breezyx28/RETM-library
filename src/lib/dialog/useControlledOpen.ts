import { useCallback, useState } from 'react'

interface UseControlledOpenArgs {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

interface UseControlledOpenResult {
  open: boolean
  setOpen: (open: boolean) => void
}

/**
 * Unified controlled/uncontrolled open-state hook, matching the Radix API
 * conventions. Returns a single `setOpen` callback that always notifies the
 * consumer via `onOpenChange` regardless of mode.
 */
export function useControlledOpen(
  args: UseControlledOpenArgs,
): UseControlledOpenResult {
  const { open: controlled, defaultOpen = false, onOpenChange } = args
  const isControlled = controlled !== undefined

  const [internalOpen, setInternalOpen] = useState(defaultOpen)

  const open = isControlled ? (controlled as boolean) : internalOpen

  const setOpen = useCallback(
    (next: boolean) => {
      if (!isControlled) setInternalOpen(next)
      onOpenChange?.(next)
    },
    [isControlled, onOpenChange],
  )

  return { open, setOpen }
}
