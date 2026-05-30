import { detectFileKind, defaultMimeForKind } from '@/lib/files/detect-kind'
import type { PreviewableFile } from '@/lib/files/types'

export function triggerFileDownload(file: PreviewableFile): void {
  const blob = resolveBlob(file)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = file.filename
  a.click()
  URL.revokeObjectURL(url)
}

export function resolveBlob(file: PreviewableFile): Blob {
  if (file.blob) return file.blob
  const content = file.textContent ?? ''
  return new Blob([content], { type: file.mimeType })
}

export async function fileFromInput(file: File): Promise<PreviewableFile> {
  const kind = detectFileKind(file.name, file.type || undefined)
  const base: PreviewableFile = {
    filename: file.name,
    kind,
    mimeType: file.type || defaultMimeForKind(kind),
    source: 'import',
    createdAt: new Date().toISOString(),
    sizeBytes: file.size,
  }

  if (kind === 'csv' || kind === 'text' || kind === 'json' || kind === 'html') {
    return { ...base, textContent: await file.text() }
  }

  return { ...base, blob: file }
}
