import type { PreviewableFile } from '@/lib/files/types'

interface TextFileViewerProps {
  file: PreviewableFile
}

export function TextFileViewer({ file }: TextFileViewerProps) {
  return (
    <pre className="scroll-area max-h-[min(70dvh,640px)] overflow-auto rounded-md border border-border bg-muted/20 p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap">
      {file.textContent ?? ''}
    </pre>
  )
}
