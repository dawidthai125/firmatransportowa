import { Button } from '@/app/components/ui/Button'
import { Card } from '@/app/components/ui/Card'
import { Input, Label } from '@/app/components/ui/Input'
import {
  EXPIRY_STATUS_COLORS,
  EXPIRY_STATUS_LABELS,
  expiryStatus,
  formatExpiryDate,
} from '@/lib/domain/compliance'
import type { DatedDocument } from '@/lib/domain/compliance'
import { AlertTriangle, Pencil, Plus, Trash2, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export function DocumentBadges({ documents }: { documents: DatedDocument[] }) {
  const urgent = documents.filter((d) => expiryStatus(d.expiresAt) !== 'ok')
  if (urgent.length === 0) {
    return <span className="text-xs text-success">Dokumenty OK</span>
  }
  return (
    <div className="flex flex-wrap gap-1">
      {urgent.map((doc) => {
        const status = expiryStatus(doc.expiresAt)
        return (
          <span
            key={doc.label}
            className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', EXPIRY_STATUS_COLORS[status])}
          >
            {doc.label}: {EXPIRY_STATUS_LABELS[status]}
          </span>
        )
      })}
    </div>
  )
}

interface EntityFormModalProps {
  title: string
  onClose: () => void
  onSave: () => void
  children: React.ReactNode
}

export function EntityFormModal({ title, onClose, onSave, children }: EntityFormModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4">
      <Card className="max-h-[92dvh] w-full max-w-lg overflow-hidden sm:rounded-lg">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="font-semibold">{title}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="scroll-area max-h-[calc(92dvh-120px)] space-y-3 p-4">{children}</div>
        <div className="flex gap-2 border-t border-border p-4">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Anuluj
          </Button>
          <Button className="flex-1" onClick={onSave}>
            Zapisz
          </Button>
        </div>
      </Card>
    </div>
  )
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  )
}

interface DocumentsEditorProps {
  documents: DatedDocument[]
  onChange: (docs: DatedDocument[]) => void
}

export function DocumentsEditor({ documents, onChange }: DocumentsEditorProps) {
  function updateDoc(index: number, patch: Partial<DatedDocument>) {
    const next = documents.map((d, i) => (i === index ? { ...d, ...patch } : d))
    onChange(next)
  }

  function addDoc() {
    const inYear = new Date()
    inYear.setFullYear(inYear.getFullYear() + 1)
    onChange([...documents, { label: 'Nowy dokument', expiresAt: inYear.toISOString().slice(0, 10) }])
  }

  function removeDoc(index: number) {
    onChange(documents.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Dokumenty i ważność</Label>
        <Button type="button" variant="ghost" size="sm" onClick={addDoc} className="gap-1 h-8">
          <Plus className="h-3 w-3" />
          Dodaj
        </Button>
      </div>
      {documents.map((doc, i) => {
        const status = expiryStatus(doc.expiresAt)
        return (
          <div key={i} className="flex flex-wrap items-end gap-2 rounded-md border border-border p-2">
            <div className="min-w-[120px] flex-1 space-y-1">
              <span className="text-xs text-muted-foreground">Nazwa</span>
              <Input value={doc.label} onChange={(e) => updateDoc(i, { label: e.target.value })} />
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Ważny do</span>
              <Input
                type="date"
                value={doc.expiresAt.slice(0, 10)}
                onChange={(e) => updateDoc(i, { expiresAt: e.target.value })}
              />
            </div>
            <span className={cn('rounded-full px-2 py-1 text-[10px] font-medium', EXPIRY_STATUS_COLORS[status])}>
              {status === 'expired' ? (
                <span className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {formatExpiryDate(doc.expiresAt)}
                </span>
              ) : (
                EXPIRY_STATUS_LABELS[status]
              )}
            </span>
            <Button type="button" variant="ghost" size="icon" onClick={() => removeDoc(i)}>
              <Trash2 className="h-4 w-4 text-danger" />
            </Button>
          </div>
        )
      })}
    </div>
  )
}

export function EntityActions({
  onEdit,
  onDelete,
  readOnly,
}: {
  onEdit: () => void
  onDelete: () => void
  readOnly?: boolean
}) {
  if (readOnly) return null
  return (
    <div className="flex gap-1">
      <Button variant="ghost" size="icon" onClick={onEdit} aria-label="Edytuj">
        <Pencil className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={onDelete} aria-label="Usuń">
        <Trash2 className="h-4 w-4 text-danger" />
      </Button>
    </div>
  )
}
