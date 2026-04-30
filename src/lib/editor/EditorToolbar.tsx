import {
  ArrowLeft,
  Download,
  MonitorPlay,
  Redo2,
  Save,
  Undo2,
} from 'lucide-react'
import { useSlot } from '../theme'
import { Btn } from '../ui'
import { cn } from '../../utils/cn'

export function EditorToolbar({
  templateName,
  onBack,
  onSave,
  onPreview,
  onExport,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  readOnly,
  saving,
}: {
  templateName: string
  onBack: () => void
  onSave: () => void
  onPreview: () => void
  onExport: () => void
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
  readOnly: boolean
  saving: boolean
}) {
  const [t, u] = useSlot('editor.toolbar')

  return (
    <div data-ec-toolbar="" className={cn('ec-toolbar', t, u)}>
      <div className="ec-toolbar__left">
        <div className="ec-toolbar__brand">
          <Btn
            variant="ghost"
            onClick={onBack}
            className="ec-toolbar__brand-btn"
            aria-label="Back to library"
            title="Back to library"
          >
            <ArrowLeft size={15} />
            Scribe
          </Btn>
          <p className="ec-toolbar__crumb">
            <span>My Templates</span>
            <span>/</span>
            <strong>{templateName || 'Untitled'}</strong>
          </p>
        </div>
      </div>
      <div className="ec-toolbar__right">
        <Btn onClick={onUndo} disabled={!canUndo} aria-label="Undo" title="Undo">
          <Undo2 size={16} />
        </Btn>
        <Btn onClick={onRedo} disabled={!canRedo} aria-label="Redo" title="Redo">
          <Redo2 size={16} />
        </Btn>
        <Btn
          variant="ghost"
          onClick={onPreview}
          aria-label="Preview"
          title="Preview"
        >
          <MonitorPlay size={16} />
        </Btn>
        <Btn
          variant="ghost"
          onClick={onExport}
          aria-label="Export"
          title="Export"
        >
          <Download size={16} />
        </Btn>
        <Btn
          variant="primary"
          onClick={onSave}
          disabled={readOnly || saving}
          aria-label={saving ? 'Saving' : 'Save'}
          title={saving ? 'Saving' : 'Save'}
        >
          <Save size={16} />
        </Btn>
      </div>
    </div>
  )
}
