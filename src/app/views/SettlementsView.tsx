import { Button } from '@/app/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/Card'
import { loadCourses, seedDemoCourses } from '@/lib/domain/courses-store'
import { loadDrivers, seedDemoDrivers } from '@/lib/domain/drivers-store'
import { loadDailyReports, seedDemoDailyReports } from '@/lib/domain/daily-reports-store'
import type { DailyReport } from '@/lib/domain/daily-report'
import type { Course } from '@/lib/domain/course'
import type { Driver } from '@/lib/domain/driver'
import {
  buildDrivingTimeAlerts,
  DRIVING_TIME_STATUS_COLORS,
  formatDrivingHours,
  getWeekStart,
  MAX_DAILY_DRIVING_MINUTES,
} from '@/lib/domain/driving-time'
import {
  buildClientMarginSummaries,
  buildDriverWeeklySummaries,
  type ClientMarginSummary,
  type DriverWeeklySummary,
} from '@/lib/domain/settlements'
import {
  buildCourseSettlementSummaries,
  courseCostOverruns,
} from '@/lib/domain/course-settlement'
import { useCloudSyncRefreshKeys } from '@/lib/sync/useCloudSyncRefresh'
import { useFilePreview } from '@/app/components/file-preview/FilePreviewProvider'
import {
  buildClientMarginsCsvFile,
  buildCoursesCsvFile,
  buildDailyReportsCsvFile,
  buildSettlementHtmlFile,
  buildSettlementPdfFile,
  buildWeeklySummariesCsvFile,
} from '@/lib/export/documents'
import { cn } from '@/lib/utils'
import { AlertTriangle, Clock, Eye, FileText, TrendingUp, Users } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

interface SettlementsViewProps {
  tenantId: string
  tenantSlug: string
  tenantName: string
}

export function SettlementsView({ tenantId, tenantSlug, tenantName }: SettlementsViewProps) {
  const { openPreview } = useFilePreview()
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date().toISOString().slice(0, 10)))
  const [reports, setReports] = useState<DailyReport[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [courses, setCourses] = useState<Course[]>([])

  const refresh = useCallback(() => {
    seedDemoCourses(tenantId)
    seedDemoDrivers(tenantId)
    seedDemoDailyReports(tenantId)
    setReports(loadDailyReports(tenantId))
    setDrivers(loadDrivers(tenantId))
    setCourses(loadCourses(tenantId))
  }, [tenantId])

  useEffect(() => {
    refresh()
  }, [refresh])

  useCloudSyncRefreshKeys(tenantId, ['daily-reports', 'courses'], refresh)

  const weeklySummaries: DriverWeeklySummary[] = useMemo(
    () => buildDriverWeeklySummaries(reports, drivers, weekStart),
    [reports, drivers, weekStart],
  )
  const clientMargins: ClientMarginSummary[] = useMemo(
    () => buildClientMarginSummaries(courses),
    [courses],
  )
  const drivingAlerts = useMemo(
    () => buildDrivingTimeAlerts(tenantId, reports),
    [tenantId, reports],
  )
  const courseSettlements = useMemo(
    () => buildCourseSettlementSummaries(courses, reports).filter((s) => s.reportDays > 0),
    [courses, reports],
  )
  const overruns = useMemo(() => courseCostOverruns(courseSettlements), [courseSettlements])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Rozliczenia i czas jazdy</h1>
        <p className="text-sm text-muted-foreground">
          561/2006 · podsumowanie tygodnia · marże · eksport CSV
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4 text-primary" />
              Eksport i podgląd
            </CardTitle>
            <CardDescription>
              Otwórz w dedykowanym viewerze (CSV / PDF / HTML) — pobierz stamtąd
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="secondary"
              className="gap-1"
              onClick={() =>
                openPreview(buildDailyReportsCsvFile(reports, tenantSlug), { tenantId, allowSave: true })
              }
            >
              <Eye className="h-3.5 w-3.5" />
              Raporty CSV
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="gap-1"
              onClick={() =>
                openPreview(buildWeeklySummariesCsvFile(weeklySummaries, tenantSlug, weekStart), {
                  tenantId,
                  allowSave: true,
                })
              }
            >
              <Eye className="h-3.5 w-3.5" />
              Tydzień CSV
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="gap-1"
              onClick={() => openPreview(buildCoursesCsvFile(courses, tenantSlug), { tenantId, allowSave: true })}
            >
              <Eye className="h-3.5 w-3.5" />
              Kursy CSV
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="gap-1"
              onClick={() =>
                openPreview(buildClientMarginsCsvFile(clientMargins, tenantSlug), { tenantId, allowSave: true })
              }
            >
              <Eye className="h-3.5 w-3.5" />
              Marże CSV
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="gap-1"
              onClick={() =>
                openPreview(buildSettlementPdfFile(tenantName, weeklySummaries, weekStart), {
                  tenantId,
                  allowSave: true,
                })
              }
            >
              <Eye className="h-3.5 w-3.5" />
              PDF tydzień
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="gap-1"
              onClick={() =>
                openPreview(buildSettlementHtmlFile(tenantName, weeklySummaries, clientMargins, weekStart), {
                  tenantId,
                  allowSave: true,
                })
              }
            >
              <Eye className="h-3.5 w-3.5" />
              Raport HTML
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4 text-warning" />
            Czas jazdy — rozporządzenie 561/2006
          </CardTitle>
          <CardDescription>
            Limit dzienny: {formatDrivingHours(MAX_DAILY_DRIVING_MINUTES)} (9 h) · ostrzeżenie 30 min przed limitem
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {drivingAlerts.length === 0 ? (
            <p className="text-sm text-success">Brak alertów czasu jazdy w raportach.</p>
          ) : (
            drivingAlerts.map((alert) => (
              <div
                key={alert.id}
                className={cn(
                  'flex flex-wrap items-center gap-3 rounded-lg border border-border p-3',
                  alert.status === 'exceeded' && 'border-danger/40',
                )}
              >
                <AlertTriangle
                  className={cn(
                    'h-4 w-4 shrink-0',
                    alert.status === 'exceeded' ? 'text-danger' : 'text-warning',
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    {alert.driverName} · {alert.date}
                  </p>
                  <p className="text-xs text-muted-foreground">{alert.message}</p>
                </div>
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-xs font-medium',
                    DRIVING_TIME_STATUS_COLORS[alert.status],
                  )}
                >
                  {formatDrivingHours(alert.drivingMinutes)}
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className={overruns.length > 0 ? 'border-warning/40' : ''}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-success" />
            Marża per kurs (z raportów kierowcy)
          </CardTitle>
          <CardDescription>
            Plan z kursu vs km i koszty (paliwo, myto) wpisane w kabinie — bez nowej zakładki w menu
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {courseSettlements.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Brak raportów przypisanych do kursów. Kierowca wybiera kurs w raporcie dziennym.
            </p>
          ) : (
            courseSettlements.map((s) => (
              <div
                key={s.courseId}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm"
              >
                <div>
                  <span className="font-medium">{s.reference}</span>
                  <span className="ml-2 text-muted-foreground">{s.shipper}</span>
                  <p className="text-xs text-muted-foreground">
                    {s.reportDays} dni raportu · {s.reportKm} km · koszty{' '}
                    {s.reportCostsPln.toLocaleString('pl-PL')} zł
                  </p>
                </div>
                <div className="text-right text-xs">
                  {s.plannedMarginPln != null && (
                    <p>Plan: {s.plannedMarginPln.toLocaleString('pl-PL')} zł</p>
                  )}
                  {s.actualMarginPln != null && (
                    <p
                      className={cn(
                        'font-medium',
                        (s.variancePln ?? 0) >= 0 ? 'text-success' : 'text-warning',
                      )}
                    >
                      Rzeczywista: {s.actualMarginPln.toLocaleString('pl-PL')} zł
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4 text-primary" />
              Podsumowanie tygodnia kierowców
            </CardTitle>
            <CardDescription>Km, czas jazdy i koszty z raportów dziennych</CardDescription>
          </div>
          <input
            type="date"
            value={weekStart}
            onChange={(e) => setWeekStart(getWeekStart(e.target.value))}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </CardHeader>
        <CardContent>
          {weeklySummaries.every((s) => s.daysReported === 0) ? (
            <p className="text-sm text-muted-foreground">Brak raportów w wybranym tygodniu.</p>
          ) : (
            <div className="space-y-2">
              {weeklySummaries
                .filter((s) => s.daysReported > 0)
                .map((s) => (
                  <div
                    key={s.driverName}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/40 px-3 py-2 text-sm"
                  >
                    <span className="font-medium">{s.driverName}</span>
                    <span className="text-muted-foreground">
                      {s.daysReported} dni · {s.totalKm} km ·{' '}
                      {formatDrivingHours(s.totalDrivingMinutes)} · {s.totalCostsPln.toLocaleString('pl-PL')} zł
                    </span>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-success" />
            Marża per klient (nadawca)
          </CardTitle>
          <CardDescription>Sumy frachtu i kosztów z aktywnych kursów</CardDescription>
        </CardHeader>
        <CardContent>
          {clientMargins.length === 0 ? (
            <p className="text-sm text-muted-foreground">Brak kursów do rozliczenia.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="pb-2 pr-4">Nadawca</th>
                    <th className="pb-2 pr-4">Kursy</th>
                    <th className="pb-2 pr-4">Fracht PLN</th>
                    <th className="pb-2 pr-4">Fracht EUR</th>
                    <th className="pb-2 pr-4">Koszty</th>
                    <th className="pb-2">Marża PLN</th>
                  </tr>
                </thead>
                <tbody>
                  {clientMargins.map((row) => (
                    <tr key={row.shipper} className="border-b border-border/50">
                      <td className="py-2 pr-4 font-medium">{row.shipper}</td>
                      <td className="py-2 pr-4">{row.courseCount}</td>
                      <td className="py-2 pr-4">{row.freightPln.toLocaleString('pl-PL')}</td>
                      <td className="py-2 pr-4">
                        {row.freightEur > 0 ? row.freightEur.toLocaleString('pl-PL') : '—'}
                      </td>
                      <td className="py-2 pr-4">{row.costsPln.toLocaleString('pl-PL')}</td>
                      <td
                        className={cn(
                          'py-2 font-medium',
                          row.marginPln >= 0 ? 'text-success' : 'text-danger',
                        )}
                      >
                        {row.marginPln.toLocaleString('pl-PL')} zł
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
