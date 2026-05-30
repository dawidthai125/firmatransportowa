import { resolveBlob } from '@/lib/files/download'
import type { PreviewableFile } from '@/lib/files/types'
import { useEffect, useState } from 'react'

interface ImageFileViewerProps {
  file: PreviewableFile
}

export function ImageFileViewer({ file }: ImageFileViewerProps) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    const blob = resolveBlob(file)
    const objectUrl = URL.createObjectURL(blob)
    setUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [file])

  if (!url) return null

  return (
    <div className="flex max-h-[min(70dvh,720px)] items-center justify-center overflow-auto rounded-md border border-border bg-muted/30 p-4">
      <img src={url} alt={file.filename} className="max-h-full max-w-full object-contain" />
    </div>
  )
}
