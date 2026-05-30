import { Button } from '@/app/components/ui/Button'
import { Card, CardContent } from '@/app/components/ui/Card'
import { Input, Label } from '@/app/components/ui/Input'
import { RepairPhotoGallery } from '@/app/components/RepairPhotoGallery'
import {
  REPAIR_SEVERITY_LABELS,
  REPAIR_STATUS_COLORS,
  REPAIR_STATUS_LABELS,
  type RepairReport,
} from '@/lib/domain/repair-report'
import {
  loadRepairReports,
  mechanicCompleteRepair,
  mechanicMarkInRepair,
  mechanicRequestDriverContact,
  mechanicScheduleRepair,
  seedDemoRepairReports,
} from '@/lib/domain/repair-reports-store'
import { cn } from '@/lib/utils'
import { Calendar, MessageCircle, Phone, Wrench } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

interface MechanicRepairsViewProps {
  tenantId: string
  mechanicId?: string
  mechanicName: string
}

export function MechanicRepairsView({ tenantId, mechanicId, mechanicName }: MechanicRepairsViewProps) {
  const [reports, setReports] = useState<RepairReport[]>([])
  const [selected, setSelected] = useState<RepairReport | null>(null)
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduleTime, setScheduleTime] = useState('09:00')
  const [contactMsg, setContactMsg] = useState('')
  const [notes, setNotes] = useState('')

  const refresh = useCallback(() => {
    seedDemoRepairReports(tenantId)
    const all = loadRepairReports(tenantId)
    const mine = all.filter(
      (r) => r.mechanicId === mechanicId && !['submitted', 'rejected'].includes(r.status),
    )
    setReports(mine)
  }, [tenantId, mechanicId])

  useEffect(() => {
    refresh()
  }, [refresh])

  const active = reports.filter((r) => !['completed', 'rejected'].includes(r.status))

  function handleSchedule() {
    if (!selected || !scheduleDate) return
    const iso = `${scheduleDate}T${scheduleTime}:00`
    setReports(mechanicScheduleRepair(tenantId, selected.id, iso, notes || undefined))
    setSelected(null)
  }

  function handleContact() {
    if (!selected || !contactMsg.trim()) return
    setReports(mechanicRequestDriverContact(tenantId, selected.id, contactMsg.trim()))
    setSelected(null)
    setContactMsg('')
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {mechanicName} · {active.length} aktywnych zleceń · ustal termin lub skontaktuj się z kierowcą
      </p>

      <div className="space-y-2">
        {reports.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              Brak przypisanych zgłoszeń
            </CardContent>
          </Card>
        ) : (
          reports.map((r) => (
            <Card
              key={r.id}
              className={cn('cursor-pointer', selected?.id === r.id && 'ring-2 ring-primary')}
              onClick={() => setSelected(r)}
            >
              <CardContent className="flex flex-wrap items-center gap-3 p-4">
                <Wrench className="h-5 w-5 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{r.reference} · {r.vehicleRegistration}</p>
                  <p className="text-sm text-muted-foreground">{r.title} · {r.driverName}</p>
                </div>
                <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', REPAIR_STATUS_COLORS[r.status])}>
                  {REPAIR_STATUS_LABELS[r.status]}
                </span>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {selected && (
        <Card>
          <CardContent className="space-y-4 p-4">
            <div>
              <p className="font-semibold">{selected.title}</p>
              <p className="text-sm text-muted-foreground">
                {REPAIR_SEVERITY_LABELS[selected.severity]} · {selected.vehicleRegistration}
              </p>
            </div>
            <p className="text-sm">{selected.description}</p>
            {selected.location && <p className="text-sm">📍 {selected.location}</p>}
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              Kierowca: {selected.driverName}
              {selected.driverPhone && ` · ${selected.driverPhone}`}
            </div>
            <RepairPhotoGallery photos={selected.photos} />

            {['at_mechanic', 'awaiting_driver'].includes(selected.status) && (
              <div className="space-y-4 border-t border-border pt-4">
                <div>
                  <Label className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Ustal termin naprawy
                  </Label>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <Input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} />
                    <Input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} />
                  </div>
                  <Input
                    className="mt-2"
                    placeholder="Notatka (np. części do zamówienia)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                  <Button className="mt-2 w-full" onClick={handleSchedule}>
                    Zapisz termin
                  </Button>
                </div>

                <div>
                  <Label className="flex items-center gap-1">
                    <MessageCircle className="h-4 w-4" />
                    Prośba o kontakt z kierowcą
                  </Label>
                  <Input
                    className="mt-2"
                    value={contactMsg}
                    onChange={(e) => setContactMsg(e.target.value)}
                    placeholder="Np. Proszę o telefon — potrzebuję VIN"
                  />
                  <Button variant="secondary" className="mt-2 w-full" onClick={handleContact}>
                    Wyślij prośbę o kontakt
                  </Button>
                </div>
              </div>
            )}

            {selected.status === 'scheduled' && (
              <div className="flex flex-wrap gap-2 border-t border-border pt-4">
                <Button onClick={() => setReports(mechanicMarkInRepair(tenantId, selected.id))}>
                  Rozpoczęto naprawę
                </Button>
                <Button variant="secondary" onClick={() => setReports(mechanicCompleteRepair(tenantId, selected.id))}>
                  Naprawa zakończona
                </Button>
              </div>
            )}

            {selected.status === 'in_repair' && (
              <Button className="w-full" onClick={() => setReports(mechanicCompleteRepair(tenantId, selected.id))}>
                Oznacz jako zakończone
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export function MechanicHomeView({ tenantId, mechanicId, mechanicName }: MechanicRepairsViewProps) {
  return <MechanicRepairsView tenantId={tenantId} mechanicId={mechanicId} mechanicName={mechanicName} />
}
