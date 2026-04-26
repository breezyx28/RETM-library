import * as AlertDialog from '@radix-ui/react-alert-dialog'
import type { EmailPreset } from './presets/emailPresets'

export type PresetInsertMode = 'cursor' | 'replace'

export interface PresetInsertDialogProps {
  preset: EmailPreset | null
  onChoose: (mode: PresetInsertMode) => void
  onCancel: () => void
}

export function PresetInsertDialog({ preset, onChoose, onCancel }: PresetInsertDialogProps) {
  const open = preset !== null

  return (
    <AlertDialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel()
      }}
    >
      <AlertDialog.Portal>
        <AlertDialog.Overlay data-ec-overlay="" />
        <AlertDialog.Content data-ec-alertdialog="">
          <AlertDialog.Title data-ec-alertdialog-title="">
            Insert template
          </AlertDialog.Title>
          <AlertDialog.Description data-ec-alertdialog-body="">
            {preset
              ? `How do you want to add the "${preset.name}" template?`
              : 'How do you want to add this template?'}
          </AlertDialog.Description>
          <div data-ec-actions="">
            <AlertDialog.Cancel asChild>
              <button type="button" data-ec-btn="" data-ec-variant="ghost">
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
                  onChoose('replace')
                }}
              >
                Replace canvas
              </button>
            </AlertDialog.Action>
            <AlertDialog.Action asChild>
              <button
                type="button"
                data-ec-btn=""
                data-ec-variant="primary"
                onClick={(e) => {
                  e.preventDefault()
                  onChoose('cursor')
                }}
              >
                Insert at cursor
              </button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
