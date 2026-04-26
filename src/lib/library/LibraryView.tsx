import { useCallback } from 'react'
import { useMemo, useState } from 'react'
import { usePanelStore } from '../store'
import { usePanelConfig } from '../context/PanelConfigContext'
import { exportTemplate } from '../export'
import { migrateEditorJson } from '../types/editorDocument'
import { EmptyState } from './EmptyState'
import { NewTemplateButton } from './NewTemplateButton'
import { TemplateCard } from './TemplateCard'

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

  return (
    <div data-ec-library="">
      <header data-ec-library-head="">
        <div>
          <h2 data-ec-library-title="">Templates</h2>
          <p data-ec-library-subtitle="">
            {loading
              ? 'Loading templates\u2026'
              : `${visibleTemplates.length} ${visibleTemplates.length === 1 ? 'template' : 'templates'}`}
          </p>
        </div>
        <NewTemplateButton onCreate={handleCreate} disabled={loading || userRole === 'viewer'} />
      </header>
      {organizationMode !== 'folders' ? (
        <label data-ec-field="" data-ec-library-filter="">
          <span data-ec-label="">Tag filter</span>
          <input
            data-ec-input=""
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            placeholder="Filter by tag..."
          />
        </label>
      ) : null}

      {error ? (
        <div data-ec-alert="" data-ec-variant="error" role="alert">
          {error}
        </div>
      ) : null}

      {!loading && visibleTemplates.length === 0 ? (
        <EmptyState onCreate={handleCreate} />
      ) : (
        <div data-ec-grid="">
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
                <div className="ec-rfield-inline" data-ec-library-actions="">
                  {template.status === 'draft' ? (
                    <button
                      type="button"
                      data-ec-btn=""
                      data-ec-variant="ghost"
                      onClick={() => void setStatus(template.id, 'pending_review')}
                    >
                      Submit review
                    </button>
                  ) : null}
                  {template.status === 'pending_review' && userRole === 'admin' ? (
                    <>
                      <button
                        type="button"
                        data-ec-btn=""
                        onClick={() => void setStatus(template.id, 'published')}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        data-ec-btn=""
                        data-ec-variant="ghost"
                        onClick={() => {
                          const note = window.prompt('Rejection note', 'Please update details.')
                          void setStatus(template.id, 'draft', note ?? undefined)
                        }}
                      >
                        Reject
                      </button>
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
