import { extensionOf } from '@/lib/files/detect-kind'
import type { PreviewableFile } from '@/lib/files/types'
import { FileWarning } from 'lucide-react'

interface BinaryFileViewerProps {
  file: PreviewableFile
}

export function BinaryFileViewer({ file }: BinaryFileViewerProps) {
  const ext = extensionOf(file.filename)
  const isTachograph = ext === 'ddd'

  return (
    <div className="flex flex-col items-center gap-4 rounded-md border border-border bg-muted/20 p-8 text-center">
      <FileWarning className="h-12 w-12 text-muted-foreground" />
      <div>
        <p className="font-medium">{file.filename}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {isTachograph
            ? 'Plik tachografu (DDD) — pobierz i otwórz w dedykowanym oprogramowaniu.'
            : ext === 'xlsx' || ext === 'xls'
              ? 'Arkusz Excel — pobierz i otwórz w Excel / LibreOffice.'
              : 'Podgląd niedostępny dla tego typu pliku.'}
        </p>
        {file.sizeBytes != null && (
          <p className="mt-2 text-xs text-muted-foreground">
            Rozmiar: {(file.sizeBytes / 1024).toFixed(1)} KB
          </p>
        )}
      </div>
      <p className="text-xs text-muted-foreground">Użyj przycisku „Pobierz” powyżej.</p>
    </div>
  )
}
