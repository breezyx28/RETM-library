import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Code2,
  Copy,
  Eye,
  FileText,
  Monitor,
  Smartphone,
} from 'lucide-react'
import type { EmailTemplateViewerProps } from './EmailTemplateViewer.types'
import type { Template } from '../../types'
import { ThemeRoot } from '../../lib/theme'
import { createAdapter } from '../../lib/storage'
import { formatRelative } from '../../lib/utils/date'
import { exportTemplate, htmlToPlainText } from '../../lib/export'
import { migrateEditorJson } from '../../lib/types/editorDocument'
import { EC_LOCAL_TEMPLATES_CHANGED } from '../../lib/storage/localTemplateEvents'

type ViewerTab = 'preview' | 'code' | 'plain'

/**
 * `<EmailTemplateViewer>` — read-only browser for stored templates
 * (published by default; optional drafts via `includeNonPublished`) (spec §3.2, §21).
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
    includeNonPublished = false,
    exportContext,
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
  const [tab, setTab] = useState<ViewerTab>(() => {
    const d = codeView?.defaultTab
    if (d === 'code' || d === 'plain' || d === 'preview') return d
    return 'preview'
  })
  const [viewport, setViewport] = useState<'desktop' | 'mobile'>('desktop')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [languageFilter, setLanguageFilter] = useState('')
  const [tagFilter, setTagFilter] = useState('')
  const [activeLanguage, setActiveLanguage] = useState<string>('en')
  const [copyState, setCopyState] = useState<'idle' | 'ok' | 'error'>('idle')
  const [plainCopyState, setPlainCopyState] = useState<'idle' | 'ok' | 'error'>('idle')
  const [codeHtml, setCodeHtml] = useState<string>('')

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const raw = await adapter.list()
      const items = (includeNonPublished
        ? raw.filter((t) => t.status === 'published' || t.status === 'draft')
        : raw.filter((template) => template.status === 'published')
      ).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      setTemplates(items)
      setActiveTemplateId((cur) =>
        cur && items.some((t) => t.id === cur) ? cur : items[0]?.id ?? null,
      )
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [adapter, includeNonPublished])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (storageMode !== 'local' || !storageKey) return
    const handler = (ev: Event) => {
      const ce = ev as CustomEvent<{ storageKey?: string }>
      if (ce.detail?.storageKey === storageKey) void load()
    }
    window.addEventListener(EC_LOCAL_TEMPLATES_CHANGED, handler as EventListener)
    const onStorage = (e: StorageEvent) => {
      if (e.key === storageKey) void load()
    }
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener(EC_LOCAL_TEMPLATES_CHANGED, handler as EventListener)
      window.removeEventListener('storage', onStorage)
    }
  }, [storageMode, storageKey, load])

  const activeTemplate = useMemo(
    () => (activeTemplateId ? templates.find((t) => t.id === activeTemplateId) ?? null : null),
    [templates, activeTemplateId],
  )

  const selectedLanguage =
    activeTemplate && activeTemplate.languages[activeLanguage]
      ? activeLanguage
      : activeTemplate?.defaultLanguage ?? 'en'

  const resolved = useMemo(() => {
    if (!activeTemplate) {
      return { iframeHtml: '', codeHtml: '', plainText: '' }
    }
    const v = activeTemplate.languages[selectedLanguage]
    if (!v) {
      return { iframeHtml: '', codeHtml: '', plainText: '' }
    }

    const rawJson = v.editorJson
    const hasJson =
      rawJson != null &&
      typeof rawJson === 'object' &&
      Object.keys(rawJson as object).length > 0

    if (exportContext && hasJson) {
      try {
        const document = migrateEditorJson(rawJson)
        const input = {
          templateId: activeTemplate.id,
          templateName: activeTemplate.name,
          language: selectedLanguage,
          subject: v.subject ?? '',
          preheader: v.preheader,
          tags: activeTemplate.tags,
          createdAt: activeTemplate.createdAt,
          updatedAt: activeTemplate.updatedAt,
          document,
          variableSchema: exportContext.variableSchema,
          tokenFormat: exportContext.tokenFormat,
          customTokenFormat: exportContext.customTokenFormat,
          sampleData: exportContext.sampleData,
          rtl: activeTemplate.rtl,
        }
        const plain = exportTemplate(input, 'plain').html
        const prod = exportTemplate(input, 'production').html
        return {
          iframeHtml: plain,
          codeHtml: prod,
          plainText: htmlToPlainText(plain),
        }
      } catch {
        /* fall through */
      }
    }

    const stored = (v.html ?? '').trim()
    return {
      iframeHtml: stored,
      codeHtml: stored,
      plainText: stored ? htmlToPlainText(stored) : '',
    }
  }, [activeTemplate, selectedLanguage, exportContext])

  const iframeHtml = resolved.iframeHtml
  const codeSource = resolved.codeHtml
  const plainBody = resolved.plainText

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
    if (!activeTemplateId) return
    if (!filteredTemplates.some((t) => t.id === activeTemplateId)) {
      const next = filteredTemplates[0]
      setActiveTemplateId(next?.id ?? null)
      if (next) setActiveLanguage(next.defaultLanguage ?? 'en')
    }
  }, [filteredTemplates, activeTemplateId])

  useEffect(() => {
    const t = activeTemplateId ? templates.find((x) => x.id === activeTemplateId) : null
    if (!t) return
    setActiveLanguage((lang) => (t.languages[lang] ? lang : t.defaultLanguage))
  }, [activeTemplateId, templates])

  useEffect(() => {
    let cancelled = false
    const enabled = codeView?.enabled !== false
    if (!enabled || tab !== 'code' || !codeSource.trim()) {
      setCodeHtml('')
      return
    }
    const run = async () => {
      try {
        const shiki = await import('shiki')
        const themed = await shiki.codeToHtml(codeSource, {
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
  }, [codeSource, theme, codeView?.enabled, tab])

  const onCopyCode = async () => {
    if (!activeTemplate || !codeSource.trim()) return
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(codeSource)
      } else {
        const ta = document.createElement('textarea')
        ta.value = codeSource
        ta.setAttribute('readonly', 'true')
        ta.style.position = 'fixed'
        ta.style.opacity = '0'
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
      }
      onCopy?.(codeSource, activeTemplate.id)
      setCopyState('ok')
      window.setTimeout(() => setCopyState('idle'), 1500)
    } catch {
      setCopyState('error')
      window.setTimeout(() => setCopyState('idle'), 1500)
    }
  }

  const onCopyPlain = async () => {
    if (!activeTemplate || !plainBody.trim()) return
    try {
      await navigator.clipboard.writeText(plainBody)
      setPlainCopyState('ok')
      window.setTimeout(() => setPlainCopyState('idle'), 1500)
    } catch {
      setPlainCopyState('error')
      window.setTimeout(() => setPlainCopyState('idle'), 1500)
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
            <label data-ec-field="">
              <span data-ec-label="">Search templates</span>
              <input
                data-ec-input=""
                placeholder="Search templates..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
          ) : null}
          {filterByLanguage ? (
            <label data-ec-field="">
              <span data-ec-label="">Filter by language</span>
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
            </label>
          ) : null}
          {filterByTags ? (
            <label data-ec-field="">
              <span data-ec-label="">Filter by tag</span>
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
            </label>
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
                data-ec-active={activeTemplateId === template.id ? '' : undefined}
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
                  aria-pressed={tab === 'preview'}
                  onClick={() => setTab('preview')}
                >
                  <Eye size={14} aria-hidden="true" />
                  Preview
                </button>
                <button
                  type="button"
                  data-ec-btn=""
                  data-ec-variant={tab === 'code' ? 'primary' : 'ghost'}
                  aria-pressed={tab === 'code'}
                  onClick={() => setTab('code')}
                >
                  <Code2 size={14} aria-hidden="true" />
                  HTML
                </button>
                <button
                  type="button"
                  data-ec-btn=""
                  data-ec-variant={tab === 'plain' ? 'primary' : 'ghost'}
                  aria-pressed={tab === 'plain'}
                  onClick={() => setTab('plain')}
                >
                  <FileText size={14} aria-hidden="true" />
                  Plain text
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
                        aria-pressed={lang === selectedLanguage}
                        onClick={() => setActiveLanguage(lang)}
                      >
                        {lang.toUpperCase()}
                      </button>
                    ))
                  : null}
              </div>
              <div data-ec-viewer-actions="">
                <button
                  type="button"
                  data-ec-btn=""
                  data-ec-variant={viewport === 'desktop' ? 'primary' : 'ghost'}
                  aria-pressed={viewport === 'desktop'}
                  onClick={() => setViewport('desktop')}
                >
                  <Monitor size={14} aria-hidden="true" />
                  Desktop
                </button>
                <button
                  type="button"
                  data-ec-btn=""
                  data-ec-variant={viewport === 'mobile' ? 'primary' : 'ghost'}
                  aria-pressed={viewport === 'mobile'}
                  onClick={() => setViewport('mobile')}
                >
                  <Smartphone size={14} aria-hidden="true" />
                  Mobile
                </button>
                {allowCopy && codeView?.copyButton !== false && codeView?.enabled !== false ? (
                  <>
                    {tab === 'code' ? (
                      <button
                        type="button"
                        data-ec-btn=""
                        onClick={() => void onCopyCode()}
                        disabled={!codeSource.trim()}
                      >
                        <Copy size={14} aria-hidden="true" />
                        {copyState === 'ok'
                          ? 'Copied'
                          : copyState === 'error'
                            ? 'Copy failed'
                            : 'Copy HTML'}
                      </button>
                    ) : null}
                    {tab === 'plain' ? (
                      <button
                        type="button"
                        data-ec-btn=""
                        onClick={() => void onCopyPlain()}
                        disabled={!plainBody.trim()}
                      >
                        <Copy size={14} aria-hidden="true" />
                        {plainCopyState === 'ok'
                          ? 'Copied'
                          : plainCopyState === 'error'
                            ? 'Copy failed'
                            : 'Copy plain'}
                      </button>
                    ) : null}
                  </>
                ) : null}
              </div>
            </header>

            {tab === 'preview' ? (
              <div data-ec-viewer-preview="">
                <iframe
                  title="Template preview"
                  sandbox="allow-same-origin"
                  srcDoc={
                    iframeHtml ||
                    '<p style="font-family:Arial,sans-serif;padding:16px;">No HTML to preview.</p>'
                  }
                  data-ec-viewer-frame=""
                  style={{ width: viewport === 'mobile' ? 'min(375px, 100%)' : '100%' }}
                />
              </div>
            ) : tab === 'code' ? (
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
                      {(codeSource || '<!-- No exported HTML available -->')
                        .split('\n')
                        .map((line, idx) =>
                          codeView?.showLineNumbers === false ? (
                            line + (idx < (codeSource || '').split('\n').length - 1 ? '\n' : '')
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
            ) : (
              <pre data-ec-viewer-plain="" data-ec-viewer-code-wrap="">
                {plainBody || 'No plain text yet.'}
              </pre>
            )}
          </section>
        </div>
      </div>
    </ThemeRoot>
  )
}
