import { Button } from '@/app/components/ui/Button'
import { Card, CardContent } from '@/app/components/ui/Card'
import { Input, Label, Select } from '@/app/components/ui/Input'
import { PhotoUploadHint, readPhotosFromFiles, RepairPhotoGallery } from '@/app/components/RepairPhotoGallery'
import type { RepairPhoto, RepairSeverity } from '@/lib/domain/repair-report'
import { REPAIR_SEVERITY_LABELS } from '@/lib/domain/repair-report'
import { createNewRepairReport, submitRepairReport } from '@/lib/domain/repair-reports-store'
import { loadVehicles, seedDemoVehicles } from '@/lib/domain/vehicles-store'
import { Camera, Send } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

interface DriverIssueViewProps {
  tenantId: string
  driverName: string
}

export function DriverIssueView({ tenantId, driverName }: DriverIssueViewProps) {
  const [vehicles, setVehicles] = useState<{ id: string; registration: string }[]>([])
  const [vehicleId, setVehicleId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [severity, setSeverity] = useState<RepairSeverity>('major')
  const [photos, setPhotos] = useState<RepairPhoto[]>([])
  const [sent, setSent] = useState(false)
  const [reference, setReference] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    seedDemoVehicles(tenantId)
    const list = loadVehicles(tenantId).filter((v) => v.active)
    setVehicles(list.map((v) => ({ id: v.id, registration: v.registration })))
    if (list[0]) setVehicleId(list[0].id)
  }, [tenantId])

  async function onPhotos(files: FileList | null) {
    setPhotos(await readPhotosFromFiles(files))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const vehicle = vehicles.find((v) => v.id === vehicleId)
    const report = createNewRepairReport(tenantId, {
      tenantId,
      severity,
      driverName,
      vehicleId,
      vehicleRegistration: vehicle?.registration ?? '',
      title: title.trim(),
      description: description.trim(),
      location: location.trim() || undefined,
      photos,
    })
    submitRepairReport(tenantId, report)
    setReference(report.reference)
    setSent(true)
  }

  if (sent) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">Zgłoszenie wysłane</h1>
        <Card className="border-success/30 bg-success/5">
          <CardContent className="p-4 text-sm">
            <p className="font-medium text-success">Numer: {reference}</p>
            <p className="mt-2 text-muted-foreground">
              Dyspozytor lub wyznaczona osoba zweryfikuje zgłoszenie i prześle je do mechanika.
            </p>
          </CardContent>
        </Card>
        <Button
          variant="secondary"
          className="w-full"
          onClick={() => {
            setSent(false)
            setTitle('')
            setDescription('')
            setLocation('')
            setPhotos([])
          }}
        >
          Nowe zgłoszenie
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Zgłoś awarię</h1>
        <p className="text-sm text-muted-foreground">
          Opisz problem, dodaj zdjęcia — weryfikacja w panelu admina
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Pojazd">
          <Select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} required>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.registration}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Pilność">
          <Select value={severity} onChange={(e) => setSeverity(e.target.value as RepairSeverity)}>
            {Object.entries(REPAIR_SEVERITY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Tytuł problemu">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="np. Awaria hamulców" />
        </Field>

        <Field label="Opis">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={4}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            placeholder="Objawy, kiedy wystąpiło, czy można jechać dalej…"
          />
        </Field>

        <Field label="Lokalizacja (opcjonalnie)">
          <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Trasa, MOP, miasto" />
        </Field>

        <div className="space-y-2">
          <Label>Zdjęcia</Label>
          <PhotoUploadHint />
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => void onPhotos(e.target.files)}
          />
          <Button type="button" variant="secondary" className="gap-2" onClick={() => fileRef.current?.click()}>
            <Camera className="h-4 w-4" />
            Dodaj zdjęcia
          </Button>
          <RepairPhotoGallery photos={photos} />
        </div>

        <Button type="submit" className="w-full gap-2" size="lg">
          <Send className="h-4 w-4" />
          Wyślij zgłoszenie
        </Button>
      </form>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  )
}
