import { parseCsvText } from '@/lib/files/parse-csv'
import type { PreviewableFile } from '@/lib/files/types'

interface CsvFileViewerProps {
  file: PreviewableFile
}

export function CsvFileViewer({ file }: CsvFileViewerProps) {
  const { headers, rows } = parseCsvText(file.textContent ?? '')

  if (headers.length === 0) {
    return <p className="p-4 text-sm text-muted-foreground">Pusty plik CSV.</p>
  }

  return (
    <div className="scroll-area max-h-[min(70dvh,640px)] overflow-auto">
      <table className="w-full min-w-[480px] border-collapse text-xs">
        <thead className="sticky top-0 bg-muted">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="border border-border px-2 py-1.5 text-left font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className="even:bg-muted/30">
              {row.map((cell, ci) => (
                <td key={ci} className="border border-border px-2 py-1 whitespace-nowrap">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
