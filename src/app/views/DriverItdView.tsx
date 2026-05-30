import { ItdHotspotsMap } from '@/app/components/itd/ItdHotspotsMap'
import { Button } from '@/app/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/Card'
import { Input, Label, Select } from '@/app/components/ui/Input'
import { findDriverByDisplayName, resolveDriverVehicle } from '@/lib/domain/driver-profile'
import {
  addItdControlRecord,
  loadItdHotspots,
  loadItdPlaybook,
  seedItdData,
  submitItdControlAlert,
} from '@/lib/domain/itd-store'
import { ITD_OUTCOME_LABELS, type ItdControlOutcome } from '@/lib/domain/itd-types'
import { AlertTriangle, MapPin, ShieldAlert } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

interface DriverItdViewProps {
  tenantId: string
  driverName: string
}

export function DriverItdView({ tenantId, driverName }: DriverItdViewProps) {
  const [playbook, setPlaybook] = useState(loadItdPlaybook(tenantId))
  const [hotspots, setHotspots] = useState(loadItdHotspots(tenantId))
  const [alertSent, setAlertSent] = useState(false)
  const [locationLabel, setLocationLabel] = useState('')
  const [road, setRoad] = useState('')
  const [message, setMessage] = useState('')
  const [showRecordForm, setShowRecordForm] = useState(false)

  const driver = findDriverByDisplayName(tenantId, driverName)
  const vehicle = driver ? resolveDriverVehicle(tenantId, driver) : undefined

  const refresh = useCallback(() => {
    seedItdData(tenantId)
    setPlaybook(loadItdPlaybook(tenantId))
    setHotspots(loadItdHotspots(tenantId))
  }, [tenantId])

  useEffect(() => {
    refresh()
  }, [refresh])

  function sendAlert() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          submitItdControlAlert(tenantId, {
            tenantId,
            driverName,
            vehicleRegistration: vehicle?.registration,
            locationLabel: locationLabel || `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            road: road || undefined,
            message: message || undefined,
          })
          setAlertSent(true)
          refresh()
        },
        () => {
          submitItdControlAlert(tenantId, {
            tenantId,
            driverName,
            vehicleRegistration: vehicle?.registration,
            locationLabel: locationLabel || 'Lokalizacja z ręki — brak GPS',
            road: road || undefined,
            message: message || undefined,
          })
          setAlertSent(true)
          refresh()
        },
        { timeout: 8000 },
      )
    } else {
      submitItdControlAlert(tenantId, {
        tenantId,
        driverName,
        vehicleRegistration: vehicle?.registration,
        locationLabel: locationLabel || 'Nie podano lokalizacji',
        road: road || undefined,
        message: message || undefined,
      })
      setAlertSent(true)
      refresh()
    }
  }

  return (
    <div className="space-y-4">
      <Card className="border-danger/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldAlert className="h-5 w-5 text-danger" />
            Kontrola ITD w toku
          </CardTitle>
          <CardDescription>
            Wyślij alert do właściciela i dyspozytora — bez dzwonienia w trakcie rozmowy z inspektorem
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>Miejsce (droga, km, MOP)</Label>
            <Input
              placeholder="np. A2 km 112, MOP Kłodzko"
              value={locationLabel}
              onChange={(e) => setLocationLabel(e.target.value)}
            />
          </div>
          <div>
            <Label>Numer drogi (opcj.)</Label>
            <Input placeholder="A2" value={road} onChange={(e) => setRoad(e.target.value)} />
          </div>
          <div>
            <Label>Krótka wiadomość (opcj.)</Label>
            <Input
              placeholder="np. kontrola dokumentów + tachograf"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          <Button
            className="w-full"
            variant="danger"
            onClick={sendAlert}
            disabled={alertSent}
          >
            <AlertTriangle className="mr-2 h-4 w-4" />
            {alertSent ? 'Alert wysłany — biuro powiadomione' : 'Wyślij alert ITD'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-4 w-4" />
            Gdzie stoi ITD
          </CardTitle>
          <CardDescription>Mapa wag, granic i zgłoszeń innych kierowców (4 h)</CardDescription>
        </CardHeader>
        <CardContent>
          <ItdHotspotsMap hotspots={hotspots} onRefresh={refresh} />
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h3 className="font-semibold">Instrukcja — jak się zachować</h3>
        {playbook.map((section) => (
          <Card key={section.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{section.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                {section.items.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Po kontroli — wyślij wynik</CardTitle>
          <CardDescription>Protokół, mandat — biuro zarchiwizuje</CardDescription>
        </CardHeader>
        <CardContent>
          {!showRecordForm ? (
            <Button variant="outline" onClick={() => setShowRecordForm(true)}>
              Dodaj wynik kontroli
            </Button>
          ) : (
            <DriverRecordForm
              tenantId={tenantId}
              driverName={driverName}
              registration={vehicle?.registration ?? ''}
              onDone={() => {
                setShowRecordForm(false)
                refresh()
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function DriverRecordForm({
  tenantId,
  driverName,
  registration,
  onDone,
}: {
  tenantId: string
  driverName: string
  registration: string
  onDone: () => void
}) {
  const [locationLabel, setLocationLabel] = useState('')
  const [outcome, setOutcome] = useState<ItdControlOutcome>('clean')
  const [finePln, setFinePln] = useState('')
  const [protocolNumber, setProtocolNumber] = useState('')
  const [attachmentName, setAttachmentName] = useState('')

  function submit(e: React.FormEvent) {
    e.preventDefault()
    addItdControlRecord(tenantId, {
      tenantId,
      driverName,
      vehicleRegistration: registration || '—',
      controlDate: new Date().toISOString().slice(0, 10),
      locationLabel,
      outcome,
      finePln: finePln ? Number(finePln) : undefined,
      protocolNumber: protocolNumber || undefined,
      attachmentName: attachmentName || undefined,
    })
    onDone()
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <Label>Miejsce kontroli</Label>
        <Input value={locationLabel} onChange={(e) => setLocationLabel(e.target.value)} required />
      </div>
      <div>
        <Label>Wynik</Label>
        <Select value={outcome} onChange={(e) => setOutcome(e.target.value as ItdControlOutcome)}>
          {Object.entries(ITD_OUTCOME_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label>Kara PLN (jeśli była)</Label>
        <Input type="number" value={finePln} onChange={(e) => setFinePln(e.target.value)} />
      </div>
      <div>
        <Label>Nr protokołu</Label>
        <Input value={protocolNumber} onChange={(e) => setProtocolNumber(e.target.value)} />
      </div>
      <div>
        <Label>Nazwa pliku / zdjęcia</Label>
        <Input
          placeholder="protokol-itd-2026.pdf"
          value={attachmentName}
          onChange={(e) => setAttachmentName(e.target.value)}
        />
      </div>
      <Button type="submit" className="w-full">
        Wyślij do biura
      </Button>
    </form>
  )
}
