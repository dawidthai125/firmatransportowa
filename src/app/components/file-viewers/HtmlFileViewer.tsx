import type { PreviewableFile } from '@/lib/files/types'

interface HtmlFileViewerProps {
  file: PreviewableFile
}

export function HtmlFileViewer({ file }: HtmlFileViewerProps) {
  return (
    <iframe
      title={file.filename}
      srcDoc={file.textContent ?? ''}
      sandbox="allow-same-origin"
      className="h-[min(70dvh,720px)] w-full rounded-md border border-border bg-white"
    />
  )
}
