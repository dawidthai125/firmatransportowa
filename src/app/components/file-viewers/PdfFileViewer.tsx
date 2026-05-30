import { resolveBlob } from '@/lib/files/download'
import type { PreviewableFile } from '@/lib/files/types'
import { useEffect, useState } from 'react'

interface PdfFileViewerProps {
  file: PreviewableFile
}

export function PdfFileViewer({ file }: PdfFileViewerProps) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    const blob = resolveBlob(file)
    const objectUrl = URL.createObjectURL(blob)
    setUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [file])

  if (!url) return null

  return (
    <iframe
      title={file.filename}
      src={url}
      className="h-[min(70dvh,720px)] w-full rounded-md border border-border bg-white"
    />
  )
}
