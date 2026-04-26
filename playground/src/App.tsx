import { useState } from 'react'
import {
  EmailTemplatePanel,
  EmailTemplateViewer,
  type ThemeName,
  type VariableSchema,
} from 'retm-library'

/**
 * Sample variable schema drawn from retm-library-spec.md §4.
 */
const variableSchema: VariableSchema = [
  {
    group: 'User',
    color: '#3b82f6',
    variables: [
      { key: 'user.firstName', label: 'First Name', type: 'string', required: true, sample: 'John' },
      { key: 'user.lastName', label: 'Last Name', type: 'string', required: true, sample: 'Doe' },
      { key: 'user.email', label: 'Email', type: 'string', sample: 'john@example.com' },
      { key: 'user.avatarUrl', label: 'Avatar', type: 'image', sample: 'https://i.pravatar.cc/96' },
    ],
  },
  {
    group: 'Job',
    color: '#10b981',
    variables: [
      { key: 'job.title', label: 'Job Title', type: 'string', sample: 'Software Engineer' },
      { key: 'job.company', label: 'Company', type: 'string', sample: 'Acme Corp' },
    ],
  },
  {
    group: 'Order',
    color: '#f59e0b',
    variables: [
      { key: 'order.id', label: 'Order ID', type: 'string', required: true, sample: '#12345' },
      { key: 'order.total', label: 'Total', type: 'currency', required: true, sample: '$99.99' },
      { key: 'order.invoiceUrl', label: 'Invoice', type: 'file', sample: 'https://example.com/invoice.pdf' },
    ],
  },
]

const THEMES: ThemeName[] = ['default', 'dark']

export default function App() {
  const [theme, setTheme] = useState<ThemeName>('default')
  const [overridePrimary, setOverridePrimary] = useState(false)
  const [headless, setHeadless] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <div className="pg-shell" data-pg-theme={theme}>
      <header className="pg-header">
        <h1>RETM Library Playground</h1>
        <p>
          Library view, inline and dialog-mounted editor, storage round-trip,
          themes, and the read-only template viewer demo.
        </p>
        <div className="pg-controls">
          <label className="pg-ctrl">
            <span>Theme</span>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value as ThemeName)}
            >
              {THEMES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>

          <label className="pg-ctrl">
            <input
              type="checkbox"
              checked={overridePrimary}
              onChange={(e) => setOverridePrimary(e.target.checked)}
            />
            <span>Override primary (violet)</span>
          </label>

          <label className="pg-ctrl">
            <input
              type="checkbox"
              checked={headless}
              onChange={(e) => setHeadless(e.target.checked)}
            />
            <span>Headless mode</span>
          </label>
        </div>
      </header>

      <section className="pg-section">
        <div className="pg-section-head">
          <h2>Dialog mode</h2>
          <button
            type="button"
            className="pg-btn"
            onClick={() => setDialogOpen(true)}
          >
            Open dialog
          </button>
        </div>
        <p className="pg-muted">
          Controlled open state via <code>open</code> + <code>onOpenChange</code>.
          The trigger slot is also supported (uncontrolled).
        </p>
        <EmailTemplatePanel
          variableSchema={variableSchema}
          tokenFormat="handlebars"
          storageMode="local"
          storageKey="retm-library:playground:dialog"
          supportedLanguages={['en', 'ar']}
          defaultLanguage="en"
          rtlLanguages={['ar', 'he', 'fa']}
          userRole="admin"
          publishMode="direct"
          organizationMode="both"
          theme={theme}
          headless={headless}
          themeOverride={overridePrimary ? { '--ec-primary': '#7c3aed', '--ec-primary-hover': '#6d28d9' } : undefined}
          asDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          sampleData={{
            user: { firstName: 'John', lastName: 'Doe' },
            job: { title: 'Software Engineer', company: 'Acme Corp' },
            order: { id: '#12345', total: '$99.99' },
          }}
          onExport={(payload) => {
            console.log('[playground] onExport', payload)
          }}
          onSave={(t) => {
            console.log('[playground] onSave', t.id, t.name)
          }}
        />
      </section>

      <section className="pg-section">
        <div className="pg-section-head">
          <h2>Inline mode</h2>
        </div>
        <p className="pg-muted">
          Embedded full-surface panel, no modal wrapping. Shares storage with
          the viewer section below so drafts appear in the list when enabled.
        </p>
        <EmailTemplatePanel
          variableSchema={variableSchema}
          tokenFormat="handlebars"
          storageMode="local"
          storageKey="retm-library:playground:inline"
          defaultLanguage="en"
          theme={theme}
          headless={headless}
          themeOverride={overridePrimary ? { '--ec-primary': '#7c3aed', '--ec-primary-hover': '#6d28d9' } : undefined}
          asDialog={false}
        />
      </section>

      <section className="pg-section">
        <div className="pg-section-head">
          <h2>EmailTemplateViewer</h2>
        </div>
        <p className="pg-muted">
          Template list with preview and code tabs (Shiki), viewport toggle, and
          optional inclusion of drafts from the inline editor.
        </p>
        <EmailTemplateViewer
          storageMode="local"
          storageKey="retm-library:playground:inline"
          defaultView="grid"
          includeNonPublished
          exportContext={{
            variableSchema,
            tokenFormat: 'handlebars',
            sampleData: {
              user: { firstName: 'John', lastName: 'Doe' },
              job: { title: 'Software Engineer', company: 'Acme Corp' },
              order: { id: '#12345', total: '$99.99' },
            },
          }}
          codeView={{ enabled: true, defaultTab: 'preview' }}
          theme={theme}
          headless={headless}
          themeOverride={overridePrimary ? { '--ec-primary': '#7c3aed' } : undefined}
        />
      </section>
    </div>
  )
}
