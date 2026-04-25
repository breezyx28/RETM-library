import { forwardRef, type CSSProperties, type ReactNode } from 'react'
import type { ThemeName, ThemeOverride } from '../../types'
import { cn } from '../../utils/cn'

export interface ThemeRootProps {
  theme?: ThemeName
  themeOverride?: ThemeOverride
  headless?: boolean
  className?: string
  style?: CSSProperties
  children?: ReactNode
  /**
   * `data-ec-*` flag forwarded to the root so consumer CSS can target it.
   * Matches the attributes documented in spec §19 Tier 3.
   */
  dataScope?: string
}

/**
 * Applies theme tokens to its subtree. All theme variables are scoped under
 * `.retm-library-root[data-ec-theme=...]` in `panel.css`.
 *
 * In headless mode (`headless={true}`) neither class nor `data-ec-theme` is
 * applied, so none of the bundled styles match. Consumers then style
 * everything via the `data-ec-*` attributes on individual components.
 */
export const ThemeRoot = forwardRef<HTMLDivElement, ThemeRootProps>(
  function ThemeRoot(
    {
      theme = 'default',
      themeOverride,
      headless = false,
      className,
      style,
      children,
      dataScope,
    },
    ref,
  ) {
    const mergedStyle: CSSProperties | undefined = themeOverride
      ? { ...style, ...(themeOverride as CSSProperties) }
      : style

    if (headless) {
      return (
        <div
          ref={ref}
          data-ec-root=""
          data-ec-headless=""
          data-ec-scope={dataScope}
          className={className}
          style={mergedStyle}
        >
          {children}
        </div>
      )
    }

    return (
      <div
        ref={ref}
        data-ec-root=""
        data-ec-theme={theme}
        data-ec-scope={dataScope}
        className={cn('retm-library-root', className)}
        style={mergedStyle}
      >
        {children}
      </div>
    )
  },
)
