import * as AlertDialog from '@radix-ui/react-alert-dialog'
import { useState } from 'react'
import { usePanelStore } from '../store'

export function DeleteConfirmDialog() {
  const deleteTargetId = usePanelStore((s) => s.deleteTargetId)
  const templates = usePanelStore((s) => s.templates)
  const setDeleteTarget = usePanelStore((s) => s.setDeleteTarget)
  const remove = usePanelStore((s) => s.remove)

  const template = templates.find((t) => t.id === deleteTargetId) ?? null
  const open = template !== null
  const [busy, setBusy] = useState(false)

  const close = () => {
    if (busy) return
    setDeleteTarget(null)
  }

  const confirm = async () => {
    if (!template) return
    try {
      setBusy(true)
      await remove(template.id)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AlertDialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) close()
      }}
    >
      <AlertDialog.Portal>
        <AlertDialog.Overlay data-ec-overlay="" />
        <AlertDialog.Content data-ec-alertdialog="">
          <AlertDialog.Title data-ec-alertdialog-title="">
            Delete template
          </AlertDialog.Title>
          <AlertDialog.Description data-ec-alertdialog-body="">
            {template
              ? `Are you sure you want to delete "${template.name}"? This cannot be undone.`
              : 'Are you sure you want to delete this template? This cannot be undone.'}
          </AlertDialog.Description>
          <div data-ec-actions="">
            <AlertDialog.Cancel asChild>
              <button
                type="button"
                data-ec-btn=""
                data-ec-variant="ghost"
                disabled={busy}
              >
                Cancel
              </button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <button
                type="button"
                data-ec-btn=""
                data-ec-variant="destructive"
                onClick={(e) => {
                  e.preventDefault()
                  void confirm()
                }}
                disabled={busy}
              >
                {busy ? 'Deleting\u2026' : 'Delete'}
              </button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
