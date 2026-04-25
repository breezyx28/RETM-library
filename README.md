# RETM Library

Embeddable React component library for visual email template management.

Ships two components:

- **`<EmailTemplatePanel>`** — full authoring surface for operation/admin teams: library view, visual editor, variable chips, block DnD, HTML export.
- **`<EmailTemplateViewer>`** — read-only browser for internal staff (sales, support) to browse published templates with a split preview/code view.

> Status: scaffolding complete. See [retm-library-spec.md](./retm-library-spec.md) for the full product spec.

---

## Install

```bash
npm install retm-library
```

Peer dependencies: `react >= 18`, `react-dom >= 18`.

Import the default stylesheet once at your app root:

```ts
import 'retm-library/styles.css'
```

## Quick start

```tsx
import { EmailTemplatePanel, type VariableSchema } from 'retm-library'
import 'retm-library/styles.css'

const variableSchema: VariableSchema = [
  {
    group: 'User',
    color: '#3b82f6',
    variables: [
      { key: 'user.firstName', label: 'First Name', type: 'string', required: true, sample: 'John' },
      { key: 'user.lastName',  label: 'Last Name',  type: 'string', required: true, sample: 'Doe'  },
    ],
  },
]

export default function App() {
  return (
    <EmailTemplatePanel
      variableSchema={variableSchema}
      tokenFormat="handlebars"
      storageMode="local"
      theme="default"
      onExport={(payload) => console.log(payload)}
    />
  )
}
```

Read-only viewer for published templates:

```tsx
import { EmailTemplateViewer } from 'retm-library'

<EmailTemplateViewer
  storageMode="backend"
  onLoad={() => fetch('/api/templates?status=published').then(r => r.json())}
  defaultView="grid"
  codeView={{ enabled: true, showLineNumbers: true, copyButton: true }}
/>
```

See spec sections §3.1 and §3.2 for the full prop reference.

---

## Local development

```bash
# install library deps
npm install

# install playground deps
npm --prefix playground install

# run playground (Vite, aliased to live src/)
npm run playground

# build library (dist/ with ESM + CJS + .d.ts)
npm run build

# typecheck
npm run typecheck
```

The playground at [playground/src/App.tsx](./playground/src/App.tsx) mounts both components with a sample schema and hot-reloads against the library source via a Vite alias — no rebuild step needed while iterating.

---

## Release workflow

RETM Library uses a Changesets-based release flow.

```bash
# 1) Create release note and bump intent
npm run changeset

# 2) Apply version/changelog updates
npm run version-packages

# 3) Publish (usually done by CI release workflow)
npm run release
```

On every push to the default branch configured in `.github/workflows/release.yml`, the release workflow can open/update a release PR and publish when merged, if `NPM_TOKEN` is configured.

Required GitHub repository secrets:

- `NPM_TOKEN`: npm automation token with publish access to `retm-library`

### Versioning policy

- `patch`: bug fixes and non-breaking internal improvements
- `minor`: backward-compatible feature additions
- `major`: breaking API or behavior changes

---

## Integration notes

### CSS and themes

- Import `retm-library/styles.css` once in your app root.
- Theme tokens are CSS variables prefixed with `--ec-*` and can be overridden in host app CSS. Styles are scoped under the root wrapper class **`.retm-library-root`** (applied by the library unless `headless={true}`).
- Tailwind consumers can extend tokens via `retm-library/tailwind-preset`.

### Next.js / SSR

- `EmailTemplatePanel` and `EmailTemplateViewer` are interactive client components; in Next.js App Router, mount them in `"use client"` components.
- Keep export/storage callbacks in client-safe boundaries or pass API-bound callbacks from client hooks.

### Backend callback contracts

- `onLoad`: returns a list of templates (or template-specific loaders, based on selected storage mode).
- `onSave`: persists template payload updates from editor actions.
- `onPublish`: final publish action for review/approval flows.

For detailed field shape, use exported TypeScript types from `retm-library`.

---

## Project structure

```
retm-library/
  src/
    index.ts                       public barrel
    components/
      EmailTemplatePanel/          authoring surface (spec §3.1, §6)
      EmailTemplateViewer/         read-only browser  (spec §3.2, §21)
    types/                         VariableSchema, Template, Token, Theme
    styles/tokens.css              --ec-* CSS variables (spec §19)
    utils/
  playground/                      local Vite dev app
  retm-library-spec.md             full product spec
```

---

## Browser support

Chrome / Firefox / Edge 90+, Safari 14+, iOS 14+. IE11 is not supported. See spec §18 for details.

## License

MIT
