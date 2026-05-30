import { Button } from '@/app/components/ui/Button'
import { fileFromInput } from '@/lib/files/download'
import { useFilePreview } from '@/app/components/file-preview/FilePreviewProvider'
import { Upload } from 'lucide-react'
import { useRef } from 'react'

interface ImportFileZoneProps {
  tenantId: string
  accept?: string
  label?: string
}

export function ImportFileZone({
  tenantId,
  accept = '.pdf,.csv,.png,.jpg,.jpeg,.webp,.txt,.json,.html,.ddd,.xlsx,.xls',
  label = 'Importuj plik',
}: ImportFileZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const { openPreview } = useFilePreview()

  async function onFiles(selected: FileList | null) {
    const file = selected?.[0]
    if (!file) return
    const previewable = await fileFromInput(file)
    openPreview(previewable, { tenantId, allowSave: true })
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          void onFiles(e.target.files)
          e.target.value = ''
        }}
      />
      <Button type="button" variant="secondary" className="gap-2" onClick={() => inputRef.current?.click()}>
        <Upload className="h-4 w-4" />
        {label}
      </Button>
    </>
  )
}
