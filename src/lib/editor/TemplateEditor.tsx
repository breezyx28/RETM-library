import { useCallback, useEffect, useRef, useState } from 'react'
import * as AlertDialog from '@radix-ui/react-alert-dialog'
import {
  Code2,
  Copy,
  FileText,
  Monitor,
  Smartphone,
  Sun,
  Moon,
  X,
  Mail,
} from 'lucide-react'
import type { Editor } from '@tiptap/react'
import { usePanelStore, usePanelStoreApi } from '../store'
import { createEmptyDocument, migrateEditorJson } from '../types/editorDocument'
import type { EditorDocumentV1, EmailBlock } from '../types/editorDocument'
import type { TemplateVersion } from '../../types'
import { usePanelConfig, type FlatVariable } from '../context/PanelConfigContext'
import { exportTemplate, htmlToPlainText } from '../export'
import { validateExportInput, partitionExportIssues } from '../validation'
import type { ValidationIssue } from '../validation/types'
import { useDebouncedEffect } from '../utils/useDebouncedEffect'
import { BlockCanvas } from './BlockCanvas'
import { EditorLeftPanel } from './EditorLeftPanel'
import { EditorRightPanel } from './EditorRightPanel'
import { EditorToolbar } from './EditorToolbar'
import { PreviewFrame } from './PreviewFrame'
import { PresetInsertDialog } from './PresetInsertDialog'
import type { EmailPreset } from './presets/emailPresets'
import { newBlockId } from '../types/editorDocument'

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
  /** Hydrated HTML (plain export) for iframe + plain-text tab */
  const [previewHtml, setPreviewHtml] = useState('')
  /** Production HTML with real tokens (handlebars / dollar / etc.) for source tab + copy */
  const [previewHtmlProduction, setPreviewHtmlProduction] = useState('')
  const [previewPlain, setPreviewPlain] = useState('')
  const [previewMode, setPreviewMode] = useState<'rendered' | 'plain' | 'source'>('rendered')
  const [previewDark, setPreviewDark] = useState(false)
  const [previewSourceHtml, setPreviewSourceHtml] = useState('')
  const [previewCopyState, setPreviewCopyState] = useState<'idle' | 'ok' | 'error'>('idle')
  const [testRecipient, setTestRecipient] = useState('')
  const [previewViewport, setPreviewViewport] = useState<'desktop' | 'mobile'>(
    'desktop',
  )
  const [compareLeftId, setCompareLeftId] = useState<string>('')
  const [compareRightId, setCompareRightId] = useState<string>('')
  const [pendingPreset, setPendingPreset] = useState<EmailPreset | null>(null)
  const [saveSnippetOpen, setSaveSnippetOpen] = useState(false)
  const [saveSnippetName, setSaveSnippetName] = useState('')
  const [saveSnippetBlock, setSaveSnippetBlock] = useState<EmailBlock | null>(null)
  const [exportVariableWarnOpen, setExportVariableWarnOpen] = useState(false)
  const [exportVariableWarnIssues, setExportVariableWarnIssues] = useState<ValidationIssue[]>([])
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
    (
      v: FlatVariable,
      options?: {
        renderAs?: 'text' | 'link' | 'image' | 'table' | 'list'
        listStyle?: 'ordered' | 'unordered'
      },
    ) => {
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
            renderAs: options?.renderAs ?? 'text',
            listStyle: options?.listStyle ?? 'unordered',
            imageWidth: 240,
            imageHeight: 120,
            imageRadius: 8,
          },
        })
        .run()
    },
    [panelStore, setActiveTextBlockId, setSelectedBlockId, work.blocks],
  )

  const appendAttachmentToCanvasBottom = useCallback((attachment: EditorDocumentV1['attachments'][number]) => {
    setWork((prev) => ({
      ...prev,
      attachments: [
        ...prev.attachments.filter((item) => item.id !== attachment.id),
        attachment,
      ],
    }))
  }, [])

  const applyPreset = useCallback(
    (preset: EmailPreset, mode: 'cursor' | 'replace') => {
      if (mode === 'cursor') {
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
        ed?.chain().focus().insertContent(preset.content).run()
        if (preset.subject && !subject.trim()) setSubject(preset.subject)
        if (preset.preheader && !preheader.trim()) setPreheader(preset.preheader)
        return
      }
      const newBlock: EmailBlock = {
        id: newBlockId(),
        type: 'text',
        props: {
          doc: { type: 'doc', content: preset.content },
        },
      }
      setWork((prev) => ({
        ...prev,
        blocks: [newBlock],
      }))
      setActiveTextBlockId(newBlock.id)
      setSelectedBlockId(newBlock.id)
      if (preset.subject && !subject.trim()) setSubject(preset.subject)
      if (preset.preheader && !preheader.trim()) setPreheader(preset.preheader)
    },
    [
      panelStore,
      work.blocks,
      setActiveTextBlockId,
      setSelectedBlockId,
      subject,
      preheader,
    ],
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
      const exportInput = {
        templateId: t.id,
        templateName: name.trim() || t.name,
        language: lang,
        subject,
        preheader,
        tags: t.tags,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
        document: editorJson,
        variableSchema,
        tokenFormat,
        customTokenFormat,
        sampleData,
        rtl,
      }
      const productionHtml = exportTemplate(exportInput, 'production').html
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
        html: productionHtml,
      })
      return { lang, editorJson, html: productionHtml }
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
    variableSchema,
    tokenFormat,
    customTokenFormat,
    sampleData,
  ])

  const save = useCallback(async () => {
    const persisted = await persist()
    if (activeId && persisted) {
      await saveVersion({
        templateId: activeId,
        language: persisted.lang,
        type: 'manual',
        editorJson: persisted.editorJson,
        html: persisted.html,
      })
    }
    autosaveEnabledRef.current = true
  }, [persist, activeId, saveVersion])

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
            html: persisted.html,
          })
        }
      })()
    },
    900,
    [work, name, subject, preheader, readOnly, persist, activeId, saveVersion],
  )

  const buildExportInput = useCallback(() => {
    if (!activeId) return null
    const t = panelStore
      .getState()
      .templates.find((x: { id: string }) => x.id === activeId)
    if (!t) return null
    const lang = language || t.defaultLanguage
    const document = buildEditorJsonWithTextRefs()
    return {
      templateId: t.id,
      templateName: name.trim() || t.name,
      language: lang,
      subject,
      preheader,
      tags: t.tags,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      document,
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
    buildEditorJsonWithTextRefs,
    variableSchema,
    tokenFormat,
    customTokenFormat,
    sampleData,
    language,
    rtl,
  ])

  const performProductionExport = useCallback(async () => {
    const input = buildExportInput()
    if (!input) return
    const artifacts = exportTemplate(input, 'production')
    await saveVersion({
      templateId: input.templateId,
      language: input.language,
      type: 'pre-export',
      editorJson: input.document,
      html: artifacts.html,
    })
    onExport?.(artifacts)
  }, [buildExportInput, onExport, saveVersion])

  const handlePreview = useCallback(() => {
    const input = buildExportInput()
    if (!input) return
    const plainArtifacts = exportTemplate(input, 'plain')
    const productionArtifacts = exportTemplate(input, 'production')
    setPreviewHtml(plainArtifacts.html)
    setPreviewHtmlProduction(productionArtifacts.html)
    setPreviewPlain(htmlToPlainText(plainArtifacts.html))
    setPreviewSourceHtml('')
    setPreviewMode('rendered')
    setPreviewOpen(true)
  }, [buildExportInput])

  const handleExport = useCallback(() => {
    const input = buildExportInput()
    if (!input) return
    const result = validateExportInput(input)
    const { hardErrors, variableMissingErrors } = partitionExportIssues(result.issues)

    if (hardErrors.length === 0 && variableMissingErrors.length > 0) {
      setExportVariableWarnIssues(variableMissingErrors)
      setExportVariableWarnOpen(true)
      return
    }

    if (hardErrors.length > 0) {
      const previewArtifacts = exportTemplate(input, 'production')
      setPendingExportHtml(previewArtifacts.html)
      setValidationIssues(result.issues.map((x) => ({ id: x.id, severity: x.severity, message: x.message })))
      setValidationOpen(true)
      return
    }

    void performProductionExport()
  }, [buildExportInput, performProductionExport])

  useEffect(() => {
    if (!previewOpen || previewMode !== 'source' || !previewHtmlProduction.trim()) {
      setPreviewSourceHtml('')
      return
    }
    let cancelled = false
    const run = async () => {
      try {
        const shiki = await import('shiki')
        const themed = await shiki.codeToHtml(previewHtmlProduction, {
          lang: 'html',
          theme: previewDark ? 'github-dark' : 'github-light',
        })
        if (!cancelled) setPreviewSourceHtml(themed)
      } catch {
        if (!cancelled) setPreviewSourceHtml('')
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [previewOpen, previewMode, previewHtmlProduction, previewDark])

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
        templateName={name}
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
      <div className="ec-editor-shell">
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
          onPickPreset={(preset) => setPendingPreset(preset)}
        />
        <div className="ec-editor-center" data-ec-canvas-wrap="">
          <div className="ec-editor-faux-email">600px</div>
          <BlockCanvas
            work={work}
            onChange={setWork}
            readOnly={readOnly}
            onRegisterTextEditor={registerText}
            getActiveEditor={() => {
              const id = panelStore.getState().activeTextBlockId
              return id ? textRefs.current[id] ?? null : null
            }}
            onSaveReusableBlock={(block) => {
              setSaveSnippetBlock(block)
              setSaveSnippetName('Reusable block')
              setSaveSnippetOpen(true)
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
          onAppendAttachmentToCanvas={appendAttachmentToCanvasBottom}
        />
      </div>
      </div>
      {previewOpen ? (
        <div className="ec-preview-modal" role="dialog" aria-modal="true">
          <div className="ec-preview-modal__toolbar">
            <button
              type="button"
              data-ec-btn=""
              className="ec-preview-modal__btn"
              data-ec-variant={previewMode === 'rendered' ? 'primary' : 'ghost'}
              aria-pressed={previewMode === 'rendered'}
              onClick={() => setPreviewMode('rendered')}
            >
              <Monitor size={14} aria-hidden="true" />
              Rendered
            </button>
            <button
              type="button"
              data-ec-btn=""
              className="ec-preview-modal__btn"
              data-ec-variant={previewMode === 'plain' ? 'primary' : 'ghost'}
              aria-pressed={previewMode === 'plain'}
              onClick={() => setPreviewMode('plain')}
            >
              <FileText size={14} aria-hidden="true" />
              Plain text
            </button>
            <button
              type="button"
              data-ec-btn=""
              className="ec-preview-modal__btn"
              data-ec-variant={previewMode === 'source' ? 'primary' : 'ghost'}
              aria-pressed={previewMode === 'source'}
              onClick={() => setPreviewMode('source')}
            >
              <Code2 size={14} aria-hidden="true" />
              HTML source
            </button>
            {previewMode === 'source' ? (
              <button
                type="button"
                data-ec-btn=""
                className="ec-preview-modal__btn"
                data-ec-variant="ghost"
                disabled={!previewHtmlProduction.trim()}
                onClick={() => {
                  void (async () => {
                    try {
                      await navigator.clipboard.writeText(previewHtmlProduction)
                      setPreviewCopyState('ok')
                      window.setTimeout(() => setPreviewCopyState('idle'), 1500)
                    } catch {
                      setPreviewCopyState('error')
                      window.setTimeout(() => setPreviewCopyState('idle'), 1500)
                    }
                  })()
                }}
              >
                <Copy size={14} aria-hidden="true" />
                {previewCopyState === 'ok'
                  ? 'Copied'
                  : previewCopyState === 'error'
                    ? 'Copy failed'
                    : 'Copy HTML'}
              </button>
            ) : null}
            <button
              type="button"
              data-ec-btn=""
              className="ec-preview-modal__btn"
              data-ec-variant={previewViewport === 'desktop' ? 'primary' : 'ghost'}
              aria-pressed={previewViewport === 'desktop'}
              onClick={() => setPreviewViewport('desktop')}
            >
              <Monitor size={14} aria-hidden="true" />
              Desktop
            </button>
            <button
              type="button"
              data-ec-btn=""
              className="ec-preview-modal__btn"
              data-ec-variant={previewViewport === 'mobile' ? 'primary' : 'ghost'}
              aria-pressed={previewViewport === 'mobile'}
              onClick={() => setPreviewViewport('mobile')}
            >
              <Smartphone size={14} aria-hidden="true" />
              Mobile
            </button>
            <button
              type="button"
              data-ec-btn=""
              className="ec-preview-modal__btn"
              onClick={() => setPreviewDark((x) => !x)}
            >
              {previewDark ? <Sun size={14} aria-hidden="true" /> : <Moon size={14} aria-hidden="true" />}
              {previewDark ? 'Light mode' : 'Dark mode'}
            </button>
            {onTestSend ? (
              <>
                <input
                  data-ec-input=""
                  className="ec-preview-modal__test-input"
                  placeholder="test@company.com"
                  value={testRecipient}
                  onChange={(e) => setTestRecipient(e.target.value)}
                />
                <button
                  type="button"
                  data-ec-btn=""
                  className="ec-preview-modal__btn"
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
                  <Mail size={14} aria-hidden="true" />
                  Send test
                </button>
              </>
            ) : null}
            <button
              type="button"
              data-ec-btn=""
              className="ec-preview-modal__btn"
              onClick={() => setPreviewOpen(false)}
            >
              <X size={14} aria-hidden="true" />
              Close
            </button>
          </div>
          {previewMode === 'rendered' ? (
            <PreviewFrame html={previewHtml} viewport={previewViewport} darkMode={previewDark} />
          ) : previewMode === 'plain' ? (
            <pre className="ec-preview-plain">{previewPlain || 'No plain text output yet.'}</pre>
          ) : (
            <div className="ec-preview-source-wrap">
              {previewSourceHtml ? (
                <div
                  className="ec-preview-source"
                  dangerouslySetInnerHTML={{ __html: previewSourceHtml }}
                />
              ) : (
                <pre className="ec-preview-plain">
                  {previewHtmlProduction || 'No HTML to show.'}
                </pre>
              )}
            </div>
          )}
        </div>
      ) : null}
      <PresetInsertDialog
        preset={pendingPreset}
        onCancel={() => setPendingPreset(null)}
        onChoose={(mode) => {
          if (pendingPreset) applyPreset(pendingPreset, mode)
          setPendingPreset(null)
        }}
      />
      <AlertDialog.Root
        open={exportVariableWarnOpen}
        onOpenChange={(next) => {
          if (!next) setExportVariableWarnOpen(false)
        }}
      >
        <AlertDialog.Portal>
          <AlertDialog.Overlay data-ec-overlay="" />
          <AlertDialog.Content data-ec-alertdialog="">
            <AlertDialog.Title data-ec-alertdialog-title="">
              Export without required variables?
            </AlertDialog.Title>
            <AlertDialog.Description data-ec-alertdialog-body="">
              These variables are marked required in your schema but are not used in this template.
            </AlertDialog.Description>
            <ul className="ec-export-var-warn-list">
              {exportVariableWarnIssues.map((i) => (
                <li key={i.id}>{i.message}</li>
              ))}
            </ul>
            <div data-ec-actions="">
              <AlertDialog.Cancel asChild>
                <button type="button" data-ec-btn="" data-ec-variant="ghost">
                  Return
                </button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <button
                  type="button"
                  data-ec-btn=""
                  data-ec-variant="primary"
                  onClick={(e) => {
                    e.preventDefault()
                    setExportVariableWarnOpen(false)
                    void performProductionExport()
                  }}
                >
                  Continue exporting
                </button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
      <AlertDialog.Root
        open={saveSnippetOpen}
        onOpenChange={(next) => {
          if (!next) {
            setSaveSnippetOpen(false)
            setSaveSnippetBlock(null)
          }
        }}
      >
        <AlertDialog.Portal>
          <AlertDialog.Overlay data-ec-overlay="" />
          <AlertDialog.Content data-ec-alertdialog="">
            <AlertDialog.Title data-ec-alertdialog-title="">Save reusable snippet</AlertDialog.Title>
            <AlertDialog.Description data-ec-alertdialog-body="">
              Give this snippet a name. It will appear under Saved in the left panel.
            </AlertDialog.Description>
            <form
              data-ec-form=""
              onSubmit={(e) => {
                e.preventDefault()
                const trimmed = saveSnippetName.trim()
                if (!trimmed || !saveSnippetBlock) return
                void saveSavedBlock({
                  name: trimmed,
                  visibility: 'personal',
                  snapshot: saveSnippetBlock,
                })
                setSaveSnippetOpen(false)
                setSaveSnippetBlock(null)
              }}
            >
              <label data-ec-field="">
                <span data-ec-label="">Name</span>
                <input
                  data-ec-input=""
                  type="text"
                  autoFocus
                  value={saveSnippetName}
                  maxLength={120}
                  onChange={(e) => setSaveSnippetName(e.target.value)}
                />
              </label>
              <div data-ec-actions="">
                <AlertDialog.Cancel asChild>
                  <button type="button" data-ec-btn="" data-ec-variant="ghost">
                    Cancel
                  </button>
                </AlertDialog.Cancel>
                <button
                  type="submit"
                  data-ec-btn=""
                  data-ec-variant="primary"
                  disabled={!saveSnippetName.trim()}
                >
                  Save
                </button>
              </div>
            </form>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
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
