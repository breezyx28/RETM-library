import { useEffect } from 'react'

export function useDebouncedEffect(
  fn: () => void,
  delayMs: number,
  deps: readonly unknown[],
) {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      fn()
    }, delayMs)
    return () => {
      window.clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
