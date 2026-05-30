import { Button } from '@/app/components/ui/Button'
import { Card, CardContent } from '@/app/components/ui/Card'
import { Input, Label, Select } from '@/app/components/ui/Input'
import { RepairPhotoGallery } from '@/app/components/RepairPhotoGallery'
import { RepairWorkDetails } from '@/app/components/repairs/RepairWorkDetails'
import {
  REPAIR_SEVERITY_LABELS,
  REPAIR_STATUS_COLORS,
  REPAIR_STATUS_LABELS,
  type RepairReport,
} from '@/lib/domain/repair-report'
import {
  loadRepairReports,
  rejectRepairReport,
  seedDemoRepairReports,
  sendReportToMechanic,
} from '@/lib/domain/repair-reports-store'
import {
  canVerifyRepairs,
  loadTenantSettingsData,
  seedDemoCompanyDocuments,
} from '@/lib/domain/tenant-settings'
import type { UserRole } from '@/lib/auth/session'
import { useCloudSyncRefresh } from '@/lib/sync/useCloudSyncRefresh'
import { cn } from '@/lib/utils'
import { CheckCircle2, Send, Wrench, XCircle } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

interface RepairsViewProps {
  tenantId: string
  userId: string
  userRole: UserRole
}

export function RepairsView({ tenantId, userId, userRole }: RepairsViewProps) {
  const [reports, setReports] = useState<RepairReport[]>([])
  const [selected, setSelected] = useState<RepairReport | null>(null)
  const [mechanicId, setMechanicId] = useState('')
  const [verifyNote, setVerifyNote] = useState('')
  const [rejectReason, setRejectReason] = useState('')

  const settings = useMemo(() => loadTenantSettingsData(tenantId), [tenantId])
  const canVerify = canVerifyRepairs(settings, userId, userRole)
  const mechanics = useMemo(() => settings.mechanics.filter((m) => m.active), [settings.mechanics])
  const defaultMechanicId = settings.repairWorkflow.defaultMechanicId

  const refresh = useCallback(() => {
    seedDemoCompanyDocuments(tenantId)
    seedDemoRepairReports(tenantId)
    setReports(loadRepairReports(tenantId))
  }, [tenantId])

  useEffect(() => {
    refresh()
  }, [refresh])

  useCloudSyncRefresh(tenantId, 'repair-reports', refresh)

  useEffect(() => {
    if (mechanicId) return
    if (defaultMechanicId && mechanics.some((m) => m.id === defaultMechanicId)) {
      setMechanicId(defaultMechanicId)
    } else if (mechanics[0]) {
      setMechanicId(mechanics[0].id)
    }
  }, [mechanicId, defaultMechanicId, mechanics])

  const pending = reports.filter((r) => r.status === 'submitted')

  function handleSend() {
    if (!selected || !mechanicId) return
    const mechanic = mechanics.find((m) => m.id === mechanicId)
    if (!mechanic) return
    const next = sendReportToMechanic(tenantId, selected.id, mechanic, userId, verifyNote || undefined)
    setReports(next)
    setSelected(null)
    setVerifyNote('')
  }

  function handleReject() {
    if (!selected || !rejectReason.trim()) return
    const next = rejectRepairReport(tenantId, selected.id, userId, rejectReason.trim())
    setReports(next)
    setSelected(null)
    setRejectReason('')
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {pending.length} czeka na weryfikację · {reports.length} łącznie — kierowca czeka na Twoją decyzję
      </p>

      {!canVerify && (
        <Card className="border-warning/40">
          <CardContent className="p-3 text-sm text-warning">
            Brak uprawnień do weryfikacji — skontaktuj się z właścicielem.
          </CardContent>
        </Card>
      )}

      {mechanics.length === 0 && (
        <Card className="border-danger/40">
          <CardContent className="p-3 text-sm text-danger">
            Brak mechaników w ustawieniach firmy — dodaj warsztat w Ustawienia, inaczej nie wyślesz awarii.
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {reports.map((r) => (
          <Card
            key={r.id}
            className={cn(
              'cursor-pointer transition-colors hover:bg-muted/30',
              selected?.id === r.id && 'ring-2 ring-primary',
            )}
            onClick={() => setSelected(r)}
          >
            <CardContent className="flex flex-wrap items-center gap-3 p-4">
              <Wrench className="h-5 w-5 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="font-medium">
                  {r.reference} · {r.title}
                </p>
                <p className="text-sm text-muted-foreground">
                  {r.vehicleRegistration} · {r.driverName} · {REPAIR_SEVERITY_LABELS[r.severity]}
                </p>
              </div>
              <span
                className={cn('rounded-full px-2 py-0.5 text-xs font-medium', REPAIR_STATUS_COLORS[r.status])}
              >
                {REPAIR_STATUS_LABELS[r.status]}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      {selected && (
        <Card>
          <CardContent className="space-y-4 p-4">
            <div>
              <h2 className="font-semibold">{selected.reference}</h2>
              <p className="text-sm text-muted-foreground">
                {selected.submittedAt.slice(0, 16).replace('T', ' ')}
              </p>
            </div>
            <p className="text-sm">{selected.description}</p>
            {selected.location && <p className="text-sm text-muted-foreground">📍 {selected.location}</p>}
            <RepairPhotoGallery photos={selected.photos} />

            {selected.status === 'submitted' && canVerify && (
              <div className="space-y-3 border-t border-border pt-4">
                <Field label="Mechanik / warsztat">
                  <Select value={mechanicId} onChange={(e) => setMechanicId(e.target.value)}>
                    {mechanics.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} {m.workshop ? `· ${m.workshop}` : ''}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Notatka weryfikacji (opcjonalnie)">
                  <Input value={verifyNote} onChange={(e) => setVerifyNote(e.target.value)} />
                </Field>
                <div className="flex flex-wrap gap-2">
                  <Button className="gap-2" onClick={handleSend} disabled={!mechanicId || mechanics.length === 0}>
                    <Send className="h-4 w-4" />
                    Zweryfikuj i wyślij do mechanika
                  </Button>
                </div>
                <Field label="Powód odrzucenia">
                  <Input
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Np. duplikat zgłoszenia"
                  />
                </Field>
                <Button variant="secondary" className="gap-2 text-danger" onClick={handleReject}>
                  <XCircle className="h-4 w-4" />
                  Odrzuć zgłoszenie
                </Button>
              </div>
            )}

            {selected.status === 'scheduled' && selected.scheduledRepairAt && (
              <p className="flex items-center gap-2 text-sm text-success">
                <CheckCircle2 className="h-4 w-4" />
                Termin naprawy: {new Date(selected.scheduledRepairAt).toLocaleString('pl-PL')}
              </p>
            )}

            {selected.mechanicMessage && (
              <p className="text-sm text-muted-foreground">Wiadomość mechanika: {selected.mechanicMessage}</p>
            )}

            <RepairWorkDetails report={selected} showCost={userRole === 'owner'} />
          </CardContent>
        </Card>
      )}
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
