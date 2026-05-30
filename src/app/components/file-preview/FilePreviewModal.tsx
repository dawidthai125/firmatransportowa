import { Button } from '@/app/components/ui/Button'
import { FileViewerRouter } from '@/app/components/file-viewers/FileViewerRouter'
import { triggerFileDownload } from '@/lib/files/download'
import { FILE_KIND_LABELS, type PreviewableFile } from '@/lib/files/types'
import { cn } from '@/lib/utils'
import { Download, Printer, X } from 'lucide-react'

interface FilePreviewModalProps {
  file: PreviewableFile | null
  onClose: () => void
  onSaveToLibrary?: () => void
  saving?: boolean
}

export function FilePreviewModal({ file, onClose, onSaveToLibrary, saving }: FilePreviewModalProps) {
  if (!file) return null

  function handlePrint() {
    if (file!.kind === 'html' && file!.textContent) {
      const w = window.open('', '_blank')
      if (w) {
        w.document.write(file!.textContent)
        w.document.close()
        w.print()
      }
      return
    }
    if (file!.kind === 'pdf') {
      window.open(URL.createObjectURL(resolveBlobForPrint(file!)), '_blank')
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4">
      <div className="flex max-h-[96dvh] w-full max-w-4xl flex-col overflow-hidden rounded-t-xl border border-border bg-background shadow-xl sm:rounded-xl">
        <header className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{file.label ?? file.filename}</p>
            <p className="truncate text-xs text-muted-foreground">
              {FILE_KIND_LABELS[file.kind]} · {file.filename}
              {file.sizeBytes != null && ` · ${(file.sizeBytes / 1024).toFixed(1)} KB`}
            </p>
          </div>
          <div className="flex flex-wrap gap-1">
            {(file.kind === 'html' || file.kind === 'pdf') && (
              <Button variant="ghost" size="sm" className="gap-1" onClick={handlePrint}>
                <Printer className="h-4 w-4" />
                Drukuj
              </Button>
            )}
            <Button variant="secondary" size="sm" className="gap-1" onClick={() => triggerFileDownload(file)}>
              <Download className="h-4 w-4" />
              Pobierz
            </Button>
            {onSaveToLibrary && (
              <Button variant="secondary" size="sm" onClick={onSaveToLibrary} disabled={saving}>
                {saving ? 'Zapisywanie…' : 'Do biblioteki'}
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Zamknij">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </header>
        <div className={cn('scroll-area min-h-0 flex-1 p-4')}>
          <FileViewerRouter file={file} />
        </div>
      </div>
    </div>
  )
}

function resolveBlobForPrint(file: PreviewableFile): Blob {
  if (file.blob) return file.blob
  return new Blob([file.textContent ?? ''], { type: file.mimeType })
}
