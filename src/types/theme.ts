/**
 * Theming types (spec §19, §20).
 *
 * RETM Library 1.0+ is Tailwind CSS v4 native. Theming has three tiers:
 *
 *   1. `theme` prop — pick a built-in `ThemeName` (default, dark, ...).
 *      This sets `data-ec-theme="..."` on the root, which the CSS in
 *      `theme.css` uses to swap surface tokens (`--color-ec-*`).
 *
 *   2. `classNames` prop — pass Tailwind utility classes per slot to override
 *      any visual decision per component (see `EmailTemplatePanelClassNames`
 *      and `EmailTemplateViewerClassNames`).
 *
 *   3. CSS `@theme` overrides — write your own `@theme { ... }` block in your
 *      Tailwind setup (or import `'retm-library/theme.css'`) to redefine
 *      the design tokens entirely. All built-in components and your own
 *      `bg-ec-primary`-style utilities pick up the change.
 *
 * `headless` mode skips the library's built-in default classes so consumers
 * can fully own styling with their own design system.
 */

export type ThemeName =
  | 'default'
  | 'dark'
  | 'minimal'
  | 'editorial'
  | 'brutalist'
  | 'glassmorphism'
