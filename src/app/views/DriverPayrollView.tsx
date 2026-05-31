import { Button } from '@/app/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/Card'
import { Input, Label, Select } from '@/app/components/ui/Input'
import { loadCourses, seedDemoCourses } from '@/lib/domain/courses-store'
import { loadDailyReports, seedDemoDailyReports } from '@/lib/domain/daily-reports-store'
import { loadDrivers, seedDemoDrivers } from '@/lib/domain/drivers-store'
import {
  buildDriverPayrollSummaries,
  PAYROLL_RATE_LABELS,
  upsertDriverPayrollRate,
  type DriverPayrollRateType,
} from '@/lib/domain/driver-payroll'
import { useCloudSyncRefreshKeys } from '@/lib/sync/useCloudSyncRefresh'
import { Calculator } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

interface DriverPayrollViewProps {
  tenantId: string
}

function weekRange(): { from: string; to: string } {
  const now = new Date()
  const day = now.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const mon = new Date(now)
  mon.setDate(now.getDate() + diff)
  const sun = new Date(mon)
  sun.setDate(mon.getDate() + 6)
  return { from: mon.toISOString().slice(0, 10), to: sun.toISOString().slice(0, 10) }
}

export function DriverPayrollView({ tenantId }: DriverPayrollViewProps) {
  const [fromDate, setFromDate] = useState(() => weekRange().from)
  const [toDate, setToDate] = useState(() => weekRange().to)
  const [tick, setTick] = useState(0)

  const refresh = useCallback(() => {
    seedDemoDrivers(tenantId)
    seedDemoCourses(tenantId)
    seedDemoDailyReports(tenantId)
    setTick((t) => t + 1)
  }, [tenantId])

  useEffect(() => {
    refresh()
  }, [refresh])

  useCloudSyncRefreshKeys(
    tenantId,
    ['drivers', 'courses', 'daily-reports', 'driver-payroll-rates'],
    refresh,
  )

  const summaries = useMemo(() => {
    void tick
    const drivers = loadDrivers(tenantId)
    const courses = loadCourses(tenantId)
    const reports = loadDailyReports(tenantId)
    return buildDriverPayrollSummaries(tenantId, drivers, courses, reports, fromDate, toDate)
  }, [tenantId, fromDate, toDate, tick])

  function saveRate(driverId: string, rateType: DriverPayrollRateType, rateValue: number) {
    upsertDriverPayrollRate(tenantId, {
      id: crypto.randomUUID(),
      driverId,
      rateType,
      rateValue,
      updatedAt: new Date().toISOString(),
    })
    refresh()
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Wynagrodzenia kierowców</h1>
        <p className="text-sm text-muted-foreground">
          Stawki km / dzień / % frachtu — zestawienie z raportów kabiny
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="space-y-1">
          <Label>Od</Label>
          <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Do</Label>
          <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        </div>
      </div>

      <div className="space-y-3">
        {summaries.map((s) => (
          <Card key={s.driverId}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{s.driverName}</CardTitle>
              <CardDescription>
                {s.totalKm} km · {s.totalDays} dni raportów · koszty kabiny{' '}
                {s.totalCostsPln.toLocaleString('pl-PL')} zł
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <RateEditor
                driverId={s.driverId}
                rateType={s.rateType}
                rateValue={s.rateValue}
                onSave={saveRate}
              />
              <p className="flex items-center gap-2 text-lg font-semibold text-success">
                <Calculator className="h-5 w-5" />
                Do wypłaty: {s.grossPayPln.toLocaleString('pl-PL', { maximumFractionDigits: 2 })} zł
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function RateEditor({
  driverId,
  rateType,
  rateValue,
  onSave,
}: {
  driverId: string
  rateType: DriverPayrollRateType
  rateValue: number
  onSave: (driverId: string, type: DriverPayrollRateType, value: number) => void
}) {
  const [type, setType] = useState(rateType)
  const [value, setValue] = useState(String(rateValue))

  return (
    <div className="flex flex-wrap items-end gap-2 text-sm">
      <div className="space-y-1">
        <Label>Model rozliczenia</Label>
        <Select value={type} onChange={(e) => setType(e.target.value as DriverPayrollRateType)}>
          {Object.entries(PAYROLL_RATE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-1">
        <Label>Stawka</Label>
        <Input value={value} onChange={(e) => setValue(e.target.value)} className="w-24" />
      </div>
      <Button size="sm" variant="secondary" onClick={() => onSave(driverId, type, Number(value) || 0)}>
        Zapisz stawkę
      </Button>
    </div>
  )
}
