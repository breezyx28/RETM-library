import { useMemo } from 'react'
import type { EmailTemplatePanelProps } from './EmailTemplatePanel.types'
import { ThemeRoot } from '../../lib/theme'
import { PanelShell } from '../../lib/dialog'
import { createAdapter } from '../../lib/storage'
import { PanelStoreProvider, usePanelStore } from '../../lib/store'
import { LibraryView, RenameDialog, DeleteConfirmDialog } from '../../lib/library'
import { PanelConfigProvider } from '../../lib/context/PanelConfigContext'
import { TemplateEditor } from '../../lib/editor/TemplateEditor'
import { cn } from '../../utils/cn'

/**
 * `<EmailTemplatePanel>` — authoring surface for operation teams (spec §3.1, §6).
 *
 * Composition:
 *   ThemeRoot            -> applies --ec-* variables + theme attributes
 *     PanelStoreProvider -> per-instance zustand store (templates, view, dialogs)
 *       PanelShell       -> Dialog wrapper or inline section
 *         <PanelBody />  -> switches on store.view (library | editor)
 *
 * Slice A only renders the library view + a placeholder editor. The full
 * TipTap-based editor lands in Slice B.
 */
export function EmailTemplatePanel(props: EmailTemplatePanelProps) {
  const {
    theme = 'default',
    themeOverride,
    headless = false,
    className,

    variableSchema,
    tokenFormat = 'handlebars',
    customTokenFormat,
    sampleData,
    readOnly = false,
    onExport,
    onTestSend,

    storageMode = 'local',
    storageKey,
    onSave,
    onLoad,
    onDelete,
    onListVersions,
    onGetVersion,
    onSaveVersion,
    onListSavedBlocks,
    onSaveSavedBlock,
    onDeleteSavedBlock,

    defaultLanguage = 'en',
    userRole = 'admin',
    publishMode = 'direct',
    organizationMode = 'both',

    asDialog = true,
    open,
    defaultOpen,
    onOpenChange,
    trigger,
  } = props

  const adapter = useMemo(
    () =>
      createAdapter({
        mode: storageMode,
        storageKey,
        callbacks: {
          onSave,
          onLoad,
          onDelete,
          onListVersions,
          onGetVersion,
          onSaveVersion,
          onListSavedBlocks,
          onSaveSavedBlock,
          onDeleteSavedBlock,
        },
      }),
    [
      storageMode,
      storageKey,
      onSave,
      onLoad,
      onDelete,
      onListVersions,
      onGetVersion,
      onSaveVersion,
      onListSavedBlocks,
      onSaveSavedBlock,
      onDeleteSavedBlock,
    ],
  )

  return (
    <ThemeRoot
      theme={theme}
      themeOverride={themeOverride}
      headless={headless}
      className={cn('ec-panel-root', className)}
      dataScope="panel"
    >
      <div data-ec-panel="">
        <PanelConfigProvider
          variableSchema={variableSchema}
          tokenFormat={tokenFormat}
          customTokenFormat={customTokenFormat}
          sampleData={sampleData}
          readOnly={readOnly}
          onExport={onExport}
          onTestSend={onTestSend}
          userRole={userRole}
          publishMode={publishMode}
          organizationMode={organizationMode}
        >
          <PanelStoreProvider
            adapter={adapter}
            defaultLanguage={defaultLanguage}
          >
            <PanelShell
              asDialog={asDialog}
              open={open}
              defaultOpen={defaultOpen}
              onOpenChange={onOpenChange}
              trigger={trigger}
            >
              <PanelBody />
              <RenameDialog />
              <DeleteConfirmDialog />
            </PanelShell>
          </PanelStoreProvider>
        </PanelConfigProvider>
      </div>
    </ThemeRoot>
  )
}

function PanelBody() {
  const view = usePanelStore((s) => s.view)

  return (
    <div data-ec-panel-body="" data-ec-view={view}>
      {view === 'library' ? <LibraryView /> : <TemplateEditor />}
    </div>
  )
}
