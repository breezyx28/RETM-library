/**
 * Slot identifiers shared across the library.
 *
 * Every internal element that consumers might want to style is given a
 * stable slot key. The public `<EmailTemplatePanel>` and
 * `<EmailTemplateViewer>` components expose typed `classNames` props whose
 * shape mirrors these identifiers. Internal components read their slot via
 * `useSlot(...)` and merge it with built-in defaults using `cn()`
 * (tailwind-merge handles utility conflicts so user classes win).
 */

/* --------------------------- Panel slots ------------------------------- */

export interface PanelLibrarySlots {
  /** `data-ec-library` — outer container for the library view. */
  root?: string
  /** `data-ec-library-head` — header row (title + actions). */
  head?: string
  /** `data-ec-library-title` — H1 in the library header. */
  title?: string
  /** `data-ec-library-subtitle` — supporting copy. */
  subtitle?: string
  /** `data-ec-library-filter` — search/filter wrapper. */
  filter?: string
  /** `data-ec-library-actions` — primary action area (e.g. New Template). */
  actions?: string
  /** `data-ec-grid` — card grid. */
  grid?: string
  /** `data-ec-card` — single card. */
  card?: string
  /** `data-ec-card-thumb` — clickable preview area. */
  cardThumb?: string
  /** `data-ec-card-body` — content below thumb. */
  cardBody?: string
  /** `data-ec-card-title` — card heading. */
  cardTitle?: string
  /** `data-ec-card-meta` — metadata line. */
  cardMeta?: string
  /** `data-ec-badge` — status badge. */
  badge?: string
  /** `data-ec-empty` — empty state container. */
  emptyState?: string
}

export interface PanelEditorSlots {
  /** `data-ec-template-editor` — outer editor container. */
  root?: string
  /** Inner shell (`ec-editor-shell`) — wraps the 3-column grid. */
  shell?: string
  /** `data-ec-toolbar` — top action bar. */
  toolbar?: string
  /** Left sidebar (`data-ec-sidebar` `data-ec-sidebar-left`). */
  sidebarLeft?: string
  /** Right sidebar (`data-ec-properties`, `data-ec-sidebar-right`). */
  sidebarRight?: string
  /** Generic sidebar (used in addition to left/right specifics). */
  sidebar?: string
  /** Section group inside a sidebar (`ec-sidebar-section`). */
  sidebarSection?: string
  /** Editor center column. */
  center?: string
  /** Canvas wrapper (`data-ec-canvas-wrap`). */
  canvasWrap?: string
  /** Canvas outer (`data-ec-canvas-outer`). */
  canvasOuter?: string
  /** Canvas scroll surface (`data-ec-canvas-scroller`). */
  canvas?: string
  /** Single composer node (per block). */
  canvasNode?: string
  /** Format toolbar (`data-ec-fmtbar`). */
  formatBar?: string
  /** Preview modal root. */
  preview?: string
}

export interface PanelControlsSlots {
  /** `data-ec-btn` — base button. */
  btn?: string
  /** `data-ec-btn[data-ec-variant=primary]`. */
  btnPrimary?: string
  /** `data-ec-btn[data-ec-variant=ghost]`. */
  btnGhost?: string
  /** `data-ec-btn[data-ec-variant=destructive]`. */
  btnDestructive?: string
  /** `data-ec-icon-btn` — square icon button. */
  iconBtn?: string
  /** `data-ec-input` — text input / select. */
  input?: string
  /** `data-ec-field` — field wrapper (label + input). */
  field?: string
  /** `data-ec-label` — field label. */
  label?: string
  /** `data-ec-menu` — dropdown menu surface. */
  menu?: string
  /** `data-ec-menu-item` — single item. */
  menuItem?: string
  /** `data-ec-menu-separator`. */
  menuSeparator?: string
  /** `data-ec-alert` — inline alert. */
  alert?: string
  /** `data-ec-alert[data-ec-variant=error]`. */
  alertError?: string
}

export interface PanelDialogsSlots {
  /** Overlay backdrop (`data-ec-overlay`). */
  overlay?: string
  /** Shell (`data-ec-shell`) — both inline and dialog modes. */
  shell?: string
  /** Inline mode shell (`data-ec-mode=inline`). */
  shellInline?: string
  /** Dialog mode shell (`data-ec-mode=dialog`). */
  shellDialog?: string
  /** Close (X) button. */
  close?: string
  /** AlertDialog content (`data-ec-alertdialog`). */
  alertDialog?: string
  /** AlertDialog title. */
  alertDialogTitle?: string
  /** AlertDialog body. */
  alertDialogBody?: string
}

export interface EmailTemplatePanelClassNames {
  /** Class applied to the outermost wrapper. */
  root?: string
  /** `data-ec-panel-body` — area that switches between library and editor. */
  body?: string
  library?: PanelLibrarySlots
  editor?: PanelEditorSlots
  controls?: PanelControlsSlots
  dialogs?: PanelDialogsSlots
}

/* --------------------------- Viewer slots ------------------------------ */

export interface ViewerSlots {
  /** `data-ec-viewer` — outermost wrapper. */
  root?: string
  /** Top filter bar (`data-ec-viewer-controls`). */
  controls?: string
  /** Two-column shell (`data-ec-viewer-shell`). */
  shell?: string
  /** Left list of templates (`data-ec-viewer-list`). */
  list?: string
  /** Single list item (`data-ec-viewer-item`). */
  listItem?: string
  /** Right main area (`data-ec-viewer-main`). */
  main?: string
  /** Toolbar inside main (`data-ec-viewer-toolbar`). */
  toolbar?: string
  /** Tab group (`data-ec-viewer-tabs`). */
  tabs?: string
  /** Language switcher (`data-ec-viewer-languages`). */
  languages?: string
  /** Action group (`data-ec-viewer-actions`). */
  actions?: string
  /** Preview pane (`data-ec-viewer-preview`). */
  preview?: string
  /** Iframe (`data-ec-viewer-frame`). */
  frame?: string
  /** Code pane wrapper (`data-ec-viewer-code-wrap`). */
  codeWrap?: string
  /** Code pane (`data-ec-viewer-code`). */
  code?: string
  /** Plain text pane (`data-ec-viewer-plain`). */
  plain?: string
}

export interface EmailTemplateViewerClassNames {
  /** Class applied to the outermost wrapper. */
  root?: string
  viewer?: ViewerSlots
  controls?: PanelControlsSlots
}

/* ------------------------ Combined union -------------------------------- */

/**
 * Union of all class-name shapes used inside the library. Internal components
 * receive whichever shape applies to their parent (panel vs. viewer); the
 * `useSlot()` helper handles lookups by dotted key.
 */
export type LibraryClassNames =
  | EmailTemplatePanelClassNames
  | EmailTemplateViewerClassNames

/**
 * Dotted slot key like `controls.btnPrimary` or `editor.toolbar`.
 *
 * The string-typed form is intentional: typing every valid key adds a lot of
 * compile-time noise without runtime benefit. Use the constants in
 * `slotKeys.ts` (re-exported from `theme/`) where possible.
 */
export type SlotKey = string
