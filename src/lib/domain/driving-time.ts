import type { DailyReport } from '@/lib/domain/daily-report'

/** Rozporządzenie (WE) nr 561/2006 — orientacyjne limity dzienne */
export const MAX_DAILY_DRIVING_MINUTES = 9 * 60
export const EXTENDED_DAILY_DRIVING_MINUTES = 10 * 60
export const MAX_CONTINUOUS_DRIVING_MINUTES = 4 * 60 + 30
export const WARN_MINUTES_BEFORE_LIMIT = 30

export type DrivingTimeStatus = 'ok' | 'warning' | 'exceeded'

export interface DrivingTimeCheck {
  drivingMinutes: number
  limitMinutes: number
  remainingMinutes: number
  status: DrivingTimeStatus
  /** Przekroczenie ciągłej jazdy bez przerwy 45 min (deklaracja z jednego dnia) */
  continuousRisk: boolean
}

export interface DrivingTimeAlert {
  id: string
  tenantId: string
  driverName: string
  date: string
  drivingMinutes: number
  limitMinutes: number
  status: DrivingTimeStatus
  message: string
}

export function checkDailyDrivingLimit(
  drivingMinutes: number,
  extendedDay = false,
): DrivingTimeCheck {
  const limit = extendedDay ? EXTENDED_DAILY_DRIVING_MINUTES : MAX_DAILY_DRIVING_MINUTES
  const remaining = limit - drivingMinutes
  let status: DrivingTimeStatus = 'ok'
  if (drivingMinutes > limit) status = 'exceeded'
  else if (remaining <= WARN_MINUTES_BEFORE_LIMIT) status = 'warning'

  return {
    drivingMinutes,
    limitMinutes: limit,
    remainingMinutes: remaining,
    status,
    continuousRisk: drivingMinutes > MAX_CONTINUOUS_DRIVING_MINUTES,
  }
}

export function sumDrivingMinutesForDate(
  reports: DailyReport[],
  driverName: string,
  date: string,
): number {
  return reports
    .filter((r) => r.driverName === driverName && r.date === date)
    .reduce((sum, r) => sum + (r.drivingMinutes ?? 0), 0)
}

export function getWeekStart(isoDate: string): string {
  const d = new Date(isoDate + 'T12:00:00')
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d.toISOString().slice(0, 10)
}

export function isDateInWeek(date: string, weekStart: string): boolean {
  const start = new Date(weekStart + 'T00:00:00')
  const end = new Date(start)
  end.setDate(end.getDate() + 7)
  const d = new Date(date + 'T12:00:00')
  return d >= start && d < end
}

export function sumDrivingMinutesForWeek(
  reports: DailyReport[],
  driverName: string,
  weekStart: string,
): number {
  return reports
    .filter((r) => r.driverName === driverName && isDateInWeek(r.date, weekStart))
    .reduce((sum, r) => sum + (r.drivingMinutes ?? 0), 0)
}

export function buildDrivingTimeAlerts(
  tenantId: string,
  reports: DailyReport[],
): DrivingTimeAlert[] {
  const alerts: DrivingTimeAlert[] = []
  const seen = new Set<string>()

  for (const report of reports) {
    const minutes = report.drivingMinutes ?? 0
    if (minutes <= 0) continue

    const key = `${report.driverName}-${report.date}`
    if (seen.has(key)) continue
    seen.add(key)

    const check = checkDailyDrivingLimit(minutes)
    if (check.status === 'ok' && !check.continuousRisk) continue

    let message = ''
    if (check.status === 'exceeded') {
      message = `Przekroczono dzienny limit jazdy (${formatDrivingHours(minutes)} / ${formatDrivingHours(check.limitMinutes)})`
    } else if (check.status === 'warning') {
      message = `Zbliżasz się do limitu jazdy — pozostało ${check.remainingMinutes} min`
    } else if (check.continuousRisk) {
      message = `Ryzyko przekroczenia ciągłej jazdy 4,5 h bez przerwy 45 min`
    }

    alerts.push({
      id: `drive-${report.driverName}-${report.date}`,
      tenantId,
      driverName: report.driverName,
      date: report.date,
      drivingMinutes: minutes,
      limitMinutes: check.limitMinutes,
      status: check.continuousRisk && check.status === 'ok' ? 'warning' : check.status,
      message,
    })
  }

  return alerts.sort((a, b) => a.date.localeCompare(b.date))
}

export function formatDrivingHours(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}

export const DRIVING_TIME_STATUS_COLORS: Record<DrivingTimeStatus, string> = {
  ok: 'bg-success/15 text-success',
  warning: 'bg-warning/15 text-warning',
  exceeded: 'bg-danger/15 text-danger',
}
