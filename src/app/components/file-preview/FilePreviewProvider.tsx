import { FilePreviewModal } from '@/app/components/file-preview/FilePreviewModal'
import { storePreviewableFile } from '@/lib/files/files-store'
import type { PreviewableFile } from '@/lib/files/types'
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

interface FilePreviewContextValue {
  openPreview: (file: PreviewableFile, options?: { tenantId?: string; allowSave?: boolean }) => void
  closePreview: () => void
}

const FilePreviewContext = createContext<FilePreviewContextValue | null>(null)

export function FilePreviewProvider({ children }: { children: ReactNode }) {
  const [file, setFile] = useState<PreviewableFile | null>(null)
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [allowSave, setAllowSave] = useState(false)
  const [saving, setSaving] = useState(false)

  const openPreview = useCallback(
    (next: PreviewableFile, options?: { tenantId?: string; allowSave?: boolean }) => {
      setFile(next)
      setTenantId(options?.tenantId ?? null)
      setAllowSave(options?.allowSave ?? (next.source === 'export' || next.source === 'import'))
    },
    [],
  )

  const closePreview = useCallback(() => {
    setFile(null)
    setTenantId(null)
    setAllowSave(false)
  }, [])

  async function handleSaveToLibrary() {
    if (!file || !tenantId) return
    setSaving(true)
    try {
      await storePreviewableFile(tenantId, { ...file, source: 'library' })
      closePreview()
    } finally {
      setSaving(false)
    }
  }

  const value = useMemo(
    () => ({ openPreview, closePreview }),
    [openPreview, closePreview],
  )

  return (
    <FilePreviewContext.Provider value={value}>
      {children}
      <FilePreviewModal
        file={file}
        onClose={closePreview}
        onSaveToLibrary={allowSave && tenantId ? handleSaveToLibrary : undefined}
        saving={saving}
      />
    </FilePreviewContext.Provider>
  )
}

export function useFilePreview(): FilePreviewContextValue {
  const ctx = useContext(FilePreviewContext)
  if (!ctx) throw new Error('useFilePreview wymaga FilePreviewProvider')
  return ctx
}
