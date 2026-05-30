import { useFilePreview } from '@/app/components/file-preview/FilePreviewProvider'
import type { RepairPhoto } from '@/lib/domain/repair-report'
import { cn } from '@/lib/utils'
import { ImageIcon } from 'lucide-react'

interface RepairPhotoGalleryProps {
  photos: RepairPhoto[]
  className?: string
}

export function RepairPhotoGallery({ photos, className }: RepairPhotoGalleryProps) {
  const { openPreview } = useFilePreview()

  if (photos.length === 0) {
    return <p className="text-xs text-muted-foreground">Brak zdjęć</p>
  }

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {photos.map((photo) => (
        <button
          key={photo.id}
          type="button"
          onClick={() =>
            openPreview({
              filename: photo.filename,
              kind: 'image',
              mimeType: photo.mimeType,
              blob: base64ToBlob(photo.dataBase64, photo.mimeType),
              source: 'library',
              label: photo.filename,
            })
          }
          className="relative h-20 w-20 overflow-hidden rounded-md border border-border bg-muted/30"
        >
          <img
            src={`data:${photo.mimeType};base64,${photo.dataBase64}`}
            alt={photo.filename}
            className="h-full w-full object-cover"
          />
        </button>
      ))}
    </div>
  )
}

export async function readPhotosFromFiles(files: FileList | null): Promise<RepairPhoto[]> {
  if (!files?.length) return []
  const max = Math.min(files.length, 4)
  const out: RepairPhoto[] = []
  for (let i = 0; i < max; i++) {
    const file = files[i]
    if (!file.type.startsWith('image/')) continue
    if (file.size > 512 * 1024) continue
    const dataBase64 = await fileToBase64(file)
    out.push({
      id: crypto.randomUUID(),
      filename: file.name,
      mimeType: file.type,
      dataBase64,
    })
  }
  return out
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const base64 = result.split(',')[1] ?? ''
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: mimeType })
}

export function PhotoUploadHint() {
  return (
    <p className="flex items-center gap-1 text-xs text-muted-foreground">
      <ImageIcon className="h-3.5 w-3.5" />
      Do 4 zdjęć · max 512 KB każde · JPG/PNG
    </p>
  )
}
