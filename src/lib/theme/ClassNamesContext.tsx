import { createContext, useContext, useMemo, type ReactNode } from 'react'
import type { LibraryClassNames, SlotKey } from './SlotKeys'

/**
 * Resolves a dotted slot key like `controls.btnPrimary` against a nested
 * `classNames` object. Returns `undefined` when not present.
 */
function readSlot(
  source: LibraryClassNames | undefined,
  key: SlotKey,
): string | undefined {
  if (!source) return undefined
  const parts = key.split('.')
  let cur: unknown = source
  for (const part of parts) {
    if (cur && typeof cur === 'object' && part in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[part]
    } else {
      return undefined
    }
  }
  return typeof cur === 'string' ? cur : undefined
}

interface ClassNamesContextValue {
  /**
   * User-supplied overrides for the active surface (panel or viewer).
   * Built-in defaults live alongside each component; this context is purely
   * for consumer customization.
   */
  user: LibraryClassNames | undefined
  /**
   * Theme-supplied defaults — picked from `themes.ts` based on the active
   * `theme` prop. Layered between built-in defaults and `user`.
   */
  themed: LibraryClassNames | undefined
  /**
   * When true, library components emit no built-in default classes — only
   * `data-ec-*` attributes plus user `classNames`. Lets consumers fully own
   * styling (e.g. with their own design system).
   */
  headless: boolean
}

const ClassNamesContext = createContext<ClassNamesContextValue>({
  user: undefined,
  themed: undefined,
  headless: false,
})

export interface ClassNamesProviderProps {
  user: LibraryClassNames | undefined
  themed: LibraryClassNames | undefined
  headless?: boolean
  children: ReactNode
}

/**
 * Wires user `classNames` and theme defaults into a context that internal
 * components consume via `useSlot(...)`.
 */
export function ClassNamesProvider({
  user,
  themed,
  headless = false,
  children,
}: ClassNamesProviderProps) {
  const value = useMemo<ClassNamesContextValue>(
    () => ({ user, themed, headless }),
    [user, themed, headless],
  )
  return (
    <ClassNamesContext.Provider value={value}>
      {children}
    </ClassNamesContext.Provider>
  )
}

/**
 * Look up the user override + theme override for a slot key.
 * Returns a tuple `[themed, user]` so callers can compose with their own
 * built-in defaults via `cn()`:
 *
 *   const [t, u] = useSlot('controls.btnPrimary')
 *   <button className={cn('px-3 py-2 ...defaults', t, u)} />
 */
export function useSlot(key: SlotKey): [string | undefined, string | undefined] {
  const ctx = useContext(ClassNamesContext)
  const themed = readSlot(ctx.themed, key)
  const user = readSlot(ctx.user, key)
  return [themed, user]
}

/**
 * Sugar for the common case: returns the merged `themed + user` slot string
 * (no built-in defaults). Useful for purely user-owned slots.
 */
export function useSlotMerged(key: SlotKey): string | undefined {
  const [t, u] = useSlot(key)
  if (t && u) return `${t} ${u}`
  return t ?? u
}

/**
 * Whether the library is in headless mode — internals should skip emitting
 * built-in default class strings.
 */
export function useHeadless(): boolean {
  return useContext(ClassNamesContext).headless
}
