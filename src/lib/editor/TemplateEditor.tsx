import { useCallback, useEffect, useRef, useState } from 'react'
import type { Editor } from '@tiptap/react'
import { usePanelStore, usePanelStoreApi } from '../store'
import { createEmptyDocument, migrateEditorJson } from '../types/editorDocument'
import type { EditorDocumentV1, EmailBlock } from '../types/editorDocument'
import type { TemplateVersion } from '../../types'
import { usePanelConfig, type FlatVariable } from '../context/PanelConfigContext'
import { exportTemplate, htmlToPlainText } from '../export'
import { validateExportInput } from '../validation'
import { useDebouncedEffect } from '../utils/useDebouncedEffect'
import { BlockCanvas } from './BlockCanvas'
import { EditorLeftPanel } from './EditorLeftPanel'
import { EditorRightPanel } from './EditorRightPanel'
import { EditorToolbar } from './EditorToolbar'
import { PreviewFrame } from './PreviewFrame'

export function TemplateEditor() {
  const activeId = usePanelStore((s) => s.activeTemplateId)
  const backToLibrary = usePanelStore((s) => s.backToLibrary)
  const patchTemplate = usePanelStore((s) => s.patchTemplate)
  const patchLanguageVariant = usePanelStore((s) => s.patchLanguageVariant)
  const loadVersions = usePanelStore((s) => s.loadVersions)
  const saveVersion = usePanelStore((s) => s.saveVersion)
  const restoreVersion = usePanelStore((s) => s.restoreVersion)
  const undo = usePanelStore((s) => s.undo)
  const redo = usePanelStore((s) => s.redo)
  const versions = usePanelStore((s) => s.versions)
  const versionCursor = usePanelStore((s) => s.versionCursor)
  const setSelectedBlockId = usePanelStore((s) => s.setSelectedBlockId)
  const setActiveTextBlockId = usePanelStore((s) => s.setActiveTextBlockId)
  const savedBlocks = usePanelStore((s) => s.savedBlocks)
  const loadSavedBlocks = usePanelStore((s) => s.loadSavedBlocks)
  const saveSavedBlock = usePanelStore((s) => s.saveSavedBlock)
  const deleteSavedBlock = usePanelStore((s) => s.deleteSavedBlock)

  const { readOnly, variableSchema, tokenFormat, customTokenFormat, sampleData, onExport, onTestSend } =
    usePanelConfig()
  const panelStore = usePanelStoreApi()

  const [work, setWork] = useState<EditorDocumentV1>(() =>
    createEmptyDocument(),
  )
  const [name, setName] = useState('')
  const [subject, setSubject] = useState('')
  const [preheader, setPreheader] = useState('')
  const [fromName, setFromName] = useState('')
  const [replyTo, setReplyTo] = useState('')
  const [htmlTitle, setHtmlTitle] = useState('')
  const [rtl, setRtl] = useState(false)
  const [language, setLanguage] = useState('en')
  const [saving, setSaving] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [validationOpen, setValidationOpen] = useState(false)
  const [pendingExportHtml, setPendingExportHtml] = useState<string | null>(null)
  const [validationIssues, setValidationIssues] = useState<
    { id: string; severity: 'error' | 'warning'; message: string }[]
  >([])
  const [previewHtml, setPreviewHtml] = useState('')
  const [previewPlain, setPreviewPlain] = useState('')
  const [previewMode, setPreviewMode] = useState<'rendered' | 'plain'>('rendered')
  const [previewDark, setPreviewDark] = useState(false)
  const [testRecipient, setTestRecipient] = useState('')
  const [previewViewport, setPreviewViewport] = useState<'desktop' | 'mobile'>(
    'desktop',
  )
  const [compareLeftId, setCompareLeftId] = useState<string>('')
  const [compareRightId, setCompareRightId] = useState<string>('')
  const textRefs = useRef<Record<string, Editor | null>>({})
  const autosaveEnabledRef = useRef(false)

  const registerText = useCallback((id: string, ed: Editor | null) => {
    if (ed) textRefs.current[id] = ed
    else delete textRefs.current[id]
  }, [])

  const hydrateFromActive = useCallback(() => {
    if (!activeId) return null
    const t = panelStore.getState().templates.find(
      (x: { id: string }) => x.id === activeId,
    )
    if (!t) return null
    const lang = t.defaultLanguage
    const v = t.languages[lang]
    setLanguage(lang)
    setName(t.name)
    setSubject(v?.subject ?? '')
    setPreheader(v?.preheader ?? '')
    setFromName(t.fromName ?? '')
    setReplyTo(t.replyTo ?? '')
    setHtmlTitle(t.htmlTitle ?? '')
    setRtl(Boolean(t.rtl))
    const m = v?.editorJson
      ? migrateEditorJson(v.editorJson)
      : createEmptyDocument()
    setWork(m)
    if (m.blocks[0]) {
      setSelectedBlockId(m.blocks[0].id)
    }
    return { templateId: t.id, language: lang }
  }, [activeId, panelStore, setSelectedBlockId])

  // Load active template and its version timeline
  useEffect(() => {
    const ctx = hydrateFromActive()
    if (!ctx) return
    void loadVersions(ctx.templateId, ctx.language)
  }, [hydrateFromActive, loadVersions])

  useEffect(() => {
    void loadSavedBlocks()
  }, [loadSavedBlocks])

  const cloneBlockWithFreshIds = useCallback((block: EmailBlock): EmailBlock => {
    const next = JSON.parse(JSON.stringify(block)) as EmailBlock
    const walk = (item: EmailBlock) => {
      item.id = `blk_${Math.random().toString(36).slice(2, 10)}`
      if (item.type === 'conditional') {
        item.props.thenBlocks.forEach(walk)
        item.props.elseBlocks.forEach(walk)
      }
      if (item.type === 'loop') {
        item.props.bodyBlocks.forEach(walk)
        item.props.emptyBlocks.forEach(walk)
      }
      if (item.type === 'two_column') {
        item.props.leftBlocks.forEach(walk)
        item.props.rightBlocks.forEach(walk)
      }
      if (item.type === 'three_column') {
        item.props.leftBlocks.forEach(walk)
        item.props.centerBlocks.forEach(walk)
        item.props.rightBlocks.forEach(walk)
      }
    }
    walk(next)
    return next
  }, [])

  const onInsertVar = useCallback(
    (v: FlatVariable) => {
      let id = panelStore.getState().activeTextBlockId
      if (!id) {
        const first = work.blocks.find((b) => b.type === 'text')
        if (first) {
          id = first.id
          setActiveTextBlockId(first.id)
          setSelectedBlockId(first.id)
        }
      }
      if (!id) return
      const ed = textRefs.current[id]
      ed
        ?.chain()
        .focus()
        .insertContent({
          type: 'ecVariable',
          attrs: {
            key: v.key,
            label: v.label,
            color: v.color ?? null,
          },
        })
        .run()
    },
    [panelStore, setActiveTextBlockId, setSelectedBlockId, work.blocks],
  )

  const buildEditorJsonWithTextRefs = useCallback((): EditorDocumentV1 => {
    const blocks = work.blocks.map((b) => {
      if (b.type !== 'text') return b
      const ed = textRefs.current[b.id]
      if (ed) {
        return { ...b, props: { doc: ed.getJSON() } }
      }
      return b
    })
    return {
      version: 1,
      blocks,
      attachments: work.attachments ?? [],
    }
  }, [work.blocks, work.attachments])

  const persist = useCallback(async () => {
    if (!activeId) return
    if (readOnly) return
    const t = panelStore
      .getState()
      .templates.find((x: { id: string }) => x.id === activeId)
    if (!t) return
    setSaving(true)
    try {
      const lang = language || t.defaultLanguage
      const editorJson = buildEditorJsonWithTextRefs()
      if (name.trim()) {
        await patchTemplate(activeId, {
          name: name.trim(),
          fromName,
          replyTo,
          htmlTitle,
          rtl,
          defaultLanguage: lang,
        })
      }
      await patchLanguageVariant(activeId, lang, {
        subject,
        preheader,
        editorJson,
        html: t.languages[lang]?.html ?? '',
      })
      return { lang, editorJson }
    } finally {
      setSaving(false)
    }
  }, [
    activeId,
    readOnly,
    panelStore,
    buildEditorJsonWithTextRefs,
    name,
    patchTemplate,
    patchLanguageVariant,
    subject,
    preheader,
    fromName,
    replyTo,
    htmlTitle,
    rtl,
    language,
  ])

  const save = useCallback(async () => {
    const persisted = await persist()
    if (activeId && persisted) {
      await saveVersion({
        templateId: activeId,
        language: persisted.lang,
        type: 'manual',
        editorJson: persisted.editorJson,
        html: panelStore.getState().templates.find((x) => x.id === activeId)?.languages[persisted.lang]?.html ?? '',
      })
    }
    autosaveEnabledRef.current = true
  }, [persist, activeId, saveVersion, panelStore])

  useDebouncedEffect(
    () => {
      if (!autosaveEnabledRef.current || readOnly) return
      void (async () => {
        const persisted = await persist()
        if (activeId && persisted) {
          await saveVersion({
            templateId: activeId,
            language: persisted.lang,
            type: 'autosave',
            editorJson: persisted.editorJson,
            html:
              panelStore
                .getState()
                .templates.find((x) => x.id === activeId)
                ?.languages[persisted.lang]?.html ?? '',
          })
        }
      })()
    },
    900,
    [work, name, subject, preheader, readOnly, persist, activeId, saveVersion, panelStore],
  )

  const buildExportInput = useCallback(() => {
    if (!activeId) return null
    const t = panelStore
      .getState()
      .templates.find((x: { id: string }) => x.id === activeId)
    if (!t) return null
    const lang = language || t.defaultLanguage
    return {
      templateId: t.id,
      templateName: name.trim() || t.name,
      language: lang,
      subject,
      preheader,
      tags: t.tags,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      document: work,
      variableSchema,
      tokenFormat,
      customTokenFormat,
      sampleData,
      rtl,
    }
  }, [
    activeId,
    panelStore,
    name,
    subject,
    preheader,
    work,
    variableSchema,
    tokenFormat,
    customTokenFormat,
    sampleData,
    language,
    rtl,
  ])

  const handlePreview = useCallback(() => {
    const input = buildExportInput()
    if (!input) return
    const artifacts = exportTemplate(input, 'plain')
    setPreviewHtml(artifacts.html)
    setPreviewPlain(htmlToPlainText(artifacts.html))
    setPreviewOpen(true)
  }, [buildExportInput])

  const handleExport = useCallback(() => {
    const input = buildExportInput()
    if (!input) return
    const result = validateExportInput(input)
    if (result.issues.length > 0) {
      const previewArtifacts = exportTemplate(input, 'production')
      setPendingExportHtml(previewArtifacts.html)
      setValidationIssues(result.issues.map((x) => ({ id: x.id, severity: x.severity, message: x.message })))
      setValidationOpen(true)
      if (result.hasErrors) return
    }
    const artifacts = exportTemplate(input, 'production')
    void saveVersion({
      templateId: input.templateId,
      language: input.language,
      type: 'pre-export',
      editorJson: input.document,
      html: artifacts.html,
    })
    onExport?.(artifacts)
  }, [buildExportInput, onExport, saveVersion])

  const canUndo = versionCursor > 0
  const canRedo = versionCursor >= 0 && versionCursor < versions.length - 1
  const compareLeft = versions.find((v) => v.versionId === compareLeftId) ?? null
  const compareRight = versions.find((v) => v.versionId === compareRightId) ?? null

  const handleUndo = useCallback(async () => {
    await undo()
    hydrateFromActive()
  }, [undo, hydrateFromActive])

  const handleRedo = useCallback(async () => {
    await redo()
    hydrateFromActive()
  }, [redo, hydrateFromActive])

  if (!activeId) {
    return (
      <div data-ec-editor-empty="" className="ec-editor-empty">
        <p>Nothing to edit</p>
        <button type="button" data-ec-btn="" onClick={backToLibrary}>
          Back
        </button>
      </div>
    )
  }

  return (
    <div data-ec-template-editor="" className="ec-template-editor">
      <EditorToolbar
        onBack={backToLibrary}
        onSave={save}
        onPreview={handlePreview}
        onExport={handleExport}
        onUndo={() => void handleUndo()}
        onRedo={() => void handleRedo()}
        canUndo={canUndo}
        canRedo={canRedo}
        readOnly={readOnly}
        saving={saving}
      />
      <div className="ec-editor-grid">
        <EditorLeftPanel
          work={work}
          onChange={setWork}
          readOnly={readOnly}
          onInsertVariable={onInsertVar}
          savedBlocks={savedBlocks}
          onInsertSavedBlock={(saved) => {
            setWork((prev) => ({
              ...prev,
              blocks: [...prev.blocks, cloneBlockWithFreshIds(saved.snapshot)],
            }))
          }}
          onDeleteSavedBlock={(savedBlockId) => {
            void deleteSavedBlock(savedBlockId)
          }}
        />
        <div className="ec-editor-center" data-ec-canvas-wrap="">
          <div className="ec-editor-faux-email">600px</div>
          <BlockCanvas
            work={work}
            onChange={setWork}
            readOnly={readOnly}
            onRegisterTextEditor={registerText}
            onSaveReusableBlock={(block) => {
              const name = window.prompt('Saved block name', 'Reusable block')
              if (!name?.trim()) return
              void saveSavedBlock({
                name: name.trim(),
                visibility: 'personal',
                snapshot: block,
              })
            }}
          />
        </div>
        <EditorRightPanel
          work={work}
          onChange={setWork}
          name={name}
          subject={subject}
          preheader={preheader}
          fromName={fromName}
          replyTo={replyTo}
          htmlTitle={htmlTitle}
          rtl={rtl}
          language={language}
          supportedLanguages={['en', 'ar', 'fr', 'de']}
          readOnly={readOnly}
          onMetaChange={({
            name: n,
            subject: s,
            preheader: p,
            fromName: fn,
            replyTo: rt,
            htmlTitle: ht,
            rtl: isRtl,
            language: lg,
          }) => {
            setName(n)
            setSubject(s)
            setPreheader(p)
            setFromName(fn)
            setReplyTo(rt)
            setHtmlTitle(ht)
            setRtl(isRtl)
            setLanguage(lg)
          }}
          versions={versions}
          onRestore={(versionId) => {
            void (async () => {
              await restoreVersion(versionId)
              hydrateFromActive()
            })()
          }}
          activeVersionId={versions[versionCursor]?.versionId ?? null}
          compareLeftId={compareLeftId}
          compareRightId={compareRightId}
          onCompareChange={(left, right) => {
            setCompareLeftId(left)
            setCompareRightId(right)
          }}
          diffLeftHtml={compareLeft?.html ?? ''}
          diffRightHtml={compareRight?.html ?? ''}
        />
      </div>
      {previewOpen ? (
        <div className="ec-preview-modal" role="dialog" aria-modal="true">
          <div className="ec-preview-modal__toolbar">
            <button type="button" data-ec-btn="" onClick={() => setPreviewMode('rendered')}>
              Rendered
            </button>
            <button type="button" data-ec-btn="" onClick={() => setPreviewMode('plain')}>
              Plain text
            </button>
            <button type="button" data-ec-btn="" onClick={() => setPreviewViewport('desktop')}>
              Desktop
            </button>
            <button type="button" data-ec-btn="" onClick={() => setPreviewViewport('mobile')}>
              Mobile
            </button>
            <button type="button" data-ec-btn="" onClick={() => setPreviewDark((x) => !x)}>
              {previewDark ? 'Light mode' : 'Dark mode'}
            </button>
            {onTestSend ? (
              <>
                <input
                  data-ec-input=""
                  placeholder="test@company.com"
                  value={testRecipient}
                  onChange={(e) => setTestRecipient(e.target.value)}
                  style={{ maxWidth: 220 }}
                />
                <button
                  type="button"
                  data-ec-btn=""
                  data-ec-variant="primary"
                  disabled={!testRecipient.trim()}
                  onClick={() => {
                    const input = buildExportInput()
                    if (!input) return
                    const artifacts = exportTemplate(input, 'production')
                    void onTestSend({
                      html: artifacts.html,
                      metadata: artifacts.metadata,
                      recipient: testRecipient.trim(),
                    })
                  }}
                >
                  Send test
                </button>
              </>
            ) : null}
            <button type="button" data-ec-btn="" onClick={() => setPreviewOpen(false)}>
              Close
            </button>
          </div>
          {previewMode === 'rendered' ? (
            <PreviewFrame html={previewHtml} viewport={previewViewport} darkMode={previewDark} />
          ) : (
            <pre className="ec-preview-plain">{previewPlain || 'No plain text output yet.'}</pre>
          )}
        </div>
      ) : null}
      {validationOpen ? (
        <div className="ec-preview-modal" role="dialog" aria-modal="true">
          <div className="ec-preview-modal__toolbar">
            <strong>Validation Summary</strong>
            <button type="button" data-ec-btn="" onClick={() => setValidationOpen(false)}>
              Close
            </button>
          </div>
          <div className="ec-validation-body">
            {validationIssues.map((item) => (
              <div key={item.id} data-ec-alert="" data-ec-variant={item.severity === 'error' ? 'error' : undefined}>
                {item.severity.toUpperCase()}: {item.message}
              </div>
            ))}
            <div className="ec-rfield-inline">
              <button
                type="button"
                data-ec-btn=""
                data-ec-variant="ghost"
                onClick={() => setValidationOpen(false)}
              >
                Back to editor
              </button>
              {!validationIssues.some((x) => x.severity === 'error') ? (
                <button
                  type="button"
                  data-ec-btn=""
                  data-ec-variant="primary"
                  onClick={() => {
                    if (!pendingExportHtml || !activeId) return
                    onExport?.({
                      html: pendingExportHtml,
                      mode: 'production',
                      language:
                        panelStore.getState().templates.find((t) => t.id === activeId)
                          ?.defaultLanguage ?? 'en',
                      json: work,
                      metadata: {
                        name,
                        subject,
                        preheader,
                        tags:
                          panelStore.getState().templates.find((t) => t.id === activeId)
                            ?.tags ?? [],
                        variablesUsed: [],
                        requiredVariablesMissing: [],
                        createdAt:
                          panelStore.getState().templates.find((t) => t.id === activeId)
                            ?.createdAt ?? '',
                        updatedAt:
                          panelStore.getState().templates.find((t) => t.id === activeId)
                            ?.updatedAt ?? '',
                      },
                    })
                    setValidationOpen(false)
                  }}
                >
                  Export anyway
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
