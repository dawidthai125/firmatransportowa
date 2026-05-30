import type { PreviewableFile } from '@/lib/files/types'

interface JsonFileViewerProps {
  file: PreviewableFile
}

export function JsonFileViewer({ file }: JsonFileViewerProps) {
  let formatted = file.textContent ?? ''
  try {
    formatted = JSON.stringify(JSON.parse(formatted), null, 2)
  } catch {
    /* raw text */
  }

  return (
    <pre className="scroll-area max-h-[min(70dvh,640px)] overflow-auto rounded-md border border-border bg-muted/20 p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap">
      {formatted}
    </pre>
  )
}
