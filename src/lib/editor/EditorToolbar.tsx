import { ArrowLeft, Download, MonitorPlay, Redo2, Save, Undo2 } from 'lucide-react'

export function EditorToolbar({
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
  return (
    <div data-ec-toolbar="" className="ec-toolbar">
      <div className="ec-toolbar__left">
        <button
          type="button"
          data-ec-btn=""
          data-ec-variant="ghost"
          onClick={onBack}
        >
          <ArrowLeft size={16} />
          Library
        </button>
      </div>
      <div className="ec-toolbar__right">
        <button type="button" data-ec-btn="" onClick={onUndo} disabled={!canUndo}>
          <Undo2 size={16} />
          Undo
        </button>
        <button type="button" data-ec-btn="" onClick={onRedo} disabled={!canRedo}>
          <Redo2 size={16} />
          Redo
        </button>
        <button type="button" data-ec-btn="" onClick={onPreview}>
          <MonitorPlay size={16} />
          Preview
        </button>
        <button type="button" data-ec-btn="" onClick={onExport}>
          <Download size={16} />
          Export
        </button>
        <button
          type="button"
          data-ec-btn=""
          data-ec-variant="primary"
          onClick={onSave}
          disabled={readOnly || saving}
        >
          <Save size={16} />
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  )
}
