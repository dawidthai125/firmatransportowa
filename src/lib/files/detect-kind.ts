import type { FileViewerKind } from '@/lib/files/types'

const EXT_MAP: Record<string, FileViewerKind> = {
  csv: 'csv',
  pdf: 'pdf',
  png: 'image',
  jpg: 'image',
  jpeg: 'image',
  webp: 'image',
  gif: 'image',
  txt: 'text',
  log: 'text',
  json: 'json',
  html: 'html',
  htm: 'html',
  ddd: 'binary',
  xlsx: 'binary',
  xls: 'binary',
  doc: 'binary',
  docx: 'binary',
}

const MIME_MAP: Record<string, FileViewerKind> = {
  'text/csv': 'csv',
  'application/pdf': 'pdf',
  'image/png': 'image',
  'image/jpeg': 'image',
  'image/webp': 'image',
  'image/gif': 'image',
  'text/plain': 'text',
  'application/json': 'json',
  'text/html': 'html',
}

export function extensionOf(filename: string): string {
  const i = filename.lastIndexOf('.')
  return i >= 0 ? filename.slice(i + 1).toLowerCase() : ''
}

export function detectFileKind(filename: string, mimeType?: string): FileViewerKind {
  if (mimeType && MIME_MAP[mimeType]) return MIME_MAP[mimeType]
  const ext = extensionOf(filename)
  return EXT_MAP[ext] ?? 'binary'
}

export function defaultMimeForKind(kind: FileViewerKind): string {
  switch (kind) {
    case 'csv':
      return 'text/csv;charset=utf-8'
    case 'pdf':
      return 'application/pdf'
    case 'image':
      return 'image/png'
    case 'json':
      return 'application/json'
    case 'html':
      return 'text/html;charset=utf-8'
    case 'text':
      return 'text/plain;charset=utf-8'
    default:
      return 'application/octet-stream'
  }
}
