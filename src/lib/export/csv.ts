import type { Course } from '@/lib/domain/course'
import type { DailyReport } from '@/lib/domain/daily-report'
import { dailyReportTotalCosts } from '@/lib/domain/daily-report'
import type { DriverWeeklySummary, ClientMarginSummary } from '@/lib/domain/settlements'

function escapeCsv(value: string | number | boolean | undefined | null): string {
  if (value == null) return ''
  const s = String(value)
  if (s.includes('"') || s.includes(',') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function downloadCsv(filename: string, rows: (string | number | boolean | null | undefined)[][]): void {
  const bom = '\uFEFF'
  const body = rows.map((row) => row.map(escapeCsv).join(';')).join('\r\n')
  const blob = new Blob([bom + body], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function exportDailyReportsCsv(reports: DailyReport[], tenantSlug: string): void {
  const header = [
    'Data',
    'Kierowca',
    'Kurs',
    'Km',
    'Paliwo_l',
    'Paliwo_zl',
    'Myto_zl',
    'Myto_EUR',
    'Parking_zl',
    'Inne_zl',
    'Koszty_lacznie_zl',
    'Jazda_min',
    'Postoj_min',
    'Granica',
    'Koniec_pracy',
    'Uwagi',
  ]
  const rows = reports.map((r) => [
    r.date,
    r.driverName,
    r.courseReference ?? '',
    r.kmDriven,
    r.fuelLiters ?? '',
    r.fuelCostPln ?? '',
    r.tollPln ?? '',
    r.tollEur ?? '',
    r.parkingPln ?? '',
    r.otherCostsPln ?? '',
    dailyReportTotalCosts(r),
    r.drivingMinutes ?? '',
    r.restMinutes ?? '',
    r.borderCrossings ?? '',
    r.shiftEnded ? 'tak' : 'nie',
    r.notes ?? '',
  ])
  downloadCsv(`transflow-raporty-${tenantSlug}-${todayIso()}.csv`, [header, ...rows])
}

export function exportWeeklySummariesCsv(
  summaries: DriverWeeklySummary[],
  tenantSlug: string,
  weekStart: string,
): void {
  const header = [
    'Tydzien_od',
    'Kierowca',
    'Dni_raportow',
    'Km_lacznie',
    'Jazda_min',
    'Koszty_zl',
    'Dni_koniec_pracy',
  ]
  const rows = summaries.map((s) => [
    weekStart,
    s.driverName,
    s.daysReported,
    s.totalKm,
    s.totalDrivingMinutes,
    s.totalCostsPln,
    s.shiftEndedDays,
  ])
  downloadCsv(`transflow-tydzien-${tenantSlug}-${weekStart}.csv`, [header, ...rows])
}

export function exportCoursesCsv(courses: Course[], tenantSlug: string): void {
  const header = [
    'Referencja',
    'Status',
    'Zakres',
    'Nadawca',
    'Odbiorca',
    'Trasa',
    'Fracht_PLN',
    'Fracht_EUR',
    'Koszty_PLN',
    'CMR',
  ]
  const rows = courses.map((c) => [
    c.reference,
    c.status,
    c.scope,
    c.shipper,
    c.consignee,
    `${c.loadCity} (${c.loadCountry}) → ${c.unloadCity} (${c.unloadCountry})`,
    c.freightPln,
    c.freightEur ?? '',
    c.routeCostsPln ?? '',
    c.cmrNumber ?? '',
  ])
  downloadCsv(`transflow-kursy-${tenantSlug}-${todayIso()}.csv`, [header, ...rows])
}

export function exportClientMarginsCsv(
  summaries: ClientMarginSummary[],
  tenantSlug: string,
): void {
  const header = ['Nadawca', 'Liczba_kursow', 'Fracht_PLN', 'Fracht_EUR', 'Koszty_PLN', 'Marza_PLN']
  const rows = summaries.map((s) => [
    s.shipper,
    s.courseCount,
    s.freightPln,
    s.freightEur,
    s.costsPln,
    s.marginPln,
  ])
  downloadCsv(`transflow-marze-${tenantSlug}-${todayIso()}.csv`, [header, ...rows])
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}
