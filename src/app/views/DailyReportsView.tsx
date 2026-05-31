import { Card, CardContent } from '@/app/components/ui/Card'
import { dailyReportTotalCosts } from '@/lib/domain/daily-report'
import {
  formatDailyReportFuel,
  formatDailyReportOtherCosts,
  formatDailyReportParking,
  formatDailyReportTollEur,
  formatDailyReportTollPln,
} from '@/lib/domain/daily-report-format'
import { loadDailyReports } from '@/lib/domain/daily-reports-store'
import { useCloudSyncRefresh } from '@/lib/sync/useCloudSyncRefresh'
import { cn } from '@/lib/utils'
import { CheckCircle2, Clock, FileText, MapPin, User } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { DailyReport } from '@/lib/domain/daily-report'

interface DailyReportsViewProps {
  tenantId: string
}

export function DailyReportsView({ tenantId }: DailyReportsViewProps) {
  const [reports, setReports] = useState<DailyReport[]>([])
  const [dateFilter, setDateFilter] = useState('')

  const refresh = useCallback(() => {
    setReports(loadDailyReports(tenantId))
  }, [tenantId])

  useEffect(() => {
    refresh()
  }, [refresh])

  useCloudSyncRefresh(tenantId, 'daily-reports', refresh)

  const filtered = useMemo(() => {
    const sorted = [...reports].sort((a, b) => b.date.localeCompare(a.date))
    if (!dateFilter) return sorted
    return sorted.filter((r) => r.date === dateFilter)
  }, [reports, dateFilter])

  const today = new Date().toISOString().slice(0, 10)
  const todayCount = reports.filter((r) => r.date === today).length
  const endedCount = reports.filter((r) => r.shiftEnded).length

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Raporty dzienne</h1>
          <p className="text-sm text-muted-foreground">
            {reports.length} raportów · {todayCount} dziś · {endedCount} zakończonych zmian
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Koszty w zł — brutto (zapłacone). Opłaty w EUR pokazane osobno i nie wchodzą w sumę zł.
          </p>
        </div>
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="w-full min-w-0 rounded-md border border-border bg-background px-3 py-2 text-sm sm:w-auto"
        />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex items-center gap-3 p-6 text-muted-foreground">
            <FileText className="h-8 w-8 shrink-0" />
            <div>
              <p className="font-medium text-foreground">Brak raportów</p>
              <p className="text-sm">Kierowcy zgłaszają km i koszty w aplikacji mobilnej.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>
      )}
    </div>
  )
}

function ReportCard({ report }: { report: DailyReport }) {
  const totalCosts = dailyReportTotalCosts(report)
  const costLines = [
    report.fuelLiters != null && report.fuelLiters > 0
      ? formatDailyReportFuel(report.fuelLiters, report.fuelCostPln)
      : null,
    report.tollPln != null && report.tollPln > 0 ? formatDailyReportTollPln(report.tollPln) : null,
    report.tollEur != null && report.tollEur > 0 ? formatDailyReportTollEur(report.tollEur) : null,
    report.parkingPln != null && report.parkingPln > 0
      ? formatDailyReportParking(report.parkingPln)
      : null,
    report.otherCostsPln != null && report.otherCostsPln > 0
      ? formatDailyReportOtherCosts(report.otherCostsPln)
      : null,
  ].filter(Boolean)

  return (
    <Card className={cn(report.shiftEnded && 'border-success/30')}>
      <CardContent className="space-y-3 p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            <span className="font-semibold">{report.driverName}</span>
            <span className="text-sm text-muted-foreground">· {report.date}</span>
          </div>
          {report.shiftEnded ? (
            <span className="flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-xs font-medium text-success">
              <CheckCircle2 className="h-3 w-3" />
              Koniec pracy
            </span>
          ) : (
            <span className="flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-xs font-medium text-warning">
              <Clock className="h-3 w-3" />
              W trakcie
            </span>
          )}
        </div>

        {report.courseReference && (
          <p className="text-sm text-muted-foreground">Kurs: {report.courseReference}</p>
        )}

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
            {report.kmDriven.toLocaleString('pl-PL')} km
          </span>
          {costLines.map((line) => (
            <span key={line}>{line}</span>
          ))}
          {totalCosts > 0 && (
            <span>
              Koszty łącznie (zł): <strong>{totalCosts.toLocaleString('pl-PL')} zł</strong>
            </span>
          )}
        </div>

        {(report.drivingMinutes != null || report.restMinutes != null) && (
          <p className="text-xs text-muted-foreground">
            Jazda: {report.drivingMinutes ?? 0} min · postój/załadunek: {report.restMinutes ?? 0} min
          </p>
        )}

        {report.borderCrossings && (
          <p className="text-xs text-muted-foreground">Przekroczenia: {report.borderCrossings}</p>
        )}

        {report.notes && <p className="text-sm text-muted-foreground">{report.notes}</p>}
      </CardContent>
    </Card>
  )
}
