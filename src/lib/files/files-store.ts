import { blobToBase64, base64ToBlob, base64ToText, textToBase64 } from '@/lib/files/blob-store'
import { buildSimplePdf } from '@/lib/files/pdf-builder'
import type { PreviewableFile, StoredTenantFile } from '@/lib/files/types'
import { readTenantData, writeTenantData } from '@/lib/tenant/storage'

const MAX_FILE_BYTES = 512 * 1024

export function loadTenantFiles(tenantId: string): StoredTenantFile[] {
  return readTenantData<StoredTenantFile[]>(tenantId, 'files', [])
}

export function saveTenantFiles(tenantId: string, files: StoredTenantFile[]): void {
  writeTenantData(tenantId, 'files', files)
}

export async function storePreviewableFile(
  tenantId: string,
  file: PreviewableFile,
  tags?: string[],
): Promise<StoredTenantFile> {
  let dataBase64: string
  let sizeBytes = file.sizeBytes ?? 0

  if (file.textContent != null) {
    dataBase64 = textToBase64(file.textContent)
    sizeBytes = new TextEncoder().encode(file.textContent).length
  } else if (file.blob) {
    sizeBytes = file.blob.size
    if (sizeBytes > MAX_FILE_BYTES) {
      throw new Error(`Plik za duży (max ${MAX_FILE_BYTES / 1024} KB)`)
    }
    dataBase64 = await blobToBase64(file.blob)
  } else {
    throw new Error('Brak treści pliku')
  }

  const stored: StoredTenantFile = {
    id: crypto.randomUUID(),
    tenantId,
    filename: file.filename,
    kind: file.kind,
    mimeType: file.mimeType,
    dataBase64,
    label: file.label,
    tags,
    importedAt: new Date().toISOString(),
  }

  const files = loadTenantFiles(tenantId)
  saveTenantFiles(tenantId, [stored, ...files])
  return stored
}

export function storedToPreviewable(stored: StoredTenantFile): PreviewableFile {
  const textKinds = new Set(['csv', 'text', 'json', 'html'])
  if (textKinds.has(stored.kind)) {
    return {
      id: stored.id,
      filename: stored.filename,
      kind: stored.kind,
      mimeType: stored.mimeType,
      textContent: base64ToText(stored.dataBase64),
      source: 'library',
      createdAt: stored.importedAt,
      label: stored.label,
      sizeBytes: stored.dataBase64.length,
    }
  }
  const blob = base64ToBlob(stored.dataBase64, stored.mimeType)
  return {
    id: stored.id,
    filename: stored.filename,
    kind: stored.kind,
    mimeType: stored.mimeType,
    blob,
    source: 'library',
    createdAt: stored.importedAt,
    label: stored.label,
    sizeBytes: blob.size,
  }
}

export function deleteTenantFile(tenantId: string, fileId: string): void {
  saveTenantFiles(
    tenantId,
    loadTenantFiles(tenantId).filter((f) => f.id !== fileId),
  )
}

export async function seedDemoTenantFiles(tenantId: string): Promise<void> {
  const existing = loadTenantFiles(tenantId)
  if (existing.length > 0) return

  const cmrLines = [
    'TransFlow — przykladowy dokument CMR',
    'Numer: CMR/2026/004521',
    'Nadawca: AutoParts Wroclaw',
    'Odbiorca: Logistik GmbH Berlin',
    'Trasa: Wroclaw (PL) -> Berlin (DE)',
  ]
  const blob = buildSimplePdf(cmrLines)
  const dataBase64 = await blobToBase64(blob)
  const demo: StoredTenantFile = {
    id: 'file-demo-cmr',
    tenantId,
    filename: 'CMR-2026-004521-demo.pdf',
    kind: 'pdf',
    mimeType: 'application/pdf',
    dataBase64,
    label: 'Przykładowy CMR (demo)',
    tags: ['cmr', 'demo'],
    importedAt: new Date().toISOString(),
  }
  saveTenantFiles(tenantId, [demo])
}
