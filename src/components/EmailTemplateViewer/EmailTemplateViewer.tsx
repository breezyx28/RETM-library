import { useEffect, useMemo, useState } from 'react'
import type { EmailTemplateViewerProps } from './EmailTemplateViewer.types'
import type { Template } from '../../types'
import { ThemeRoot } from '../../lib/theme'
import { createAdapter } from '../../lib/storage'
import { formatRelative } from '../../lib/utils/date'

/**
 * `<EmailTemplateViewer>` — read-only browser for published templates
 * (spec §3.2, §21).
 */
export function EmailTemplateViewer(props: EmailTemplateViewerProps) {
  const {
    storageMode = 'local',
    storageKey,
    onLoad,
    defaultView = 'list',
    searchable = true,
    filterByTags = false,
    filterByLanguage = false,
    codeView,
    allowCopy = true,
    onCopy,
    theme = 'default',
    themeOverride,
    headless = false,
    className,
  } = props

  const adapter = useMemo(
    () =>
      createAdapter({
        mode: storageMode,
        storageKey,
        callbacks: { onLoad },
      }),
    [storageMode, storageKey, onLoad],
  )

  const [templates, setTemplates] = useState<Template[]>([])
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null)
  const [tab, setTab] = useState<'preview' | 'code'>(codeView?.defaultTab ?? 'preview')
  const [viewport, setViewport] = useState<'desktop' | 'mobile'>('desktop')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [languageFilter, setLanguageFilter] = useState('')
  const [tagFilter, setTagFilter] = useState('')
  const [activeLanguage, setActiveLanguage] = useState<string>('en')
  const [copyState, setCopyState] = useState<'idle' | 'ok' | 'error'>('idle')
  const [codeHtml, setCodeHtml] = useState<string>('')

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        setLoading(true)
        const items = (await adapter.list())
          .filter((template) => template.status === 'published')
          .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        if (!mounted) return
        setTemplates(items)
        setActiveTemplateId(items[0]?.id ?? null)
        setActiveLanguage(items[0]?.defaultLanguage ?? 'en')
        setError(null)
      } catch (e) {
        if (!mounted) return
        setError((e as Error).message)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    void load()
    return () => {
      mounted = false
    }
  }, [adapter])

  const activeTemplate = useMemo(
    () => templates.find((t) => t.id === activeTemplateId) ?? templates[0] ?? null,
    [templates, activeTemplateId],
  )
  const selectedLanguage =
    activeTemplate && activeTemplate.languages[activeLanguage]
      ? activeLanguage
      : activeTemplate?.defaultLanguage ?? 'en'
  const activeVariant = activeTemplate?.languages?.[selectedLanguage]
  const html = activeVariant?.html ?? ''
  const allTags = useMemo(() => {
    const tags = new Set<string>()
    templates.forEach((t) => (t.tags ?? []).forEach((tag) => tags.add(tag)))
    return Array.from(tags).sort()
  }, [templates])
  const allLanguages = useMemo(() => {
    const langs = new Set<string>()
    templates.forEach((t) => Object.keys(t.languages).forEach((lang) => langs.add(lang)))
    return Array.from(langs).sort()
  }, [templates])

  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      const q = query.trim().toLowerCase()
      if (q) {
        const haystack = `${template.name} ${(template.tags ?? []).join(' ')}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      if (languageFilter && !template.languages[languageFilter]) return false
      if (tagFilter && !(template.tags ?? []).includes(tagFilter)) return false
      return true
    })
  }, [templates, query, languageFilter, tagFilter])

  useEffect(() => {
    if (!filteredTemplates.some((t) => t.id === activeTemplateId)) {
      setActiveTemplateId(filteredTemplates[0]?.id ?? null)
      setActiveLanguage(filteredTemplates[0]?.defaultLanguage ?? 'en')
    }
  }, [filteredTemplates, activeTemplateId])

  useEffect(() => {
    let cancelled = false
    const enabled = codeView?.enabled !== false
    if (!enabled || !html) {
      setCodeHtml('')
      return
    }
    const run = async () => {
      try {
        const shiki = await import('shiki')
        const themed = await shiki.codeToHtml(html, {
          lang: 'html',
          theme: theme === 'dark' ? 'github-dark' : 'github-light',
        })
        if (!cancelled) setCodeHtml(themed)
      } catch {
        if (!cancelled) setCodeHtml('')
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [html, theme, codeView?.enabled])

  const onCopyCode = async () => {
    if (!activeTemplate || !html) return
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(html)
      } else {
        const ta = document.createElement('textarea')
        ta.value = html
        ta.setAttribute('readonly', 'true')
        ta.style.position = 'fixed'
        ta.style.opacity = '0'
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
      }
      onCopy?.(html, activeTemplate.id)
      setCopyState('ok')
      window.setTimeout(() => setCopyState('idle'), 1500)
    } catch {
      setCopyState('error')
      window.setTimeout(() => setCopyState('idle'), 1500)
    }
  }

  return (
    <ThemeRoot
      theme={theme}
      themeOverride={themeOverride}
      headless={headless}
      className={className}
      dataScope="viewer"
    >
      <div data-ec-viewer="">
        <div data-ec-viewer-controls="">
          {searchable ? (
            <input
              data-ec-input=""
              placeholder="Search templates..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          ) : null}
          {filterByLanguage ? (
            <select
              data-ec-input=""
              value={languageFilter}
              onChange={(e) => setLanguageFilter(e.target.value)}
            >
              <option value="">All languages</option>
              {allLanguages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang.toUpperCase()}
                </option>
              ))}
            </select>
          ) : null}
          {filterByTags ? (
            <select
              data-ec-input=""
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
            >
              <option value="">All tags</option>
              {allTags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          ) : null}
        </div>
        <div data-ec-viewer-shell="">
          <aside data-ec-viewer-list="" data-ec-view={defaultView}>
            <h3 data-ec-h3="">Templates</h3>
            {filteredTemplates.map((template) => (
              <button
                key={template.id}
                type="button"
                data-ec-viewer-item=""
                data-ec-active={activeTemplate?.id === template.id ? '' : undefined}
                onClick={() => {
                  setActiveTemplateId(template.id)
                  setActiveLanguage(template.defaultLanguage)
                }}
              >
                <strong>{template.name}</strong>
                <span>
                  {Object.keys(template.languages)
                    .map((lang) => lang.toUpperCase())
                    .join(' · ')}
                </span>
                <span>Updated {formatRelative(template.updatedAt)}</span>
              </button>
            ))}
            {!filteredTemplates.length && !error ? (
              <p data-ec-empty-msg="">{loading ? 'Loading templates...' : 'No templates found.'}</p>
            ) : null}
            {error ? (
              <p data-ec-alert="" data-ec-variant="error" role="alert">
                {error}
              </p>
            ) : null}
          </aside>

          <section data-ec-viewer-main="">
            <header data-ec-viewer-toolbar="">
              <div data-ec-viewer-tabs="">
                <button
                  type="button"
                  data-ec-btn=""
                  data-ec-variant={tab === 'preview' ? 'primary' : 'ghost'}
                  onClick={() => setTab('preview')}
                >
                  Preview
                </button>
                <button
                  type="button"
                  data-ec-btn=""
                  data-ec-variant={tab === 'code' ? 'primary' : 'ghost'}
                  onClick={() => setTab('code')}
                >
                  Code
                </button>
              </div>
              <div data-ec-viewer-languages="">
                {activeTemplate
                  ? Object.keys(activeTemplate.languages).map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        data-ec-btn=""
                        data-ec-variant={
                          lang === selectedLanguage ? 'primary' : 'ghost'
                        }
                        onClick={() => setActiveLanguage(lang)}
                      >
                        {lang.toUpperCase()}
                      </button>
                    ))
                  : null}
              </div>
              <div data-ec-viewer-actions="">
                <button type="button" data-ec-btn="" onClick={() => setViewport('desktop')}>
                  Desktop
                </button>
                <button type="button" data-ec-btn="" onClick={() => setViewport('mobile')}>
                  Mobile
                </button>
                {allowCopy && codeView?.copyButton !== false && codeView?.enabled !== false ? (
                  <button
                    type="button"
                    data-ec-btn=""
                    onClick={() => void onCopyCode()}
                    disabled={!html}
                  >
                    {copyState === 'ok'
                      ? 'Copied'
                      : copyState === 'error'
                        ? 'Copy failed'
                        : 'Copy HTML'}
                  </button>
                ) : null}
              </div>
            </header>

            {tab === 'preview' ? (
              <div data-ec-viewer-preview="">
                <iframe
                  title="Template preview"
                  sandbox="allow-same-origin"
                  srcDoc={html || '<p style="font-family:Arial,sans-serif;padding:16px;">No HTML to preview.</p>'}
                  data-ec-viewer-frame=""
                  style={{ width: viewport === 'mobile' ? 375 : '100%' }}
                />
              </div>
            ) : (
              <div data-ec-viewer-code-wrap="">
                <div data-ec-viewer-code-head="">
                  <span data-ec-lang-pill="">HTML</span>
                </div>
                {codeHtml ? (
                  <div
                    data-ec-viewer-code=""
                    data-ec-lines={codeView?.showLineNumbers !== false ? '' : undefined}
                    dangerouslySetInnerHTML={{ __html: codeHtml }}
                  />
                ) : (
                  <pre data-ec-viewer-code="">
                    <code>
                      {(html || '<!-- No exported HTML available -->')
                        .split('\n')
                        .map((line, idx) =>
                          codeView?.showLineNumbers === false ? (
                            line + (idx < (html || '').split('\n').length - 1 ? '\n' : '')
                          ) : (
                            <span key={idx} data-ec-code-line="">
                              {line}
                              {'\n'}
                            </span>
                          ),
                        )}
                    </code>
                  </pre>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </ThemeRoot>
  )
}
