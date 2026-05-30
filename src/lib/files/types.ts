/** Typ podglądu — każdy ma dedykowany viewer w aplikacji */
export type FileViewerKind = 'csv' | 'pdf' | 'image' | 'text' | 'json' | 'html' | 'binary'

export type FileSource = 'export' | 'import' | 'library'

export interface PreviewableFile {
  id?: string
  filename: string
  kind: FileViewerKind
  mimeType: string
  /** Treść tekstowa — CSV, JSON, HTML, TXT */
  textContent?: string
  /** Plik binarny do podglądu (PDF, obraz) */
  blob?: Blob
  source: FileSource
  createdAt?: string
  /** Opis w UI, np. „Raport dzienny — maj 2026” */
  label?: string
  /** Rozmiar w bajtach (import / biblioteka) */
  sizeBytes?: number
}

export interface StoredTenantFile {
  id: string
  tenantId: string
  filename: string
  kind: FileViewerKind
  mimeType: string
  /** base64 — małe pliki w localStorage / sync */
  dataBase64: string
  label?: string
  tags?: string[]
  importedAt: string
}

export const FILE_KIND_LABELS: Record<FileViewerKind, string> = {
  csv: 'Arkusz CSV',
  pdf: 'Dokument PDF',
  image: 'Obraz',
  text: 'Tekst',
  json: 'JSON',
  html: 'Raport HTML',
  binary: 'Plik binarny',
}
