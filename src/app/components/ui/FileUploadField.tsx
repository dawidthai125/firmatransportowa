import { Button } from '@/app/components/ui/Button'
import { storePreviewableFile } from '@/lib/files/files-store'
import type { PreviewableFile } from '@/lib/files/types'
import { cn } from '@/lib/utils'
import { Paperclip, X } from 'lucide-react'
import { useRef, useState } from 'react'

interface FileUploadFieldProps {
  tenantId: string
  accept?: string
  tags?: string[]
  label?: string
  onUploaded: (fileId: string, filename: string) => void
  onClear?: () => void
  className?: string
}

function kindFromMime(mime: string): PreviewableFile['kind'] {
  if (mime.includes('pdf')) return 'pdf'
  if (mime.startsWith('image/')) return 'image'
  return 'binary'
}

export function FileUploadField({
  tenantId,
  accept = 'image/*,application/pdf',
  tags = [],
  label = 'Załącz plik',
  onUploaded,
  onClear,
  className,
}: FileUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [filename, setFilename] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File) {
    setBusy(true)
    setError(null)
    try {
      const stored = await storePreviewableFile(
        tenantId,
        {
          filename: file.name,
          kind: kindFromMime(file.type),
          mimeType: file.type || 'application/octet-stream',
          blob: file,
          source: 'import',
        },
        tags,
      )
      setFilename(stored.filename)
      onUploaded(stored.id, stored.filename)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Błąd uploadu')
    } finally {
      setBusy(false)
    }
  }

  function clear() {
    setFilename(null)
    setError(null)
    onClear?.()
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className={cn('space-y-2', className)}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) void handleFile(f)
        }}
      />
      {!filename ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          <Paperclip className="mr-2 h-4 w-4" />
          {busy ? 'Wysyłanie…' : label}
        </Button>
      ) : (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
          <Paperclip className="h-4 w-4 shrink-0 text-primary" />
          <span className="min-w-0 flex-1 truncate">{filename}</span>
          <button type="button" onClick={clear} aria-label="Usuń plik">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      )}
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  )
}
