import filePdfIcon from '../../assets/file-type-icons/text_line_pdf.svg'
import fileTextIcon from '../../assets/file-type-icons/text_line_txt.svg'

export interface AttachmentFileVisual {
  extensionLabel: string
  iconSrc: string
  tone: 'pdf' | 'excel' | 'word' | 'ppt' | 'other'
}

const WORD_EXT = new Set(['doc', 'docx', 'rtf', 'odt'])
const EXCEL_EXT = new Set(['xls', 'xlsx', 'ods'])
const CSV_EXT = new Set(['csv', 'tsv'])
const POWERPOINT_EXT = new Set(['ppt', 'pptx', 'odp'])
const ARCHIVE_EXT = new Set(['zip', 'rar', '7z', 'gz', 'tar'])
const IMAGE_EXT = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'])
const VIDEO_EXT = new Set(['mp4', 'mov', 'avi', 'm4v', 'webm'])
const TEXT_EXT = new Set(['txt', 'md', 'ics'])

function extFromUrl(url: string): string {
  const clean = url.split('?')[0]?.split('#')[0] ?? ''
  const dot = clean.lastIndexOf('.')
  if (dot < 0) return ''
  return clean.slice(dot + 1).toLowerCase()
}

export function resolveAttachmentFileVisual(url: string): AttachmentFileVisual {
  const ext = extFromUrl(url)
  if (ext === 'pdf') return { extensionLabel: 'PDF', iconSrc: filePdfIcon, tone: 'pdf' }
  if (WORD_EXT.has(ext)) return { extensionLabel: ext.toUpperCase(), iconSrc: fileTextIcon, tone: 'word' }
  if (EXCEL_EXT.has(ext)) return { extensionLabel: ext.toUpperCase(), iconSrc: fileTextIcon, tone: 'excel' }
  if (CSV_EXT.has(ext)) return { extensionLabel: ext.toUpperCase(), iconSrc: fileTextIcon, tone: 'excel' }
  if (POWERPOINT_EXT.has(ext)) {
    return { extensionLabel: ext.toUpperCase(), iconSrc: fileTextIcon, tone: 'ppt' }
  }
  if (ARCHIVE_EXT.has(ext)) {
    return { extensionLabel: ext.toUpperCase(), iconSrc: fileTextIcon, tone: 'other' }
  }
  if (IMAGE_EXT.has(ext)) return { extensionLabel: ext.toUpperCase(), iconSrc: fileTextIcon, tone: 'other' }
  if (VIDEO_EXT.has(ext)) return { extensionLabel: ext.toUpperCase(), iconSrc: fileTextIcon, tone: 'other' }
  if (TEXT_EXT.has(ext)) return { extensionLabel: ext.toUpperCase(), iconSrc: fileTextIcon, tone: 'other' }
  if (ext) return { extensionLabel: ext.toUpperCase(), iconSrc: fileTextIcon, tone: 'other' }
  return { extensionLabel: 'FILE', iconSrc: fileTextIcon, tone: 'other' }
}
