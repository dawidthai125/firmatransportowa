import type { Course } from '@/lib/domain/course'
import type { DailyReport } from '@/lib/domain/daily-report'
import { dailyReportTotalCosts } from '@/lib/domain/daily-report'
import type { Vehicle } from '@/lib/domain/vehicle'

export interface VehicleMarginRow {
  vehicleId: string
  registration: string
  courseCount: number
  freightPln: number
  plannedCostsPln: number
  actualCostsPln: number
  plannedMarginPln: number
  actualMarginPln: number
}

export function buildVehicleMarginRows(
  vehicles: Vehicle[],
  courses: Course[],
  reports: DailyReport[],
): VehicleMarginRow[] {
  const reportCostsByCourse = new Map<string, number>()
  for (const r of reports) {
    if (!r.courseId) continue
    reportCostsByCourse.set(
      r.courseId,
      (reportCostsByCourse.get(r.courseId) ?? 0) + dailyReportTotalCosts(r),
    )
  }

  return vehicles.map((v) => {
    const vehicleCourses = courses.filter((c) => c.vehicleId === v.id)
    const freightPln = vehicleCourses.reduce((s, c) => s + c.freightPln, 0)
    const plannedCostsPln = vehicleCourses.reduce((s, c) => s + (c.routeCostsPln ?? 0), 0)
    const actualCostsPln = vehicleCourses.reduce(
      (s, c) => s + (reportCostsByCourse.get(c.id) ?? 0),
      0,
    )
    const plannedMarginPln = freightPln - plannedCostsPln
    const actualMarginPln = freightPln - (actualCostsPln > 0 ? actualCostsPln : plannedCostsPln)

    return {
      vehicleId: v.id,
      registration: v.registration,
      courseCount: vehicleCourses.length,
      freightPln,
      plannedCostsPln,
      actualCostsPln,
      plannedMarginPln,
      actualMarginPln,
    }
  }).filter((r) => r.courseCount > 0)
}
