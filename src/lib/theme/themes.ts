import type { ThemeName } from '../../types'
import type {
  EmailTemplatePanelClassNames,
  EmailTemplateViewerClassNames,
} from './SlotKeys'

/**
 * Built-in theme presets for the panel.
 *
 * Each entry maps a `ThemeName` to a partial `classNames` shape. These are
 * applied between built-in component defaults and user-supplied overrides,
 * so consumers can still override per slot via the `classNames` prop on
 * `<EmailTemplatePanel>` / `<EmailTemplateViewer>`.
 *
 * Color-level theming (surfaces, borders, text, etc.) primarily flows
 * through CSS via `[data-ec-theme="..."]` selectors in `theme.css`. The
 * slot maps below are reserved for theme-specific *layout* tweaks (extra
 * border, glass blur, etc.) that aren't expressible via tokens alone.
 */
export const panelThemes: Record<ThemeName, EmailTemplatePanelClassNames> = {
  default: {},
  dark: {},
  minimal: {},
  editorial: {},
  brutalist: {
    controls: {
      btn: 'border-2',
    },
  },
  glassmorphism: {
    dialogs: {
      shellDialog: 'backdrop-blur-xl',
    },
  },
}

/**
 * Built-in theme presets for the viewer. Same model as `panelThemes`.
 */
export const viewerThemes: Record<ThemeName, EmailTemplateViewerClassNames> = {
  default: {},
  dark: {},
  minimal: {},
  editorial: {},
  brutalist: {
    controls: {
      btn: 'border-2',
    },
  },
  glassmorphism: {
    viewer: {
      shell: 'backdrop-blur-xl',
    },
  },
}
