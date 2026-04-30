import { useCallback } from 'react'
import { useMemo, useState } from 'react'
import { usePanelStore } from '../store'
import { usePanelConfig } from '../context/PanelConfigContext'
import { exportTemplate } from '../export'
import { migrateEditorJson } from '../types/editorDocument'
import { EmptyState } from './EmptyState'
import { NewTemplateButton } from './NewTemplateButton'
import { TemplateCard } from './TemplateCard'
import { useSlot } from '../theme'
import { Btn, Field, LabelText, Input, Alert } from '../ui'
import { cn } from '../../utils/cn'

export function LibraryView() {
  const templates = usePanelStore((s) => s.templates)
  const loading = usePanelStore((s) => s.loading)
  const error = usePanelStore((s) => s.error)

  const createBlank = usePanelStore((s) => s.createBlank)
  const duplicate = usePanelStore((s) => s.duplicate)
  const openEditor = usePanelStore((s) => s.openEditor)
  const setRenameTarget = usePanelStore((s) => s.setRenameTarget)
  const setDeleteTarget = usePanelStore((s) => s.setDeleteTarget)
  const setStatus = usePanelStore((s) => s.setStatus)
  const { variableSchema, tokenFormat, customTokenFormat, sampleData, onExport } =
    usePanelConfig()
  const { userRole, publishMode, organizationMode } = usePanelConfig()
  const [tagFilter, setTagFilter] = useState('')
  const visibleTemplates = useMemo(() => {
    if (organizationMode === 'folders') return templates
    if (!tagFilter) return templates
    return templates.filter((t) => (t.tags ?? []).includes(tagFilter))
  }, [templates, organizationMode, tagFilter])


  const handleCreate = async () => {
    const id = await createBlank()
    openEditor(id)
  }

  const buildExport = useCallback(
    (templateId: string, mode: 'production' | 'plain') => {
      const template = templates.find((t) => t.id === templateId)
      if (!template) return null
      const language = template.defaultLanguage
      const variant = template.languages[language]
      const document = migrateEditorJson(variant?.editorJson)
      return exportTemplate(
        {
          templateId: template.id,
          templateName: template.name,
          language,
          subject: variant?.subject ?? '',
          preheader: variant?.preheader ?? '',
          tags: template.tags,
          createdAt: template.createdAt,
          updatedAt: template.updatedAt,
          document,
          variableSchema,
          tokenFormat,
          customTokenFormat,
          sampleData,
        },
        mode,
      )
    },
    [templates, variableSchema, tokenFormat, customTokenFormat, sampleData],
  )

  const downloadHtml = (filename: string, html: string) => {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const previewHtml = (html: string) => {
    const win = window.open('', '_blank', 'noopener,noreferrer')
    if (!win) return
    win.document.open()
    win.document.write(html)
    win.document.close()
  }

  const [rootT, rootU] = useSlot('library.root')
  const [headT, headU] = useSlot('library.head')
  const [titleT, titleU] = useSlot('library.title')
  const [subtitleT, subtitleU] = useSlot('library.subtitle')
  const [filterT, filterU] = useSlot('library.filter')
  const [actionsT, actionsU] = useSlot('library.actions')
  const [gridT, gridU] = useSlot('library.grid')

  return (
    <div data-ec-library="" className={cn(rootT, rootU)}>
      <header data-ec-library-head="" className={cn(headT, headU)}>
        <div>
          <h2 data-ec-library-title="" className={cn(titleT, titleU)}>
            Templates
          </h2>
          <p data-ec-library-subtitle="" className={cn(subtitleT, subtitleU)}>
            {loading
              ? 'Loading templates\u2026'
              : `${visibleTemplates.length} ${visibleTemplates.length === 1 ? 'template' : 'templates'}`}
          </p>
        </div>
        <NewTemplateButton onCreate={handleCreate} disabled={loading || userRole === 'viewer'} />
      </header>
      {organizationMode !== 'folders' ? (
        <Field data-ec-library-filter="" className={cn(filterT, filterU)}>
          <LabelText>Tag filter</LabelText>
          <Input
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            placeholder="Filter by tag..."
          />
        </Field>
      ) : null}

      {error ? (
        <Alert variant="error" role="alert">
          {error}
        </Alert>
      ) : null}

      {!loading && visibleTemplates.length === 0 ? (
        <EmptyState onCreate={handleCreate} />
      ) : (
        <div data-ec-grid="" className={cn(gridT, gridU)}>
          {visibleTemplates.map((template) => (
            <div key={template.id}>
              <TemplateCard
                template={template}
                thumbnailHtml={buildExport(template.id, 'plain')?.html}
                canEdit={userRole !== 'viewer'}
                canDelete={userRole === 'admin'}
                canMoveFolder={organizationMode !== 'tags' && userRole !== 'viewer'}
                onEdit={() => {
                  if (userRole === 'viewer') return
                  openEditor(template.id)
                }}
                onPreview={() => {
                  const artifacts = buildExport(template.id, 'plain')
                  if (!artifacts) return
                  onExport?.(artifacts)
                }}
                onPreviewHtml={() => {
                  const artifacts = buildExport(template.id, 'plain')
                  if (!artifacts) return
                  previewHtml(artifacts.html)
                }}
                onExportHtml={() => {
                  const artifacts = buildExport(template.id, 'production')
                  if (!artifacts) return
                  onExport?.(artifacts)
                  downloadHtml(`${template.name}.html`, artifacts.html)
                }}
                onDuplicate={() => void duplicate(template.id)}
                onRename={() => {
                  if (userRole === 'viewer') return
                  setRenameTarget(template.id)
                }}
                onDelete={() => {
                  if (userRole !== 'admin') return
                  setDeleteTarget(template.id)
                }}
              />
              {publishMode === 'approval' && userRole !== 'viewer' ? (
                <div
                  className={cn('ec-rfield-inline', actionsT, actionsU)}
                  data-ec-library-actions=""
                >
                  {template.status === 'draft' ? (
                    <Btn
                      variant="ghost"
                      onClick={() => void setStatus(template.id, 'pending_review')}
                    >
                      Submit review
                    </Btn>
                  ) : null}
                  {template.status === 'pending_review' && userRole === 'admin' ? (
                    <>
                      <Btn
                        onClick={() => void setStatus(template.id, 'published')}
                      >
                        Approve
                      </Btn>
                      <Btn
                        variant="ghost"
                        onClick={() => {
                          const note = window.prompt('Rejection note', 'Please update details.')
                          void setStatus(template.id, 'draft', note ?? undefined)
                        }}
                      >
                        Reject
                      </Btn>
                    </>
                  ) : null}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
