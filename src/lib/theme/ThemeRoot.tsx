import { forwardRef, type CSSProperties, type ReactNode } from 'react'
import type { ThemeName } from '../../types'
import { cn } from '../../utils/cn'
import { ClassNamesProvider } from './ClassNamesContext'
import type { LibraryClassNames } from './SlotKeys'

export interface ThemeRootProps {
  theme?: ThemeName
  /**
   * When true, library components emit no built-in default class strings —
   * only `data-ec-*` attributes plus user `classNames`. Useful when
   * consumers want full control over styling with their own design system.
   */
  headless?: boolean
  /** User-supplied classNames overrides. Forwarded to context. */
  classNames?: LibraryClassNames
  /** Theme-supplied default classNames (selected from a theme map). */
  themedClassNames?: LibraryClassNames
  /** Class applied to the root wrapper. */
  className?: string
  style?: CSSProperties
  children?: ReactNode
  /**
   * `data-ec-scope="panel"|"viewer"` forwarded to the root so consumer CSS
   * and tests can target the surface independently.
   */
  dataScope?: string
}

/**
 * Renders the theming wrapper for the panel / viewer.
 *
 * Behavior:
 *  - Adds `data-ec-theme={theme}` so the CSS theme overrides in `theme.css`
 *    activate.
 *  - Provides `ClassNamesContext` so internal components can resolve their
 *    slot via `useSlot()`.
 *  - In `headless` mode skips emitting any default theme class and tells
 *    internals (via context) to skip built-in defaults too.
 */
export const ThemeRoot = forwardRef<HTMLDivElement, ThemeRootProps>(
  function ThemeRoot(
    {
      theme = 'default',
      headless = false,
      classNames,
      themedClassNames,
      className,
      style,
      children,
      dataScope,
    },
    ref,
  ) {
    const dataAttrs = headless
      ? { 'data-ec-root': '', 'data-ec-headless': '', 'data-ec-scope': dataScope }
      : { 'data-ec-root': '', 'data-ec-theme': theme, 'data-ec-scope': dataScope }

    return (
      <ClassNamesProvider
        user={classNames}
        themed={themedClassNames}
        headless={headless}
      >
        <div
          ref={ref}
          {...dataAttrs}
          className={cn(headless ? undefined : 'retm-library-root', className)}
          style={style}
        >
          {children}
        </div>
      </ClassNamesProvider>
    )
  },
)
