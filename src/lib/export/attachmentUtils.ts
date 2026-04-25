import type { AttachmentItem } from '../types/editorDocument'

export type AttachmentResolvedKind =
  | 'pdf'
  | 'image'
  | 'video'
  | 'archive'
  | 'spreadsheet'
  | 'csv'
  | 'link'

export interface AttachmentRenderHint {
  kind: AttachmentResolvedKind
  download: boolean
  fallbackLabel: string
}

const IMAGE_EXT = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp'])
const VIDEO_EXT = new Set(['mp4', 'mov'])
const ARCHIVE_EXT = new Set(['zip'])
const SPREADSHEET_EXT = new Set(['xlsx'])
const CSV_EXT = new Set(['csv'])

function extFromUrl(url: string): string {
  const clean = url.split('?')[0]?.split('#')[0] ?? ''
  const dot = clean.lastIndexOf('.')
  if (dot < 0) return ''
  return clean.slice(dot + 1).toLowerCase()
}

export function classifyAttachment(url: string): AttachmentRenderHint {
  const ext = extFromUrl(url)
  if (ext === 'pdf') {
    return { kind: 'pdf', download: true, fallbackLabel: 'Open PDF' }
  }
  if (IMAGE_EXT.has(ext)) {
    return { kind: 'image', download: false, fallbackLabel: 'Open Image' }
  }
  if (VIDEO_EXT.has(ext)) {
    return { kind: 'video', download: false, fallbackLabel: 'Watch Video' }
  }
  if (ARCHIVE_EXT.has(ext)) {
    return { kind: 'archive', download: true, fallbackLabel: 'Download Archive' }
  }
  if (SPREADSHEET_EXT.has(ext)) {
    return { kind: 'spreadsheet', download: true, fallbackLabel: 'Download Spreadsheet' }
  }
  if (CSV_EXT.has(ext)) {
    return { kind: 'csv', download: true, fallbackLabel: 'Download CSV' }
  }
  return { kind: 'link', download: false, fallbackLabel: 'Open Link' }
}

function getPathValue(input: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, segment) => {
    if (!acc || typeof acc !== 'object') return undefined
    return (acc as Record<string, unknown>)[segment]
  }, input)
}

export function hydrateAttachmentUrl(
  url: string,
  sampleData?: Record<string, unknown>,
): string {
  if (!sampleData) return url
  return url.replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (_, key: string) => {
    const value = getPathValue(sampleData, key)
    return value == null ? '' : String(value)
  })
}

export function attachmentDisplayLabel(
  item: AttachmentItem,
  hint: AttachmentRenderHint,
): string {
  const label = item.label.trim()
  if (label) return label
  return hint.fallbackLabel
}
