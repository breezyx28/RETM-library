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
import { ThemeRoot, viewerThemes, useSlot } from '../../lib/theme'
import { cn } from '../../utils/cn'
import { createAdapter } from '../../lib/storage'
import { formatRelative } from '../../lib/utils/date'
import { exportTemplate, htmlToPlainText } from '../../lib/export'
import { migrateEditorJson } from '../../lib/types/editorDocument'
import { EC_LOCAL_TEMPLATES_CHANGED } from '../../lib/storage/localTemplateEvents'
import { resolveAttachmentFileVisual } from '../../lib/editor/attachmentFileIcons'

type ViewerTab = 'preview' | 'code' | 'plain'

/**
 * `<EmailTemplateViewer>` — read-only browser for stored templates
 * (published by default; optional drafts via `includeNonPublished`)
 * (spec §3.2, §21).
 *
 * Tailwind v4 native: pass `classNames={{ ... }}` for per-slot overrides.
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
    classNames,
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
  const [plainCopyState, setPlainCopyState] = useState<'idle' | 'ok' | 'error'>(
    'idle',
  )
  const [codeHtml, setCodeHtml] = useState<string>('')

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const raw = await adapter.list()
      const items = (
        includeNonPublished
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
      window.removeEventListener(
        EC_LOCAL_TEMPLATES_CHANGED,
        handler as EventListener,
      )
      window.removeEventListener('storage', onStorage)
    }
  }, [storageMode, storageKey, load])

  const activeTemplate = useMemo(
    () =>
      activeTemplateId
        ? templates.find((t) => t.id === activeTemplateId) ?? null
        : null,
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
  const viewerAttachments = useMemo(() => {
    if (!activeTemplate) return []
    const variant = activeTemplate.languages[selectedLanguage]
    if (!variant?.editorJson) return []
    return migrateEditorJson(variant.editorJson).attachments
  }, [activeTemplate, selectedLanguage])

  const allTags = useMemo(() => {
    const tags = new Set<string>()
    templates.forEach((t) => (t.tags ?? []).forEach((tag) => tags.add(tag)))
    return Array.from(tags).sort()
  }, [templates])
  const allLanguages = useMemo(() => {
    const langs = new Set<string>()
    templates.forEach((t) =>
      Object.keys(t.languages).forEach((lang) => langs.add(lang)),
    )
    return Array.from(langs).sort()
  }, [templates])

  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      const q = query.trim().toLowerCase()
      if (q) {
        const haystack =
          `${template.name} ${(template.tags ?? []).join(' ')}`.toLowerCase()
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
    const t = activeTemplateId
      ? templates.find((x) => x.id === activeTemplateId)
      : null
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
      classNames={classNames}
      themedClassNames={viewerThemes[theme]}
      headless={headless}
      className={cn(className, classNames?.root)}
      dataScope="viewer"
    >
      <ViewerSurface
        searchable={searchable}
        filterByLanguage={filterByLanguage}
        filterByTags={filterByTags}
        defaultView={defaultView}
        codeView={codeView}
        allowCopy={allowCopy}
        query={query}
        setQuery={setQuery}
        languageFilter={languageFilter}
        setLanguageFilter={setLanguageFilter}
        tagFilter={tagFilter}
        setTagFilter={setTagFilter}
        allLanguages={allLanguages}
        allTags={allTags}
        filteredTemplates={filteredTemplates}
        activeTemplateId={activeTemplateId}
        setActiveTemplateId={setActiveTemplateId}
        setActiveLanguage={setActiveLanguage}
        loading={loading}
        error={error}
        activeTemplate={activeTemplate}
        selectedLanguage={selectedLanguage}
        tab={tab}
        setTab={setTab}
        viewport={viewport}
        setViewport={setViewport}
        iframeHtml={iframeHtml}
        codeSource={codeSource}
        plainBody={plainBody}
        codeHtml={codeHtml}
        copyState={copyState}
        plainCopyState={plainCopyState}
        onCopyCode={onCopyCode}
        onCopyPlain={onCopyPlain}
        viewerAttachments={viewerAttachments}
      />
    </ThemeRoot>
  )
}

interface ViewerSurfaceProps {
  searchable: boolean
  filterByLanguage: boolean
  filterByTags: boolean
  defaultView: 'grid' | 'list'
  codeView: EmailTemplateViewerProps['codeView']
  allowCopy: boolean
  query: string
  setQuery: (q: string) => void
  languageFilter: string
  setLanguageFilter: (q: string) => void
  tagFilter: string
  setTagFilter: (q: string) => void
  allLanguages: string[]
  allTags: string[]
  filteredTemplates: Template[]
  activeTemplateId: string | null
  setActiveTemplateId: (id: string | null) => void
  setActiveLanguage: (lang: string) => void
  loading: boolean
  error: string | null
  activeTemplate: Template | null
  selectedLanguage: string
  tab: ViewerTab
  setTab: (t: ViewerTab) => void
  viewport: 'desktop' | 'mobile'
  setViewport: (v: 'desktop' | 'mobile') => void
  iframeHtml: string
  codeSource: string
  plainBody: string
  codeHtml: string
  copyState: 'idle' | 'ok' | 'error'
  plainCopyState: 'idle' | 'ok' | 'error'
  onCopyCode: () => Promise<void>
  onCopyPlain: () => Promise<void>
  viewerAttachments: import('../../lib/types/editorDocument').AttachmentItem[]
}

/**
 * Inner surface — separated so we can read slot context (the context is set
 * by `<ThemeRoot>` higher up).
 */
function ViewerSurface(p: ViewerSurfaceProps) {
  const [rootT, rootU] = useSlot('viewer.root')
  const [controlsT, controlsU] = useSlot('viewer.controls')
  const [shellT, shellU] = useSlot('viewer.shell')
  const [listT, listU] = useSlot('viewer.list')
  const [listItemT, listItemU] = useSlot('viewer.listItem')
  const [mainT, mainU] = useSlot('viewer.main')
  const [toolbarT, toolbarU] = useSlot('viewer.toolbar')
  const [tabsT, tabsU] = useSlot('viewer.tabs')
  const [languagesT, languagesU] = useSlot('viewer.languages')
  const [actionsT, actionsU] = useSlot('viewer.actions')
  const [previewT, previewU] = useSlot('viewer.preview')
  const [frameT, frameU] = useSlot('viewer.frame')
  const [codeWrapT, codeWrapU] = useSlot('viewer.codeWrap')
  const [codeT, codeU] = useSlot('viewer.code')
  const [plainT, plainU] = useSlot('viewer.plain')
  const [btnT, btnU] = useSlot('controls.btn')
  const [fieldT, fieldU] = useSlot('controls.field')
  const [labelT, labelU] = useSlot('controls.label')
  const [inputT, inputU] = useSlot('controls.input')

  const btnClass = cn(btnT, btnU)
  const fieldClass = cn(fieldT, fieldU)
  const labelClass = cn(labelT, labelU)
  const inputClass = cn(inputT, inputU)

  return (
    <div data-ec-viewer="" className={cn(rootT, rootU)}>
      <div data-ec-viewer-controls="" className={cn(controlsT, controlsU)}>
        {p.searchable ? (
          <label data-ec-field="" className={fieldClass}>
            <span data-ec-label="" className={labelClass}>
              Search templates
            </span>
            <input
              data-ec-input=""
              className={inputClass}
              placeholder="Search templates..."
              value={p.query}
              onChange={(e) => p.setQuery(e.target.value)}
            />
          </label>
        ) : null}
        {p.filterByLanguage ? (
          <label data-ec-field="" className={fieldClass}>
            <span data-ec-label="" className={labelClass}>
              Filter by language
            </span>
            <select
              data-ec-input=""
              className={inputClass}
              value={p.languageFilter}
              onChange={(e) => p.setLanguageFilter(e.target.value)}
            >
              <option value="">All languages</option>
              {p.allLanguages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang.toUpperCase()}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {p.filterByTags ? (
          <label data-ec-field="" className={fieldClass}>
            <span data-ec-label="" className={labelClass}>
              Filter by tag
            </span>
            <select
              data-ec-input=""
              className={inputClass}
              value={p.tagFilter}
              onChange={(e) => p.setTagFilter(e.target.value)}
            >
              <option value="">All tags</option>
              {p.allTags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>
      <div data-ec-viewer-shell="" className={cn(shellT, shellU)}>
        <aside
          data-ec-viewer-list=""
          data-ec-view={p.defaultView}
          className={cn(listT, listU)}
        >
          <h3 data-ec-h3="">Templates</h3>
          {p.filteredTemplates.map((template) => (
            <button
              key={template.id}
              type="button"
              data-ec-viewer-item=""
              data-ec-active={
                p.activeTemplateId === template.id ? '' : undefined
              }
              className={cn(listItemT, listItemU)}
              onClick={() => {
                p.setActiveTemplateId(template.id)
                p.setActiveLanguage(template.defaultLanguage)
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
          {!p.filteredTemplates.length && !p.error ? (
            <p data-ec-empty-msg="">
              {p.loading ? 'Loading templates...' : 'No templates found.'}
            </p>
          ) : null}
          {p.error ? (
            <p data-ec-alert="" data-ec-variant="error" role="alert">
              {p.error}
            </p>
          ) : null}
        </aside>

        <section data-ec-viewer-main="" className={cn(mainT, mainU)}>
          <header
            data-ec-viewer-toolbar=""
            className={cn(toolbarT, toolbarU)}
          >
            <div data-ec-viewer-tabs="" className={cn(tabsT, tabsU)}>
              <button
                type="button"
                data-ec-btn=""
                data-ec-variant={p.tab === 'preview' ? 'primary' : 'ghost'}
                aria-pressed={p.tab === 'preview'}
                onClick={() => p.setTab('preview')}
                className={btnClass}
              >
                <Eye size={14} aria-hidden="true" />
                Preview
              </button>
              <button
                type="button"
                data-ec-btn=""
                data-ec-variant={p.tab === 'code' ? 'primary' : 'ghost'}
                aria-pressed={p.tab === 'code'}
                onClick={() => p.setTab('code')}
                className={btnClass}
              >
                <Code2 size={14} aria-hidden="true" />
                HTML
              </button>
              <button
                type="button"
                data-ec-btn=""
                data-ec-variant={p.tab === 'plain' ? 'primary' : 'ghost'}
                aria-pressed={p.tab === 'plain'}
                onClick={() => p.setTab('plain')}
                className={btnClass}
              >
                <FileText size={14} aria-hidden="true" />
                Plain text
              </button>
            </div>
            <div
              data-ec-viewer-languages=""
              className={cn(languagesT, languagesU)}
            >
              {p.activeTemplate
                ? Object.keys(p.activeTemplate.languages).map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      data-ec-btn=""
                      data-ec-variant={
                        lang === p.selectedLanguage ? 'primary' : 'ghost'
                      }
                      aria-pressed={lang === p.selectedLanguage}
                      onClick={() => p.setActiveLanguage(lang)}
                      className={btnClass}
                    >
                      {lang.toUpperCase()}
                    </button>
                  ))
                : null}
            </div>
            <div
              data-ec-viewer-actions=""
              className={cn(actionsT, actionsU)}
            >
              <button
                type="button"
                data-ec-btn=""
                data-ec-variant={p.viewport === 'desktop' ? 'primary' : 'ghost'}
                aria-pressed={p.viewport === 'desktop'}
                onClick={() => p.setViewport('desktop')}
                className={btnClass}
              >
                <Monitor size={14} aria-hidden="true" />
                Desktop
              </button>
              <button
                type="button"
                data-ec-btn=""
                data-ec-variant={p.viewport === 'mobile' ? 'primary' : 'ghost'}
                aria-pressed={p.viewport === 'mobile'}
                onClick={() => p.setViewport('mobile')}
                className={btnClass}
              >
                <Smartphone size={14} aria-hidden="true" />
                Mobile
              </button>
              {p.allowCopy &&
              p.codeView?.copyButton !== false &&
              p.codeView?.enabled !== false ? (
                <>
                  {p.tab === 'code' ? (
                    <button
                      type="button"
                      data-ec-btn=""
                      onClick={() => void p.onCopyCode()}
                      disabled={!p.codeSource.trim()}
                      className={btnClass}
                    >
                      <Copy size={14} aria-hidden="true" />
                      {p.copyState === 'ok'
                        ? 'Copied'
                        : p.copyState === 'error'
                          ? 'Copy failed'
                          : 'Copy HTML'}
                    </button>
                  ) : null}
                  {p.tab === 'plain' ? (
                    <button
                      type="button"
                      data-ec-btn=""
                      onClick={() => void p.onCopyPlain()}
                      disabled={!p.plainBody.trim()}
                      className={btnClass}
                    >
                      <Copy size={14} aria-hidden="true" />
                      {p.plainCopyState === 'ok'
                        ? 'Copied'
                        : p.plainCopyState === 'error'
                          ? 'Copy failed'
                          : 'Copy plain'}
                    </button>
                  ) : null}
                </>
              ) : null}
            </div>
          </header>

          {p.tab === 'preview' ? (
            <div data-ec-viewer-preview="" className={cn(previewT, previewU)}>
              <div className="ec-viewer-preview-stack">
                <div
                  className="ec-viewer-frame-shell"
                  style={{
                    width: p.viewport === 'mobile' ? 'min(375px, 100%)' : '100%',
                  }}
                >
                  <iframe
                    title="Template preview"
                    sandbox="allow-same-origin"
                    srcDoc={
                      p.iframeHtml ||
                      '<p style="font-family:Arial,sans-serif;padding:16px;">No HTML to preview.</p>'
                    }
                    data-ec-viewer-frame=""
                    className={cn(frameT, frameU)}
                  />
                  {p.viewerAttachments.length > 0 ? (
                    <div
                      className="ec-viewer-attachments"
                      data-ec-canvas-attachments=""
                    >
                      {p.viewerAttachments.map((attachment) => {
                        const visual = resolveAttachmentFileVisual(
                          attachment.url,
                        )
                        return (
                          <a
                            key={attachment.id}
                            href={attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ec-canvas-attachment-card"
                          >
                            <span
                              className="ec-canvas-attachment-card__badge"
                              data-ec-tone={visual.tone}
                            >
                              <img
                                src={visual.iconSrc}
                                alt=""
                                aria-hidden="true"
                              />
                            </span>
                            <span className="ec-canvas-attachment-card__meta">
                              <strong>
                                {attachment.label || 'Attachment'}
                              </strong>
                              <span>
                                {visual.extensionLabel}
                                {attachment.size?.trim()
                                  ? ` · ${attachment.size.trim()}`
                                  : ''}
                              </span>
                            </span>
                          </a>
                        )
                      })}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ) : p.tab === 'code' ? (
            <div data-ec-viewer-code-wrap="" className={cn(codeWrapT, codeWrapU)}>
              <div data-ec-viewer-code-head="">
                <span data-ec-lang-pill="">HTML</span>
              </div>
              {p.codeHtml ? (
                <div
                  data-ec-viewer-code=""
                  data-ec-lines={
                    p.codeView?.showLineNumbers !== false ? '' : undefined
                  }
                  className={cn(codeT, codeU)}
                  dangerouslySetInnerHTML={{ __html: p.codeHtml }}
                />
              ) : (
                <pre data-ec-viewer-code="" className={cn(codeT, codeU)}>
                  <code>
                    {(p.codeSource || '<!-- No exported HTML available -->')
                      .split('\n')
                      .map((line, idx) =>
                        p.codeView?.showLineNumbers === false ? (
                          line +
                          (idx < (p.codeSource || '').split('\n').length - 1
                            ? '\n'
                            : '')
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
            <pre
              data-ec-viewer-plain=""
              data-ec-viewer-code-wrap=""
              className={cn(plainT, plainU)}
            >
              {p.plainBody || 'No plain text yet.'}
            </pre>
          )}
        </section>
      </div>
    </div>
  )
}
