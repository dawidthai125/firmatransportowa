import { Button } from '@/app/components/ui/Button'
import { Label } from '@/app/components/ui/Input'
import type { Course, CourseAttachment, CourseAttachmentKind } from '@/lib/domain/course'
import { upsertCourseGuarded } from '@/lib/domain/courses-store'
import { Camera, FileImage, Trash2 } from 'lucide-react'
import { useRef, useState } from 'react'

interface CourseDocumentsPanelProps {
  tenantId: string
  course: Course
  uploaderName: string
  readOnly?: boolean
  onUpdated: (course: Course) => void
}

export function CourseDocumentsPanel({
  tenantId,
  course,
  uploaderName,
  readOnly = false,
  onUpdated,
}: CourseDocumentsPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [kind, setKind] = useState<CourseAttachmentKind>('pod')
  const [uploading, setUploading] = useState(false)

  async function handleFile(file: File) {
    if (file.size > 4 * 1024 * 1024) {
      window.alert('Maks. 4 MB na zdjęcie w wersji demo.')
      return
    }
    setUploading(true)
    try {
      const dataUrl = await readAsDataUrl(file)
      const attachment: CourseAttachment = {
        id: crypto.randomUUID(),
        kind,
        name: file.name,
        mimeType: file.type || 'image/jpeg',
        dataUrl,
        uploadedAt: new Date().toISOString(),
        uploadedBy: uploaderName,
      }
      const now = new Date().toISOString()
      const updated: Course = {
        ...course,
        attachments: [...(course.attachments ?? []), attachment],
        updatedAt: now,
      }
      await upsertCourseGuarded(tenantId, updated)
      onUpdated(updated)
    } finally {
      setUploading(false)
    }
  }

  async function removeAttachment(id: string) {
    const now = new Date().toISOString()
    const updated: Course = {
      ...course,
      attachments: (course.attachments ?? []).filter((a) => a.id !== id),
      updatedAt: now,
    }
    await upsertCourseGuarded(tenantId, updated)
    onUpdated(updated)
  }

  const attachments = course.attachments ?? []

  return (
    <div className="space-y-2 rounded-lg border border-border p-3">
      <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <FileImage className="h-3.5 w-3.5" />
        Dokumenty CMR / POD ({attachments.length})
      </p>

      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {attachments.map((a) => (
            <div key={a.id} className="relative">
              <a href={a.dataUrl} target="_blank" rel="noreferrer" className="block">
                <img
                  src={a.dataUrl}
                  alt={a.name}
                  className="h-16 w-16 rounded-md border border-border object-cover"
                />
              </a>
              <span className="mt-0.5 block text-[10px] uppercase text-muted-foreground">{a.kind}</span>
              {!readOnly && (
                <button
                  type="button"
                  className="absolute -right-1 -top-1 rounded-full bg-danger p-0.5 text-white"
                  onClick={() => removeAttachment(a.id)}
                  aria-label="Usuń"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {!readOnly && (
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1">
            <Label>Typ</Label>
            <select
              className="rounded-md border border-border bg-background px-2 py-1.5 text-sm"
              value={kind}
              onChange={(e) => setKind(e.target.value as CourseAttachmentKind)}
            >
              <option value="pod">POD (dostawa)</option>
              <option value="cmr">CMR</option>
              <option value="other">Inne</option>
            </select>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void handleFile(f)
              e.target.value = ''
            }}
          />
          <Button
            size="sm"
            variant="secondary"
            className="gap-1.5"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            <Camera className="h-4 w-4" />
            {uploading ? 'Wgrywanie…' : 'Dodaj zdjęcie'}
          </Button>
        </div>
      )}
    </div>
  )
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
