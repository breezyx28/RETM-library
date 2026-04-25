/**
 * Theming types (spec §19, §20).
 *
 * Three tiers: built-in theme name → CSS variable overrides → full headless.
 */

export type ThemeName =
  | 'default'
  | 'dark'
  | 'minimal'
  | 'editorial'
  | 'brutalist'
  | 'glassmorphism'

/**
 * CSS variable overrides. Any `--ec-*` token documented in spec §19 is valid.
 * Typed as a generic string map so consumers can pass any custom property.
 */
export type ThemeOverride = Record<`--ec-${string}`, string>
