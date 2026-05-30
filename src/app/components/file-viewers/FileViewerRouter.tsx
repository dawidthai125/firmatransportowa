import { BinaryFileViewer } from '@/app/components/file-viewers/BinaryFileViewer'
import { CsvFileViewer } from '@/app/components/file-viewers/CsvFileViewer'
import { HtmlFileViewer } from '@/app/components/file-viewers/HtmlFileViewer'
import { ImageFileViewer } from '@/app/components/file-viewers/ImageFileViewer'
import { JsonFileViewer } from '@/app/components/file-viewers/JsonFileViewer'
import { PdfFileViewer } from '@/app/components/file-viewers/PdfFileViewer'
import { TextFileViewer } from '@/app/components/file-viewers/TextFileViewer'
import type { PreviewableFile } from '@/lib/files/types'

interface FileViewerRouterProps {
  file: PreviewableFile
}

export function FileViewerRouter({ file }: FileViewerRouterProps) {
  switch (file.kind) {
    case 'csv':
      return <CsvFileViewer file={file} />
    case 'pdf':
      return <PdfFileViewer file={file} />
    case 'image':
      return <ImageFileViewer file={file} />
    case 'text':
      return <TextFileViewer file={file} />
    case 'json':
      return <JsonFileViewer file={file} />
    case 'html':
      return <HtmlFileViewer file={file} />
    default:
      return <BinaryFileViewer file={file} />
  }
}
