# RETM Library — Visual Email Template Library
### Product Specification & Development Blueprint
> Version 1.4 | Status: ✅ Spec Complete — Ready for Development

---

## 1. Overview

RETM Library is an embeddable React component library for visual email template management. It ships **two top-level components**: `<EmailTemplatePanel>` for admin/operation teams to create, edit, and manage templates, and `<EmailTemplateViewer>` for internal staff (sales, support) to browse and inspect published templates in read-only mode. The library is framework-agnostic within the React ecosystem, fully themeable at both developer and UI level, cross-browser compatible, and outputs fully responsive, email-client-safe HTML.

### Core Problem Solved
> Backend provides an array of objects describing available variables → Operation team previously typed these manually → typos caused API errors → RETM Library enforces schema-contract by making variables chip-based tokens picked from a UI menu only.

---

## 2. Architecture & Roles

### Two Primary Roles + One Consumer Role

| Role | Responsibility | Interaction |
|---|---|---|
| **Backend Developer** | Defines variable schema, configures token format, theming, sets up storage callbacks | Via props on both components |
| **Operation Team** | Designs templates visually, picks variables from side panel, manages template library | Via `<EmailTemplatePanel>` — no code required |
| **Internal Staff** | Browses published templates for reference, copies HTML or code | Via `<EmailTemplateViewer>` — read-only, no edit/delete/create |

---

## 3. Component API (Developer Contract)

### 3.1 Main Panel Component
```jsx
<EmailTemplatePanel
  // Variable schema from your API
  variableSchema={variableSchema}

  // Token output format — see Section 6
  tokenFormat="handlebars" // or "mustache" | "jinja" | "erb" | "custom"
  customTokenFormat={{ open: "<<", close: ">>" }} // if tokenFormat="custom"

  // Template persistence — both options supported simultaneously
  storageMode="hybrid" // "backend" | "local" | "hybrid"
  onSave={(template) => api.post('/templates', template)}
  onLoad={() => api.get('/templates')}
  onDelete={(id) => api.delete(`/templates/${id}`)}

  // Optional sample data for live preview
  sampleData={{ user: { firstName: "John" }, job: { title: "Engineer" } }}

  // Multi-language support
  supportedLanguages={["en", "ar"]}
  defaultLanguage="en"
  rtlLanguages={["ar", "he", "fa"]}

  // Permissions
  userRole="admin"         // "admin" | "editor" | "viewer"
  publishMode="direct"     // "direct" | "approval"

  // Template organization
  organizationMode="both"  // "tags" | "folders" | "both"

  // Theming — see Section 18 for full reference
  theme="default"          // "default" | "minimal" | "dark" | "editorial" | "brutalist" | "glassmorphism"
  themeOverride={{         // CSS variable overrides on top of any theme
    "--ec-primary": "#7c3aed",
    "--ec-radius": "4px",
  }}
  headless={false}         // true = zero styles shipped, developer owns all CSS

  readOnly={false}
  defaultOpen={false}
  onExport={(html, json, metadata) => {}}
/>
```

### 3.2 Read-Only Viewer Component
```jsx
import { EmailTemplateViewer } from 'retm-library'

<EmailTemplateViewer
  // Same storage source as the panel
  storageMode="backend"
  onLoad={() => api.get('/templates?status=published')}

  // Only published templates are shown — no drafts, no archived
  // No edit / delete / create controls rendered at all

  // Viewer display options
  defaultView="grid"        // "grid" | "list"
  searchable={true}
  filterByTags={true}
  filterByLanguage={true}

  // Code view config
  codeView={{
    enabled: true,
    syntax: "html",         // syntax highlighting language hint
    showLineNumbers: true,
    copyButton: true,
    defaultTab: "preview"   // "preview" | "code"
  }}

  // Same theming system as panel
  theme="default"
  themeOverride={{ "--ec-primary": "#7c3aed" }}
  headless={false}

  // Callback when user copies the code
  onCopy={(html, templateId) => {}}
/>
```

---

## 4. Variable Schema Format

The backend passes an array of objects. RETM Library supports nested grouping:

```js
const variableSchema = [
  {
    group: "User",
    color: "#3b82f6", // chip color in editor
    variables: [
      { key: "user.firstName", label: "First Name", type: "string", required: true, sample: "John" },
      { key: "user.lastName",  label: "Last Name",  type: "string", required: true, sample: "Doe" },
      { key: "user.email",     label: "Email",      type: "string", required: false, sample: "john@example.com" },
      { key: "user.avatarUrl", label: "Avatar",     type: "image",  required: false, sample: "https://..." },
    ]
  },
  {
    group: "Job",
    color: "#10b981",
    variables: [
      { key: "job.title",    label: "Job Title",  type: "string",  required: false, sample: "Software Engineer" },
      { key: "job.company",  label: "Company",    type: "string",  required: false, sample: "Acme Corp" },
    ]
  },
  {
    group: "Order",
    color: "#f59e0b",
    variables: [
      { key: "order.id",       label: "Order ID",    type: "string",  required: true,  sample: "#12345" },
      { key: "order.total",    label: "Total",       type: "currency",required: true,  sample: "$99.99" },
      { key: "order.invoiceUrl", label: "Invoice",   type: "file",    required: false, sample: "https://...invoice.pdf" },
    ]
  }
]
```

### Variable Types
| Type | Behavior in Editor | Rendered HTML Output |
|---|---|---|
| `string` | Inline chip token | Replaced with text value |
| `image` | Inline chip → renders `<img>` tag | `<img src="{{variable}}" />` |
| `file` | Inline chip → renders `<a href>` download link | `<a href="{{variable}}">Download</a>` |
| `url` | Inline chip → renders as `<a href>` | `<a href="{{variable}}">` |
| `currency` | Inline chip with $ formatting hint | Text token |
| `boolean` | Used in conditional blocks only | Controls block visibility |
| `array` | Used in loop blocks | Repeatable block content |

---

## 5. Multi-Language Template System

Each template is a **language container** — one template entry holds N language variants. The operation team switches between language tabs in the editor. Each language variant has its own independent editor content but shares the same variable schema and metadata structure.

### Template Language Structure
```js
{
  id: "tpl_welcome_001",
  name: "Welcome Email",
  defaultLanguage: "en",
  languages: {
    en: {
      subject: "Welcome, {{user.firstName}}!",
      preheader: "We're glad to have you.",
      editorJson: { blocks: [...] },
      html: "<html>...</html>",
      updatedAt: "ISO string"
    },
    ar: {
      subject: "مرحباً، {{user.firstName}}!",
      preheader: "يسعدنا انضمامك.",
      editorJson: { blocks: [...] },
      html: "<html dir=\"rtl\">...</html>",
      updatedAt: "ISO string"
    }
  }
}
```

### RTL Support Rules
- When editing an `rtlLanguages` variant (e.g., Arabic), the canvas automatically applies `dir="rtl"` and mirrors the layout
- Text alignment defaults flip: left → right, right → left
- Column order reverses in multi-column blocks
- The editor toolbar and side panels remain LTR (UI chrome is always LTR regardless of content language)
- On HTML export, the `<html>` tag receives `dir="rtl" lang="ar"` (or the configured language code)
- Font stack for RTL: adds `'Noto Sans Arabic', 'Cairo', Tahoma` before generic fallbacks

### Language Tab UI in Editor
```
[ EN ] [ AR + ] [ + Add language ]
```
- Each language tab shows a dot indicator: green (has content), gray (empty/not started), yellow (has unsaved changes)
- "Add language" opens a picker of all `supportedLanguages` not yet added
- Switching tabs preserves unsaved state per language in session memory

---

The editor stores variables internally as structured JSON. On HTML export, tokens are serialized into the configured format:

| `tokenFormat` | Output Example |
|---|---|
| `"handlebars"` | `{{user.firstName}}` |
| `"mustache"` | `{{user.firstName}}` |
| `"jinja"` | `{{ user.firstName }}` |
| `"erb"` | `<%= user.firstName %>` |
| `"dollar"` | `${user.firstName}` |
| `"custom"` | Defined by `customTokenFormat.open` + key + `customTokenFormat.close` |

Custom example:
```js
tokenFormat="custom"
customTokenFormat={{ open: "[[", close: "]]" }}
// Output: [[user.firstName]]
```

---

## 6. Template Panel UI — Dialog Structure

The RETM Library panel opens as a full-screen or large Dialog (configurable). It has two top-level modes:

### 6.1 Library View (Home)

**Two display modes — switchable via a toggle:**

**Folder/Category Mode (default):**
- Templates organized in a left sidebar folder tree:
  ```
  📁 All Templates (12)
  📁 Onboarding (3)
  📁 Transactional (5)
    📁 Orders (3)
    📁 Payments (2)
  📁 Marketing (4)
  + New folder
  ```
- Selecting a folder shows templates in that folder (grid or list view)
- Templates can belong to multiple folders (label-style, not exclusive containers)

**Flat / Tags Mode:**
- Single scrollable grid of all templates
- Filter chips: `[onboarding ×]  [transactional ×]  [+ add filter]`
- Sort by: Name, Last modified, Status, Language count

**Common to both modes:**
- Rendered thumbnail preview per template
- Template name, description, last modified, modified-by label
- Language indicator pills: `EN  AR` showing which languages are populated
- Status badge: `Draft` | `Published` | `Archived`
- **3-dot menu (⋮) on each card** — on hover, reveals:
  ```
  ✏️  Edit
  👁️  Preview (in-app)
  🌐  Preview as HTML       ← opens plain HTML in new browser tab
  ⬇️  Export HTML           ← downloads production .html file
  📋  Duplicate
  🗂️  Move to folder
  🗑️  Archive
  ❌  Delete
  ```
- Search bar (searches name, tags, variables used, content)

### 6.2 Editor View
Three-column layout with language tabs above the canvas:

```
┌─────────────────────────────────────────────────────────────────┐
│  TOOLBAR: Undo│Redo | Blocks | Format | Preview | Export | Save  │
│  LANG TABS:  [ EN ● ] [ AR ○ ] [ + Add language ]               │
├─────────────────┬───────────────────────────────┬───────────────┤
│  LEFT PANEL     │       CANVAS (600px wide)     │  RIGHT PANEL  │
│                 │                               │               │
│  📦 Blocks      │  ┌─────────────────────────┐  │  🎨 Style     │
│  ─── Layout     │  │  [Header Block]         │  │  Block props  │
│  ─── Content    │  │  [Text Block]           │  │  Padding      │
│  ─── Media      │  │  [Image Block]          │  │  Background   │
│  ─── Advanced   │  │  [Button Block]         │  │  Border       │
│                 │  │  [Footer Block]         │  │  Typography   │
│  📌 Variables   │  └─────────────────────────┘  │               │
│  ─── User       │                               │  📋 Metadata  │
│  ─── Job        │                               │  Subject line │
│  ─── Order      │                               │  Preheader    │
│                 │                               │  Tags/Folders │
│  🧩 Conditions  │                               │  SEO / Meta   │
│  ─── If/Else    │                               │               │
│  ─── Loop       │                               │  📎 Attach.   │
│                 │                               │  Attach files │
└─────────────────┴───────────────────────────────┴───────────────┘
```
Language tab dot indicators: ● green = has content, ○ gray = empty, ◐ yellow = unsaved changes

---

## 7. Editor Features — Detailed

### 7.1 Content Blocks (Drag & Drop)
| Block | Description |
|---|---|
| `Header` | Logo + nav links area |
| `Hero` | Full-width banner with background image/color |
| `Text` | Rich text paragraph with inline variable support |
| `Image` | URL-based image with size, alignment, alt text, link |
| `Button` | CTA button with color, border-radius, URL (can be a variable) |
| `Divider` | Horizontal rule with style options |
| `Spacer` | Empty vertical spacing block |
| `2-Column` | Side-by-side content layout (table-based for email safety) |
| `3-Column` | Three equal-width columns |
| `Product Card` | Image + title + price + button (variable-aware) |
| `Social Links` | Icon row for social media |
| `Footer` | Copyright, unsubscribe link, address |
| `Raw HTML` | Escape hatch for advanced developers |
| `Conditional Block` | Shows/hides based on boolean variable |
| `Loop Block` | Repeats content for array variable |

### 7.2 Variable Insertion (The Core UX)
- **Trigger**: typing `@` in any text block opens a floating variable picker
- **Side Panel**: click any variable in the panel → inserts at current cursor position
- **Visual**: variables render as colored pill chips: `[👤 First Name]`
- **Cannot be partially deleted** — chip is atomic (deleted as whole unit)
- **Cannot be manually typed** — only insertable via the two methods above
- **Tooltip on hover**: shows the variable key, type, and sample value

### 7.3 Image Blocks (URL-Based)
- Paste image URL into the image block URL field
- Image renders immediately in the block with dashed border placeholder
- Customization controls:
  - Width: px or % (max 600px for email safety)
  - Alignment: left / center / right
  - Alt text (required field, warned if missing)
  - Link URL (wrap image in `<a href>`)
  - Border radius, border color/width
  - Max height with overflow hidden option
- Image variables: if the URL field contains a token chip from an `image`-type variable, it renders a placeholder preview using the sample URL

### 7.4 Attachments & File Links
- Operation team adds attachment entries in the right panel "Attachments" section
- Each attachment has:
  - Label (display text): e.g., "Download Invoice"
  - URL field: can be a static URL OR a `file`/`url` type variable token
  - Icon: auto-detected from URL extension (`.pdf` → PDF icon, `.png`/`.jpg` → Image icon, `.zip` → Archive icon)
  - Style: inline link or button-style
- On render: becomes a styled `<a href="..." download>` link in the email body
- **Smart URL detection**: if a URL ends with a known extension, the link is auto-labeled and styled accordingly:
  - `.pdf` → "📄 View PDF"
  - `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp` → rendered inline as `<img>`
  - `.mp4`, `.mov` → thumbnail with play overlay + "Watch Video" link (email-safe fallback)
  - `.zip`, `.xlsx`, `.csv` → download link with file-type icon

### 7.5 Conditional Blocks
```
[IF block.condition = variable.key]
  ... content shown when condition is true ...
[ELSE]
  ... optional fallback content ...
[END IF]
```
- Visual wrapper with green/orange dashed border and label
- Condition builder: `variable` + `operator` + `value`
  - Operators: `equals`, `not equals`, `contains`, `is empty`, `is not empty`, `greater than`, `less than`
- On export: wraps content in the configured template engine's conditional syntax (e.g., `{{#if user.isPremium}}...{{/if}}` for Handlebars)

### 7.6 Loop Blocks
```
[FOR EACH item IN order.items]
  Product: [item.name] — [item.price]
[END FOR]
```
- Visual wrapper with blue dashed border
- Inside a loop block, additional variables from the loop's array schema become available

---

## 8. Live Preview System

### 8.1 Preview Modes
| Mode | Description |
|---|---|
| **Hydrated Preview** | All tokens replaced with `sample` values from schema. Looks like a real sent email. |
| **Token Preview** | Tokens shown as styled chips — what the template looks like before data injection |
| **Desktop View** | 600px width canvas |
| **Mobile View** | 375px width with responsive stacking |
| **Dark Mode** | Simulates dark mode rendering (some email clients support this) |
| **Plain Text** | HTML stripped, formatted as plain text fallback |

### 8.2 Test Send (Optional Integration)
- "Send Test Email" button in preview
- Accepts a recipient email address
- Fires a callback: `onTestSend({ html, metadata, recipient })`
- Backend handles the actual sending

---

## 9. HTML Export & Output

### 9.1 Two Export Modes

| Mode | Description | Use Case |
|---|---|---|
| **Production Export** | Fully inlined CSS, table-based layout, MSO comments, tokens replaced with configured format (e.g. `{{user.firstName}}`) | Handed to backend to inject real data at send time |
| **Plain HTML Preview Export** | Same as production export but tokens replaced with their `sample` values — renders as a real finished email | QA review, stakeholder sign-off, browser preview, archiving |

Both modes output a single self-contained `.html` file with no external dependencies.

### 9.2 Export Entry Points
- **Toolbar "Export" button** in the editor → opens export modal with mode selector
- **Template card 3-dot menu → "Export HTML"** → exports production HTML for the selected language variant
- **Template card 3-dot menu → "Preview as HTML"** → exports plain HTML with sample data, opens in new browser tab
- **Preview view sidebar "Export HTML" button** → exports production HTML of currently previewed language

### 9.3 Export Modal (from Editor toolbar)
```
┌─────────────────────────────────┐
│  Export Template                │
│                                 │
│  Language:  [EN ▼]  [AR]        │
│                                 │
│  Mode:                          │
│  ◉ Production HTML              │
│    Tokens stay as {{variables}} │
│  ○ Plain HTML (with sample data)│
│    Tokens replaced with samples │
│                                 │
│  Token format: [handlebars ▼]   │
│                                 │
│  [ Cancel ]      [ Export .html ]│
└─────────────────────────────────┘
```

### 9.4 Export Format Details
- Fully inlined CSS (`juice`)
- Table-based layout for Outlook compatibility
- Proper email DOCTYPE and meta tags
- MSO conditional comment wrappers for background images
- Max-width 600px centered container
- For Plain HTML mode: all variable chips replaced with `sample` values from schema; conditional blocks evaluated against sample boolean values; loop blocks rendered once with sample array item

### 9.5 Export Artifacts
`onExport` callback receives:
```js
{
  html: "<html>...</html>",
  mode: "production" | "plain",
  language: "en",
  json: { blocks: [...] },
  metadata: {
    name: "Welcome Email",
    subject: "Welcome, {{user.firstName}}!",
    preheader: "We're glad to have you.",
    tags: ["onboarding"],
    variablesUsed: ["user.firstName", "user.lastName"],
    requiredVariablesMissing: [],
    createdAt: "ISO string",
    updatedAt: "ISO string"
  }
}
```

### 9.6 Storage Modes

**Backend Mode**: All templates stored via API callbacks
```js
storageMode="backend"
onSave={async (template) => await api.post('/email-templates', template)}
onLoad={async () => await api.get('/email-templates')}
onDelete={async (id) => await api.delete(`/email-templates/${id}`)}
```

**Local Mode**: Templates stored in localStorage (good for prototyping)
```js
storageMode="local"
// No callbacks needed — automatic
```

**Hybrid Mode**: Try backend first, fall back to local (offline-resilient)
```js
storageMode="hybrid"
// All callbacks + local storage — syncs when online
```

---

## 10. SEO & Metadata Panel

| Field | Purpose |
|---|---|
| **Template Name** | Internal identifier in library |
| **Subject Line** | Email subject — supports variable tokens |
| **Preheader Text** | Inbox preview text (hidden `<span>` in HTML) |
| **From Name** | Suggested sender name |
| **Reply-To** | Suggested reply address |
| **Tags** | Categorization (e.g., "onboarding", "transactional") |
| **HTML `<title>`** | For web-hosted mirror page |
| **Language** | Sets `lang` attribute on `<html>` tag |
| **RTL Support** | Toggle for right-to-left languages |

---

## 11. Validation System

### 11.1 Real-Time Warnings (in editor)
- 🟡 Missing alt text on image
- 🟡 Button with no URL set
- 🔴 Variable token used that is not in the current schema
- 🔴 Required variable from schema not used in template
- 🟡 No preheader text set
- 🟡 Subject line empty

### 11.2 Pre-Export Validation Modal
Before HTML export or save-as-published, show a validation summary:
```
✅ 3 required variables used
⚠️  2 images missing alt text
⚠️  No preheader text
❌  Variable "user.middleName" is not in the current schema
    → Found in: Text Block 3, Line 2
```
- Can "Export Anyway" or go fix issues

---

## 12. Template Versioning & Persistent Undo/Redo

Version history **is** the undo/redo system — there is no session-only undo stack that resets on refresh. Every meaningful save creates a version snapshot, and restoring any version is how undo works persistently.

### Auto-save Strategy
- **Draft auto-save**: Every 30 seconds of inactivity, or on every block change after a debounce of 5 seconds — saves silently as a version tagged `"autosave"`
- **Manual save**: User clicks Save — saves a version tagged `"manual"` with an optional note
- **Pre-export save**: Exporting always triggers a version save first

### Version History Panel
- List of versions: timestamp, save type (`autosave` | `manual`), saved-by label, optional note
- Autosave versions are visually de-emphasized (smaller, lighter) — manual saves are prominent
- **Restore**: loads any past version into the editor (non-destructive — the restore itself becomes a new version)
- **Diff view** (Phase 3): side-by-side HTML diff between any two selected versions

### Version Storage Structure
```js
{
  versionId: "v_1714023600",
  templateId: "tpl_welcome_001",
  language: "en",          // versions are per-language
  savedAt: "ISO string",
  savedBy: "user_label",
  type: "manual",          // "autosave" | "manual" | "restore" | "pre-export"
  note: "Added conditional block for premium users",
  editorJson: { blocks: [...] },
  html: "<html>...</html>"
}
```

### Undo/Redo Toolbar Buttons
- **Undo** (`Ctrl+Z`): restores the previous autosave version for the active language
- **Redo** (`Ctrl+Shift+Z`): re-applies a version that was undone
- Both buttons are disabled when at the oldest/newest version boundary
- Tooltip on hover shows the version timestamp: "Undo to 2 min ago"

---

## 13. Permissions & Roles

**Default behavior: publish directly** — no approval step required. The full approval workflow is scaffolded in the data model and UI but disabled by default, activated via the `publishMode` prop.

### Role Capabilities Matrix

| Capability | admin | editor | viewer |
|---|---|---|---|
| Create template | ✅ | ✅ | ❌ |
| Edit template | ✅ | ✅ | ❌ |
| Save as draft | ✅ | ✅ | ❌ |
| Publish directly | ✅ | ✅ (default) | ❌ |
| Submit for review | ✅ | ✅ (when publishMode="approval") | ❌ |
| Approve & publish | ✅ | ❌ | ❌ |
| Delete template | ✅ | ❌ | ❌ |
| Archive template | ✅ | ✅ | ❌ |
| Restore version | ✅ | ✅ | ❌ |
| Send test email | ✅ | ✅ | ✅ |
| View/preview | ✅ | ✅ | ✅ |
| Manage folders | ✅ | ✅ | ❌ |

### Approval Workflow (when `publishMode="approval"`)
```
Editor saves → status: "pending_review"
                    ↓
Admin reviews → Approve → status: "published"
              → Reject + comment → status: "draft" (editor notified)
```
- Reject comments are stored in version history
- Rejection reasons shown inline in the library card

```js
userRole="admin"          // default: "admin"
publishMode="direct"      // default: "direct" | "approval"
```

---

## 14. Technology Stack Recommendations

| Layer | Recommendation | Reason |
|---|---|---|
| **Rich Text / Editor Core** | TipTap (ProseMirror-based) | Most extensible for custom nodes (variable chips, conditional blocks) |
| **Drag & Drop Blocks** | `@dnd-kit/core` | Lightweight, accessible, works well in React |
| **CSS Inliner (Export)** | `juice` (npm) | Battle-tested email CSS inliner |
| **HTML Email Sanitizer** | `he` + custom rules | Ensures output is email-client safe |
| **Syntax Highlighting (Viewer)** | `shiki` | Same highlighter as Vite/Astro docs; themes match library themes |
| **Image Dimension Helper** | Native browser `Image` API | Pre-validate image URLs before rendering |
| **State Management** | Zustand or React Context | Scoped to panel, no global pollution |
| **Dialog / Portal** | Radix UI Dialog | Accessible, headless, easy to style |
| **Icons** | Lucide React | Consistent, tree-shakeable |
| **Preview Iframe** | Sandboxed `<iframe srcdoc>` | Isolated rendering, prevents style bleed |
| **Build Tool** | `tsup` (wraps esbuild) | Outputs ESM + CJS + `.d.ts` in one config; used by zustand, jotai, react-hot-toast |
| **Clipboard** | `navigator.clipboard.writeText` + `document.execCommand` fallback | HTTPS primary, HTTP fallback for broad compatibility |

---

## 15. Saved Blocks Library

Operation team members can save any block they've designed as a reusable saved block. Saved blocks are **snapshot copies** — once inserted into a template they are fully independent (editing the saved block does not affect templates already using it).

### Visibility Scopes
| Scope | Who can see it | Who can edit/delete it |
|---|---|---|
| **Personal** | Only the user who saved it | Only that user |
| **Shared (Team)** | All operation team members | The creator + admins |

When saving a block, the user picks a name, optional description, and visibility: Personal or Share with team.

### Saved Block Data Structure
```js
{
  blockId: "blk_footer_branded_001",
  name: "Branded Footer - EN",
  description: "Standard footer with unsubscribe + social links",
  visibility: "shared",           // "personal" | "shared"
  createdBy: "user_label",
  createdAt: "ISO string",
  tags: ["footer", "branded"],
  snapshot: {                     // frozen copy of block state at save time
    type: "footer",
    editorJson: { ... },
    previewHtml: "<div>...</div>" // for thumbnail in block library
  }
}
```

### Saved Blocks UI
- Accessible from the left panel "Blocks" tab → "Saved" sub-tab
- Sections: "My blocks" (personal) and "Team blocks" (shared)
- Each saved block shows: thumbnail preview, name, creator, tags
- Click to insert at cursor position as a **snapshot copy** — fully editable after insertion, no link to the original
- Search and tag filter within the saved blocks panel
- Right-click → Rename, Delete (personal), or Report to admin (shared)
- Admins can delete any shared block

### Flow: Saving a Block
1. User right-clicks any block in the canvas → "Save as reusable block"
2. Modal: Name + description + visibility toggle (Personal / Share with team) + tags
3. Saved — appears immediately in the "Saved" panel tab

---

---

## 18. Browser Compatibility

### Support Matrix

| Browser | Minimum Version | Notes |
|---|---|---|
| Chrome | 90+ (Apr 2021) | Full support |
| Firefox | 88+ (Apr 2021) | Full support |
| Safari | 14+ (Sep 2020) | Full support; Safari 13 excluded (no ES2020 optional chaining) |
| Edge | 90+ (Apr 2021) | Chromium-based, matches Chrome |
| Mobile Safari (iOS) | iOS 14+ | Full support |
| Chrome Android | Last 4 versions | Full support |
| Samsung Internet | 14+ | Full support |
| **IE 11** | ❌ Not supported | React 18 dropped IE support; not a viable target for modern component libraries |

This covers **~98%+ of global browser usage** as of 2025 and is the standard floor for all major React libraries (MUI, Radix, Chakra). IE11 is not supported — it was retired by Microsoft in June 2022.

### Compatibility Implementation Rules
- **No IE-only polyfills** — no `babel-polyfill` for IE, keeps bundle lean
- **CSS**: Use `@supports` guards for cutting-edge CSS; avoid IE-specific hacks
- **JS**: Target `ES2020` in tsup build config — natively supported by all listed browsers
- **Flexbox & Grid**: Both safe on all targets; no float-based layouts
- **CSS Variables (`--custom-props`)**: Safe on all targets (IE excluded)
- **ResizeObserver, IntersectionObserver**: Safe on all targets with no polyfill needed
- **Canvas API** (for thumbnails): Safe on all targets
- **`<iframe srcdoc>`** (preview): Safe on all targets
- **Clipboard API** (`navigator.clipboard.writeText`): Available on all targets over HTTPS; graceful fallback via `document.execCommand('copy')` for HTTP

### Email Output Compatibility (separate from library browser support)
The HTML files exported by RETM Library must render correctly in email clients, which is a separate and much harder compatibility challenge:

| Client | Rendering Engine | Support Strategy |
|---|---|---|
| Gmail (web) | WebKit-based | Inline CSS, no `<style>` blocks |
| Outlook 2016–2021 | Microsoft Word engine | Table-based layout + MSO VML |
| Outlook 365 (web) | WebKit | Inline CSS |
| Apple Mail | WebKit | Full modern CSS support |
| iOS Mail | WebKit | Responsive with media queries |
| Android Gmail | WebKit | Responsive with media queries |
| Samsung Mail | WebKit | Limited media query support |
| Yahoo Mail | WebKit | Inline CSS required |

Strategies applied on HTML export:
- All CSS inlined via `juice`
- Table-based layout wrapper (required for Outlook Word engine)
- MSO conditional comments for Outlook background images
- `mso-hide:all` on elements Outlook should skip
- Media queries in a `<style>` block for responsive behavior (safe for WebKit clients)
- `max-width: 600px` container — the universal email safe width

---

## 19. Theming System

RETM Library uses a **three-tier theming model**: choose a built-in theme, override specific tokens, or go fully headless.

### Tier 1 — Built-in Theme (default)
```jsx
<EmailTemplatePanel theme="default" />
```
Ships with 6 pre-defined themes (see Section 20). The `default` theme is used if no `theme` prop is passed.

### Tier 2 — CSS Variable Overrides
Any built-in theme can be customized by overriding specific design tokens. These map 1:1 to CSS custom properties scoped under `.retm-library-root`:

```jsx
<EmailTemplatePanel
  theme="default"
  themeOverride={{
    "--ec-primary":        "#7c3aed",   // primary action color (buttons, active states)
    "--ec-primary-hover":  "#6d28d9",
    "--ec-accent":         "#f59e0b",   // chip highlight, badges
    "--ec-bg":             "#ffffff",   // panel background
    "--ec-bg-secondary":   "#f9fafb",   // sidebar, toolbar backgrounds
    "--ec-bg-tertiary":    "#f3f4f6",   // canvas background
    "--ec-border":         "#e5e7eb",   // all border colors
    "--ec-text":           "#111827",   // primary text
    "--ec-text-secondary": "#6b7280",   // labels, meta text
    "--ec-radius":         "8px",       // base border radius
    "--ec-radius-sm":      "4px",
    "--ec-radius-lg":      "12px",
    "--ec-font":           "'Inter', sans-serif",
    "--ec-font-mono":      "'Fira Code', monospace",  // code view
    "--ec-shadow":         "0 1px 3px rgba(0,0,0,0.08)",
  }}
/>
```

For Tailwind-based projects, a config preset synchronizes these tokens with Tailwind's design system:
```js
// tailwind.config.js
module.exports = {
  presets: [require('retm-library/tailwind-preset')],
  // retm-library tokens become available as Tailwind utilities
  // e.g. bg-ec-primary, text-ec-secondary, rounded-ec
}
```

### Tier 3 — Headless Mode
Zero styles are shipped. The developer owns all CSS completely. RETM Library only renders semantic HTML structure with stable `data-ec-*` attributes for targeting:
```jsx
<EmailTemplatePanel headless={true} />
```
```css
/* Developer's own stylesheet */
[data-ec-panel]          { /* outer dialog wrapper */ }
[data-ec-toolbar]        { /* top toolbar */ }
[data-ec-sidebar]        { /* left blocks/variables panel */ }
[data-ec-canvas]         { /* email canvas area */ }
[data-ec-properties]     { /* right properties panel */ }
[data-ec-var-chip]       { /* variable token chips in editor */ }
[data-ec-block]          { /* each content block */ }
[data-ec-block-selected] { /* currently selected block */ }
```
Headless mode is for teams with a strict design system who want RETM Library's logic with their own visual language entirely.

---

## 20. Pre-Defined UI Themes

Six themes ship with the library, selectable in code via the `theme` prop and also switchable by the operation team in the UI settings panel.

### Theme 1: `"default"` — Clean Professional
Inspired by Linear, Notion, and modern SaaS dashboards. Neutral grays, subtle borders, clean whitespace. The safest choice for enterprise tools.
- Background: `#ffffff` / `#f9fafb`
- Primary: `#2563eb` (blue)
- Typography: Inter / system-ui
- Radius: `8px` — rounded but not bubbly
- Borders: thin `0.5px` solid `#e5e7eb`

### Theme 2: `"dark"` — Dark Mode First
Full dark mode UI. Inspired by VS Code, Vercel dashboard, Raycast. Comfortable for long editing sessions.
- Background: `#0f172a` / `#1e293b`
- Primary: `#3b82f6`
- Typography: Inter
- Radius: `8px`
- Borders: `#334155`

### Theme 3: `"minimal"` — Ultra-clean Whitespace
Inspired by Stripe Docs, Apple HIG, Linear's minimal mode. Maximum whitespace, almost invisible UI chrome. The content is all that matters.
- Background: `#ffffff`
- Primary: `#000000`
- Accents: extremely sparing use of color
- Typography: `system-ui` / `-apple-system`
- Radius: `4px` — near-square
- Borders: `1px solid #f0f0f0` (barely visible)

### Theme 4: `"editorial"` — Magazine / Publishing
Inspired by Substack, Ghost, editorial CMS tools. Serif headings, warm tones, generous leading. Best for content-heavy email workflows.
- Background: `#fffdf7` (warm white)
- Primary: `#b45309` (warm amber-brown)
- Typography: `'Georgia', serif` headings + `'Inter'` body
- Radius: `6px`
- Borders: `#e7e0d5`

### Theme 5: `"brutalist"` — High Contrast Bold
Inspired by shadcn/ui default, Panda CSS, and neo-brutalist web trends. High contrast, thick borders, zero subtlety. Visually distinctive.
- Background: `#ffffff`
- Primary: `#000000`
- Accent: `#facc15` (yellow)
- Typography: `'Space Grotesk'` or `system-ui`
- Radius: `0px` — sharp corners everywhere
- Borders: `2px solid #000000`
- Shadows: `4px 4px 0 #000` (offset hard shadow)

### Theme 6: `"glassmorphism"` — Frosted Glass Modern
Inspired by macOS Ventura, iOS 16+, and recent design trends. Translucent panels, blur backdrops, subtle gradients. Works best over a colored app background.
- Background: `rgba(255,255,255,0.7)` with `backdrop-filter: blur(12px)`
- Primary: `#6366f1` (indigo)
- Typography: Inter
- Radius: `16px` — very rounded
- Borders: `1px solid rgba(255,255,255,0.3)`
- Shadows: `0 8px 32px rgba(31,38,135,0.15)`

### Theme Switching in UI
Operation team members can switch themes from the panel settings:
```
⚙ Settings → Appearance → Theme
[Default] [Dark] [Minimal] [Editorial] [Brutalist] [Glass]
```
The selected theme is stored in the user's localStorage preference (not the template — templates are theme-agnostic).

---

## 21. EmailTemplateViewer — Read-Only Component

A completely separate, lightweight component for internal staff (sales, support, managers) to browse published templates without any create/edit/delete capabilities.

### What It Shows
- Only templates with `status: "published"` — no drafts, no archived
- No editor, no variable panel, no block controls
- No create, edit, delete, duplicate, or move buttons
- No export button (optional: controlled via `allowCopy` prop)

### Layout
```
┌─────────────────────────────────────────────────────────┐
│  RETM Library Templates          [🔍 Search]  [EN ▼] [🏷 Tags] │
├──────────────┬──────────────────────────────────────────┤
│  📁 Folders  │  [Welcome Email]  [Order Confirm]  [...]  │
│  ─ All (8)   │                                          │
│  ─ Onboard.  │  Click a template to open the viewer ↓   │
│  ─ Orders    │                                          │
└──────────────┴──────────────────────────────────────────┘

Template selected → opens split-view:
┌────────────────────────────────────────────────────────┐
│  Welcome Email         [EN] [AR]    [Preview] [Code]   │
├────────────────────────────────────────────────────────┤
│                                                        │
│  PREVIEW TAB:           │  CODE TAB:                   │
│  Live rendered email    │  Syntax-highlighted HTML      │
│  (sandboxed iframe,     │  with line numbers            │
│   plain HTML with       │  Copy button top-right        │
│   sample data)          │  Language: HTML               │
│                         │                              │
└────────────────────────────────────────────────────────┘
```

### Code View Specification
- Syntax-highlighted HTML using **Shiki** (same highlighter used by Vite docs, Astro, shadcn)
- Line numbers in the gutter
- Language badge: `HTML`
- Theme follows the panel theme (dark panel = dark code theme, e.g. `github-dark`; light panel = `github-light`)
- **Copy button** top-right corner: copies the full production HTML to clipboard, fires `onCopy` callback
- Scrollable — long templates scroll within the code pane
- The copied HTML is **production format** (with token placeholders, e.g. `{{user.firstName}}`) — ready for backend injection

### Template Card in Viewer
- Thumbnail preview
- Template name
- Language pills: `EN  AR` (only populated languages shown)
- Last published date
- **No status badge** — viewer only sees published, so status is implicit
- **No 3-dot menu** — no actions available; clicking the card opens the split-view

### Props Reference
```jsx
<EmailTemplateViewer
  storageMode="backend"
  onLoad={() => api.get('/templates?status=published')}
  defaultView="grid"          // "grid" | "list"
  searchable={true}
  filterByTags={true}
  filterByLanguage={true}
  allowCopy={true}            // show/hide the copy button in code view
  codeView={{
    enabled: true,
    showLineNumbers: true,
    copyButton: true,
    defaultTab: "preview",    // "preview" | "code"
  }}
  theme="default"
  themeOverride={{}}
  headless={false}
  onCopy={(html, templateId) => {}}
/>
```

---

## 22. Responsive Email Design Rules

All templates built in RETM Library output fully responsive HTML following these enforced rules.

### Canvas Constraints
- Canvas max-width: **600px** — the universal email safe width
- All blocks are constrained to this width
- The editor canvas itself is scrollable vertically, fixed at 600px wide

### Responsive Strategy: Hybrid (Fluid + Media Queries)
Emails use a hybrid approach because different email clients support different responsive techniques:

| Technique | Support | Usage in RETM Library |
|---|---|---|
| Fluid width (% widths) | Universal | Default for single-column layouts |
| CSS Media Queries | WebKit clients (Gmail, Apple Mail, iOS) | Used for stacking columns on mobile |
| `max-width` / `min-width` | Universal | Container constraints |
| Flexbox | Not in Outlook | Avoided in export output; tables used instead |
| CSS Grid | Not in Outlook | Avoided in export output |

### Mobile Behavior Rules (applied on export)
```css
@media only screen and (max-width: 480px) {
  /* All rules are inlined as a <style> block in the <head> */
  .ec-col { display: block !important; width: 100% !important; }
  .ec-img { width: 100% !important; height: auto !important; }
  .ec-btn { width: 100% !important; text-align: center !important; }
  .ec-hide-mobile { display: none !important; }
  .ec-text { font-size: 16px !important; } /* min readable size on mobile */
  .ec-heading { font-size: 22px !important; }
}
```

### Typography Scale (Email-Safe)
| Element | Desktop | Mobile | Font Stack |
|---|---|---|---|
| Heading 1 | 28px | 22px | Georgia, Times New Roman, serif |
| Heading 2 | 22px | 18px | Georgia, Times New Roman, serif |
| Body text | 15px | 16px | Arial, Helvetica, sans-serif |
| Small / caption | 12px | 13px | Arial, Helvetica, sans-serif |
| Button | 14px | 15px | Arial, Helvetica, sans-serif |

Minimum body font size is **14px** — the editor warns if a text block is set smaller (unreadable on mobile).

### Image Rules (Email UX)
- All images require alt text — editor warns on missing alt
- Images default to `width: 100%; max-width: [set value]px` — fluid by default
- Height set to `auto` to prevent distortion
- No CSS `background-image` for content images — only `<img>` tags
- Background images on section blocks use MSO VML fallback + CSS background-image combo for Outlook compatibility

### Spacing & UX Rules
- Minimum tap target size for buttons: **44px tall** (Apple HIG / WCAG guideline)
- Minimum padding around content: **16px horizontal** on mobile
- Button width on mobile: full-width (100%) by default
- Line height minimum: `1.5` for body text (readability)
- Maximum line length: ~65 characters (~520px at 15px font) — the 600px container naturally enforces this

### Accessibility Rules (applied on export)
- `lang` attribute on `<html>` tag from template language setting
- `dir="rtl"` on `<html>` for RTL language variants
- `role="presentation"` on all layout tables (screen readers skip them)
- `alt` attribute required on all `<img>` tags (warned if missing)
- Color contrast: editor warns if text-on-background contrast ratio is below **4.5:1** (WCAG AA)
- Minimum font size: **14px** (warned below this)

---

## 17. Decisions Log

| # | Question | Decision |
|---|---|---|
| 1 | Multi-language support | ✅ Per-language variants inside one template, with RTL support for AR/HE/FA |
| 2 | Token format | ✅ Fully custom — flexible open/close delimiters, configurable per project |
| 3 | Saved Blocks | ✅ Both personal + shared with visibility controls. Snapshot copy (independent after insertion) |
| 4 | Image handling | ✅ URL-only — displayed from URL in dashed placeholder; size/align customizable |
| 5 | Attachment/file handling | ✅ URL-based — smart auto-detection by extension (.pdf, .png, .mp4, etc.) |
| 6 | Conditional blocks | ✅ IF/ELSE and FOR EACH loop blocks included |
| 7 | Storage mode | ✅ Both — backend callbacks + localStorage, hybrid mode supported |
| 8 | Permissions | ✅ Direct publish default; approval workflow scaffolded but off by default |
| 9 | Template organization | ✅ Both — folder/project tree AND flat list with tags; switchable toggle |
| 10 | Undo/Redo | ✅ Persistent — version history IS the undo system |
| 11 | HTML Export | ✅ Two modes: Production (tokens) + Plain HTML (sample data). Accessible from editor, card 3-dot menu, preview sidebar |
| 12 | Browser compatibility | ✅ Chrome/Firefox/Edge 90+, Safari 14+, iOS 14+. Covers ~98% of users. No IE11 |
| 13 | Developer theming | ✅ Three tiers: built-in theme → CSS variable overrides → full headless mode + Tailwind preset |
| 14 | Pre-defined themes | ✅ 6 themes: Default, Dark, Minimal, Editorial, Brutalist, Glassmorphism |
| 15 | Read-only viewer | ✅ Separate `<EmailTemplateViewer>` for internal staff. Published-only. Split preview/code view with Shiki syntax highlighting + copy button |
| 16 | Responsive email | ✅ Hybrid fluid + media queries. 600px canvas, table-based export, mobile stacking, WCAG AA |

---

## 23. Suggested Development Phases

### Phase 1 — Core MVP
- [ ] `<EmailTemplatePanel>` Dialog shell with library view
- [ ] TipTap editor with variable chip node
- [ ] Variable schema ingestion + side panel
- [ ] Basic blocks: Text, Image (URL), Button, Divider, Spacer
- [ ] Token format system (handlebars / custom)
- [ ] HTML export with CSS inlining (`juice`) — production + plain modes
- [ ] Local storage persistence
- [ ] Desktop/Mobile canvas preview
- [ ] Default + Dark themes
- [ ] CSS variable override system

### Phase 2 — Full Feature
- [ ] All block types including layout columns
- [ ] Conditional blocks (if/else) + Loop blocks (for each)
- [ ] Attachment/file link system with URL auto-detection
- [ ] Backend storage callbacks + hybrid mode
- [ ] Validation system + pre-export warning modal
- [ ] Metadata / SEO panel (subject, preheader, tags)
- [ ] Persistent version history (undo/redo via versions)
- [ ] Multi-language per-template + RTL canvas flip
- [ ] Template folders + flat tag filter mode
- [ ] `<EmailTemplateViewer>` read-only component with code view (Shiki)
- [ ] All 6 pre-defined themes
- [ ] Tailwind config preset

### Phase 3 — Polish & Advanced
- [ ] Template library card thumbnails (rendered HTML snapshots)
- [ ] Dark mode email preview
- [ ] Plain text email preview
- [ ] Test send callback
- [ ] Role-based permissions UI (editor vs admin)
- [ ] Saved Blocks Library (personal + shared, snapshot copy)
- [ ] Headless mode (`headless={true}`) with full `data-ec-*` attribute coverage
- [ ] Approval workflow activation (`publishMode="approval"`)
- [ ] Diff view in version history
- [ ] WCAG contrast checker in editor

---

*Last updated: 2026 | RETM Library Spec v1.4*
