---
'retm-library': major
---

Tailwind CSS v4 restyle (1.0.0).

The library is now Tailwind v4 native. The legacy `--ec-*` token system and
hand-written CSS files are gone; in their place are `@theme` design tokens,
a typed slot `classNames` API on every public component, and a hybrid
distribution (prebuilt CSS for zero-config consumers + a Tailwind v4 source
theme for full customization and tree-shaking).

### Breaking changes

- `themeOverride?: ThemeOverride` prop removed from `<EmailTemplatePanel>` and
  `<EmailTemplateViewer>`. Replaced by the typed `classNames` prop and/or
  `@theme` overrides in your own Tailwind setup.
- `ThemeOverride` type removed from the public API.
- `retm-library/tailwind-preset` export removed (Tailwind v3 preset). Replaced
  by `retm-library/theme.css` (Tailwind v4 source).

### Added

- `classNames?: EmailTemplatePanelClassNames | EmailTemplateViewerClassNames`
  prop on every public component. Slot map of Tailwind utility class strings
  (e.g. `controls.btnPrimary`, `editor.toolbar`, `library.card`).
- `retm-library/theme.css` export — Tailwind v4 source you can `@import`
  alongside `tailwindcss` for full-customization mode.
- New typed exports:
  `EmailTemplatePanelClassNames`, `EmailTemplateViewerClassNames`,
  `PanelControlsSlots`, `PanelDialogsSlots`, `PanelEditorSlots`,
  `PanelLibrarySlots`, `ViewerSlots`.
- `tailwind-merge` runtime dep — user-supplied utilities override library
  defaults automatically (no `!important` needed).

### Migration

Drop `themeOverride` and reach for `classNames` instead:

```diff
- <EmailTemplatePanel
-   themeOverride={{
-     '--ec-primary': '#7c3aed',
-     '--ec-primary-hover': '#6d28d9',
-   }}
- />
+ <EmailTemplatePanel
+   classNames={{
+     controls: {
+       btnPrimary: 'bg-violet-600 hover:bg-violet-700 border-violet-600',
+     },
+   }}
+ />
```

For deeper customization (token-level), import the source theme into your
Tailwind v4 setup and override the `@theme` tokens directly:

```css
@import 'tailwindcss';
@import 'retm-library/theme.css';

@theme {
  --color-ec-primary: #7c3aed;
  --color-ec-primary-hover: #6d28d9;
}
```
