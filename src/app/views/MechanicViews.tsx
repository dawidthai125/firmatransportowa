import { Button } from '@/app/components/ui/Button'
import { Card, CardContent } from '@/app/components/ui/Card'
import { Input, Label } from '@/app/components/ui/Input'
import { RepairPhotoGallery } from '@/app/components/RepairPhotoGallery'
import { RepairWorkDetails } from '@/app/components/repairs/RepairWorkDetails'
import {
  REPAIR_SEVERITY_LABELS,
  REPAIR_STATUS_COLORS,
  REPAIR_STATUS_LABELS,
  type RepairReport,
} from '@/lib/domain/repair-report'
import {
  filterMechanicReports,
  loadRepairReports,
  mechanicCompleteRepair,
  mechanicMarkInRepair,
  mechanicRequestDriverContact,
  mechanicSaveRepairWork,
  mechanicScheduleRepair,
  seedDemoRepairReports,
  type MechanicRepairWorkInput,
} from '@/lib/domain/repair-reports-store'
import { useCloudSyncRefresh } from '@/lib/sync/useCloudSyncRefresh'
import { EditConflictBanner } from '@/app/components/sync/EditConflictBanner'
import {
  checkRecordStale,
  confirmSaveOverStaleRecord,
} from '@/lib/sync/record-conflict'
import { cn } from '@/lib/utils'
import { Calendar, MessageCircle, Phone, Save, Wrench } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

interface MechanicRepairsViewProps {
  tenantId: string
  mechanicId?: string
  mechanicName: string
}

function workFromReport(r: RepairReport): MechanicRepairWorkInput {
  return {
    diagnosis: r.diagnosis ?? '',
    partsReplaced: r.partsReplaced ?? '',
    repairSummary: r.repairSummary ?? '',
    repairCostPln: r.repairCostPln,
  }
}

export function MechanicRepairsView({ tenantId, mechanicId, mechanicName }: MechanicRepairsViewProps) {
  const [reports, setReports] = useState<RepairReport[]>([])
  const [selected, setSelected] = useState<RepairReport | null>(null)
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduleTime, setScheduleTime] = useState('09:00')
  const [contactMsg, setContactMsg] = useState('')
  const [scheduleNotes, setScheduleNotes] = useState('')
  const [work, setWork] = useState<MechanicRepairWorkInput>({
    diagnosis: '',
    partsReplaced: '',
    repairSummary: '',
    repairCostPln: undefined,
  })
  const [conflict, setConflict] = useState(false)
  const baselineUpdatedAt = useRef<string | undefined>(undefined)

  const applyList = useCallback(
    (all: RepairReport[], keepSelectedId?: string) => {
      const mine = filterMechanicReports(all, mechanicId)
      setReports(mine)
      if (keepSelectedId) {
        setSelected(mine.find((r) => r.id === keepSelectedId) ?? null)
      }
    },
    [mechanicId],
  )

  const refresh = useCallback(() => {
    seedDemoRepairReports(tenantId)
    const all = loadRepairReports(tenantId)
    const mine = filterMechanicReports(all, mechanicId)
    setReports(mine)
    setSelected((prev) => (prev ? mine.find((r) => r.id === prev.id) ?? null : null))
  }, [tenantId, mechanicId])

  useEffect(() => {
    refresh()
  }, [refresh])

  useCloudSyncRefresh(tenantId, 'repair-reports', refresh)

  useEffect(() => {
    baselineUpdatedAt.current = selected?.updatedAt
    setConflict(false)
  }, [selected?.id])

  useEffect(() => {
    if (selected) {
      setWork(workFromReport(selected))
      if (selected.scheduledRepairAt) {
        const d = new Date(selected.scheduledRepairAt)
        setScheduleDate(d.toISOString().slice(0, 10))
        setScheduleTime(d.toISOString().slice(11, 16))
      }
    }
  }, [selected?.id, selected?.updatedAt])

  useEffect(() => {
    if (!selected) {
      setConflict(false)
      return
    }
    const check = checkRecordStale(
      tenantId,
      'repair-reports',
      selected.id,
      baselineUpdatedAt.current,
    )
    setConflict(check.isStale)
  }, [tenantId, selected, reports])

  const active = reports.filter((r) => !['completed'].includes(r.status))

  function guardMechanicSave(): boolean {
    if (!selected || !conflict) return true
    return confirmSaveOverStaleRecord('To zgłoszenie awarii')
  }

  function reloadSelected() {
    if (!selected) return
    const fresh = loadRepairReports(tenantId).find((r) => r.id === selected.id)
    if (fresh) {
      setSelected(fresh)
      baselineUpdatedAt.current = fresh.updatedAt
      setConflict(false)
    }
  }

  function runUpdate(fn: () => RepairReport[], selectedId: string) {
    const all = fn()
    applyList(all, selectedId)
  }

  function handleSchedule() {
    if (!selected || !scheduleDate || !guardMechanicSave()) return
    const iso = `${scheduleDate}T${scheduleTime}:00`
    runUpdate(
      () => mechanicScheduleRepair(tenantId, selected.id, iso, scheduleNotes || undefined),
      selected.id,
    )
  }

  function handleContact() {
    if (!selected || !contactMsg.trim() || !guardMechanicSave()) return
    runUpdate(() => mechanicRequestDriverContact(tenantId, selected.id, contactMsg.trim()), selected.id)
    setContactMsg('')
  }

  function handleSaveWork() {
    if (!selected || !guardMechanicSave()) return
    runUpdate(() => mechanicSaveRepairWork(tenantId, selected.id, work), selected.id)
  }

  function handleInRepair() {
    if (!selected || !guardMechanicSave()) return
    runUpdate(() => mechanicMarkInRepair(tenantId, selected.id, work), selected.id)
  }

  function handleComplete() {
    if (!selected || !guardMechanicSave()) return
    runUpdate(() => mechanicCompleteRepair(tenantId, selected.id, work), selected.id)
  }

  const canEditWork =
    selected &&
    ['at_mechanic', 'scheduled', 'awaiting_driver', 'in_repair'].includes(selected.status)

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {mechanicName} · {active.length} aktywnych zleceń · opis naprawy widzą kierowca i biuro
      </p>

      {!mechanicId && (
        <Card className="border-warning/40">
          <CardContent className="p-3 text-sm text-warning">
            Brak powiązania z kartoteką mechanika — wyloguj się i zaloguj ponownie jako mechanik.
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {reports.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              Brak przypisanych zgłoszeń — dyspozytor musi zweryfikować awarię i wysłać do warsztatu.
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
                  <p className="font-medium">
                    {r.reference} · {r.vehicleRegistration}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {r.title} · {r.driverName}
                  </p>
                </div>
                <span
                  className={cn('rounded-full px-2 py-0.5 text-xs font-medium', REPAIR_STATUS_COLORS[r.status])}
                >
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
            {conflict && (
              <EditConflictBanner
                onReload={reloadSelected}
                onForceSave={() => {
                  if (!selected) return
                  if (confirmSaveOverStaleRecord('To zgłoszenie awarii')) {
                    runUpdate(
                      () => mechanicSaveRepairWork(tenantId, selected.id, work),
                      selected.id,
                    )
                    setConflict(false)
                  }
                }}
              />
            )}
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

            {selected.status === 'completed' && (
              <RepairWorkDetails report={selected} showCost={false} />
            )}

            {canEditWork && (
              <div className="space-y-3 border-t border-border pt-4">
                <p className="text-sm font-medium">Opis naprawy (widoczny dla kierowcy i biura)</p>
                <div className="space-y-2">
                  <Label htmlFor="repair-diagnosis">Co było zepsute / diagnoza</Label>
                  <textarea
                    id="repair-diagnosis"
                    className="min-h-[72px] w-full rounded-lg border border-border bg-background p-3 text-sm"
                    value={work.diagnosis ?? ''}
                    onChange={(e) => setWork((w) => ({ ...w, diagnosis: e.target.value }))}
                    placeholder="Np. uszkodzona sprzęgło, wyciek oleju ze skrzyni"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="repair-parts">Wymienione części</Label>
                  <textarea
                    id="repair-parts"
                    className="min-h-[60px] w-full rounded-lg border border-border bg-background p-3 text-sm"
                    value={work.partsReplaced ?? ''}
                    onChange={(e) => setWork((w) => ({ ...w, partsReplaced: e.target.value }))}
                    placeholder="Np. tarcza sprzęgła, łożysko wału, filtr oleju"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="repair-summary">Wykonane prace</Label>
                  <textarea
                    id="repair-summary"
                    className="min-h-[72px] w-full rounded-lg border border-border bg-background p-3 text-sm"
                    value={work.repairSummary ?? ''}
                    onChange={(e) => setWork((w) => ({ ...w, repairSummary: e.target.value }))}
                    placeholder="Krótki opis naprawy po zakończeniu"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="repair-cost">Koszt naprawy (zł) — tylko właściciel zobaczy w biurze</Label>
                  <Input
                    id="repair-cost"
                    type="number"
                    min={0}
                    step={0.01}
                    value={work.repairCostPln ?? ''}
                    onChange={(e) =>
                      setWork((w) => ({
                        ...w,
                        repairCostPln: e.target.value === '' ? undefined : Number(e.target.value),
                      }))
                    }
                    placeholder="Np. 4200"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="secondary" className="gap-1.5" onClick={handleSaveWork}>
                    <Save className="h-4 w-4" />
                    Zapisz opis
                  </Button>
                  {selected.status !== 'in_repair' && (
                    <Button type="button" className="gap-1.5" onClick={handleInRepair}>
                      W trakcie naprawy
                    </Button>
                  )}
                  <Button type="button" variant="default" className="gap-1.5 bg-success hover:bg-success/90" onClick={handleComplete}>
                    Naprawiony
                  </Button>
                </div>
              </div>
            )}

            {['at_mechanic', 'awaiting_driver'].includes(selected.status) && (
              <div className="space-y-4 border-t border-border pt-4">
                <div>
                  <Label className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Ustal termin naprawy
                  </Label>
                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <Input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} />
                    <Input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} />
                  </div>
                  <Input
                    className="mt-2"
                    placeholder="Notatka wewnętrzna (np. części do zamówienia)"
                    value={scheduleNotes}
                    onChange={(e) => setScheduleNotes(e.target.value)}
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
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export function MechanicHomeView(props: MechanicRepairsViewProps) {
  return <MechanicRepairsView {...props} />
}
