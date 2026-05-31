import { Button } from '@/app/components/ui/Button'
import { Card, CardContent } from '@/app/components/ui/Card'
import { ImportFileZone } from '@/app/components/file-preview/ImportFileZone'
import { useFilePreview } from '@/app/components/file-preview/FilePreviewProvider'
import { FILE_KIND_LABELS } from '@/lib/files/types'
import {
  deleteTenantFile,
  loadTenantFiles,
  seedDemoTenantFiles,
  storedToPreviewable,
} from '@/lib/files/files-store'
import { useCloudSyncRefresh } from '@/lib/sync/useCloudSyncRefresh'
import { cn } from '@/lib/utils'
import { Eye, FileText, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import type { StoredTenantFile } from '@/lib/files/types'

interface FilesViewProps {
  tenantId: string
}

export function FilesView({ tenantId }: FilesViewProps) {
  const [files, setFiles] = useState<StoredTenantFile[]>([])
  const { openPreview } = useFilePreview()

  const refresh = useCallback(async () => {
    await seedDemoTenantFiles(tenantId)
    setFiles(loadTenantFiles(tenantId))
  }, [tenantId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useCloudSyncRefresh(tenantId, 'files', () => {
    void refresh()
  })

  function openFile(stored: StoredTenantFile) {
    openPreview(storedToPreviewable(stored), { tenantId, allowSave: false })
  }

  function removeFile(id: string) {
    if (!confirm('Usunąć plik z biblioteki?')) return
    deleteTenantFile(tenantId, id)
    setFiles(loadTenantFiles(tenantId))
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Pliki i dokumenty</h1>
          <p className="text-sm text-muted-foreground">
            Import CMR, PDF, CSV, skany — podgląd w aplikacji + pobieranie
          </p>
        </div>
        <ImportFileZone tenantId={tenantId} />
      </div>

      {files.length === 0 ? (
        <Card>
          <CardContent className="flex items-center gap-3 p-6 text-muted-foreground">
            <FileText className="h-8 w-8" />
            <div>
              <p className="font-medium text-foreground">Brak plików</p>
              <p className="text-sm">Importuj PDF (CMR), CSV lub zdjęcie dokumentu.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {files.map((f) => (
            <Card key={f.id}>
              <CardContent className="flex flex-wrap items-center gap-3 p-4">
                <FileText className="h-5 w-5 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{f.label ?? f.filename}</p>
                  <p className="text-xs text-muted-foreground">
                    {FILE_KIND_LABELS[f.kind]} · {new Date(f.importedAt).toLocaleString('pl-PL')}
                    {f.tags?.length ? ` · ${f.tags.join(', ')}` : ''}
                  </p>
                </div>
                <span className={cn('rounded-full bg-muted px-2 py-0.5 text-xs')}>{f.filename}</span>
                <Button variant="secondary" size="sm" className="gap-1" onClick={() => openFile(f)}>
                  <Eye className="h-4 w-4" />
                  Podgląd
                </Button>
                <Button variant="ghost" size="icon" onClick={() => removeFile(f.id)}>
                  <Trash2 className="h-4 w-4 text-danger" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
