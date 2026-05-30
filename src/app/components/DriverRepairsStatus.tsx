import { Card, CardContent } from '@/app/components/ui/Card'
import {
  REPAIR_STATUS_COLORS,
  REPAIR_STATUS_LABELS,
  type RepairReport,
} from '@/lib/domain/repair-report'
import { loadRepairReportsForDriver, seedDemoRepairReports } from '@/lib/domain/repair-reports-store'
import { cn } from '@/lib/utils'
import { Calendar, MessageCircle, Wrench } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

interface DriverRepairsStatusProps {
  tenantId: string
  driverName: string
  compact?: boolean
}

export function DriverRepairsStatus({ tenantId, driverName, compact }: DriverRepairsStatusProps) {
  const [reports, setReports] = useState<RepairReport[]>([])

  const refresh = useCallback(() => {
    seedDemoRepairReports(tenantId)
    setReports(loadRepairReportsForDriver(tenantId, driverName))
  }, [tenantId, driverName])

  useEffect(() => {
    refresh()
  }, [refresh])

  const active = reports.filter((r) => !['completed', 'rejected'].includes(r.status))
  if (active.length === 0) return null

  if (compact) {
    const latest = active[0]
    return (
      <Card className="border-warning/40 bg-warning/5">
        <CardContent className="flex items-start gap-3 p-4">
          <Wrench className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
          <div className="min-w-0 text-sm">
            <p className="font-medium">Twoja awaria: {latest.reference}</p>
            <p className="text-muted-foreground">
              {REPAIR_STATUS_LABELS[latest.status]}
              {latest.mechanicMessage ? ` · ${latest.mechanicMessage}` : ''}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Twoje zgłoszenia awarii</p>
      {active.map((r) => (
        <Card key={r.id}>
          <CardContent className="space-y-2 p-4 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium">
                {r.reference} · {r.vehicleRegistration}
              </p>
              <span
                className={cn('rounded-full px-2 py-0.5 text-xs font-medium', REPAIR_STATUS_COLORS[r.status])}
              >
                {REPAIR_STATUS_LABELS[r.status]}
              </span>
            </div>
            <p className="text-muted-foreground">{r.title}</p>
            {r.scheduledRepairAt && (
              <p className="flex items-center gap-1.5 text-success">
                <Calendar className="h-3.5 w-3.5" />
                Termin: {new Date(r.scheduledRepairAt).toLocaleString('pl-PL')}
              </p>
            )}
            {r.mechanicMessage && (
              <p className="flex items-start gap-1.5 text-warning">
                <MessageCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Mechanik: {r.mechanicMessage}
              </p>
            )}
            {r.mechanicName && r.status !== 'submitted' && (
              <p className="text-xs text-muted-foreground">Warsztat: {r.mechanicName}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
