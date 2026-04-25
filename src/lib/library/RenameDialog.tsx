import * as AlertDialog from '@radix-ui/react-alert-dialog'
import { useEffect, useState } from 'react'
import { usePanelStore } from '../store'

export function RenameDialog() {
  const renameTargetId = usePanelStore((s) => s.renameTargetId)
  const templates = usePanelStore((s) => s.templates)
  const setRenameTarget = usePanelStore((s) => s.setRenameTarget)
  const rename = usePanelStore((s) => s.rename)

  const template = templates.find((t) => t.id === renameTargetId) ?? null
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setName(template?.name ?? '')
  }, [template?.id, template?.name])

  const open = template !== null

  const close = () => {
    if (busy) return
    setRenameTarget(null)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!template) return
    const trimmed = name.trim()
    if (!trimmed || trimmed === template.name) {
      close()
      return
    }
    try {
      setBusy(true)
      await rename(template.id, trimmed)
    } finally {
      setBusy(false)
      setRenameTarget(null)
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
            Rename template
          </AlertDialog.Title>
          <AlertDialog.Description data-ec-alertdialog-body="">
            Give the template a new name. Existing exports and data are not
            affected.
          </AlertDialog.Description>
          <form onSubmit={submit} data-ec-form="">
            <label data-ec-field="">
              <span data-ec-label="">Name</span>
              <input
                data-ec-input=""
                type="text"
                autoFocus
                value={name}
                maxLength={120}
                onChange={(e) => setName(e.target.value)}
                disabled={busy}
              />
            </label>
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
              <button
                type="submit"
                data-ec-btn=""
                data-ec-variant="primary"
                disabled={busy || !name.trim()}
              >
                {busy ? 'Saving\u2026' : 'Save'}
              </button>
            </div>
          </form>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
