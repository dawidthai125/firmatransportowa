import type { Course } from '@/lib/domain/course'
import { courseMargin } from '@/lib/domain/course'
import type { DailyReport } from '@/lib/domain/daily-report'
import { dailyReportTotalCosts } from '@/lib/domain/daily-report'
import {
  formatDrivingHours,
  getWeekStart,
  isDateInWeek,
  sumDrivingMinutesForWeek,
} from '@/lib/domain/driving-time'
import type { Driver } from '@/lib/domain/driver'
import { driverDisplayName } from '@/lib/domain/driver'

export interface DriverWeeklySummary {
  driverId?: string
  driverName: string
  weekStart: string
  daysReported: number
  totalKm: number
  totalDrivingMinutes: number
  totalCostsPln: number
  shiftEndedDays: number
}

export interface ClientMarginSummary {
  shipper: string
  courseCount: number
  freightPln: number
  freightEur: number
  costsPln: number
  marginPln: number
}

export function buildDriverWeeklySummaries(
  reports: DailyReport[],
  drivers: Driver[],
  weekStart: string,
): DriverWeeklySummary[] {
  const names = new Set<string>()
  for (const d of drivers) names.add(driverDisplayName(d))
  for (const r of reports) {
    if (isDateInWeek(r.date, weekStart)) names.add(r.driverName)
  }

  return [...names].map((driverName) => {
    const weekReports = reports.filter(
      (r) => r.driverName === driverName && isDateInWeek(r.date, weekStart),
    )
    const driver = drivers.find((d) => driverDisplayName(d) === driverName)

    return {
      driverId: driver?.id,
      driverName,
      weekStart,
      daysReported: new Set(weekReports.map((r) => r.date)).size,
      totalKm: weekReports.reduce((s, r) => s + r.kmDriven, 0),
      totalDrivingMinutes: sumDrivingMinutesForWeek(reports, driverName, weekStart),
      totalCostsPln: weekReports.reduce((s, r) => s + dailyReportTotalCosts(r), 0),
      shiftEndedDays: weekReports.filter((r) => r.shiftEnded).length,
    }
  }).sort((a, b) => a.driverName.localeCompare(b.driverName))
}

export function buildClientMarginSummaries(courses: Course[]): ClientMarginSummary[] {
  const map = new Map<string, ClientMarginSummary>()

  for (const course of courses) {
    if (course.status === 'cancelled') continue
    const key = course.shipper.trim() || '—'
    const existing = map.get(key) ?? {
      shipper: key,
      courseCount: 0,
      freightPln: 0,
      freightEur: 0,
      costsPln: 0,
      marginPln: 0,
    }
    existing.courseCount += 1
    existing.freightPln += course.freightPln
    existing.freightEur += course.freightEur ?? 0
    existing.costsPln += course.routeCostsPln ?? 0
    const margin = courseMargin(course)
    if (margin != null) existing.marginPln += margin
    map.set(key, existing)
  }

  return [...map.values()].sort((a, b) => b.marginPln - a.marginPln)
}

export function weeklySummaryLabel(summary: DriverWeeklySummary): string {
  return `${summary.driverName}: ${summary.totalKm} km · ${formatDrivingHours(summary.totalDrivingMinutes)} jazdy · ${summary.totalCostsPln.toLocaleString('pl-PL')} zł kosztów`
}

export { getWeekStart }
