import type { Course } from '@/lib/domain/course'
import { courseMargin } from '@/lib/domain/course'
import type { DailyReport } from '@/lib/domain/daily-report'
import { dailyReportTotalCosts } from '@/lib/domain/daily-report'
import { findDriverByDisplayName } from '@/lib/domain/driver-profile'
import { isDateInWeek, getWeekStart } from '@/lib/domain/driving-time'

export interface CourseSettlementSummary {
  courseId: string
  reference: string
  shipper: string
  status: Course['status']
  freightPln: number
  freightEur?: number
  plannedCostsPln: number
  reportCostsPln: number
  reportKm: number
  reportDays: number
  tollEurFromReports: number
  plannedMarginPln: number | null
  actualMarginPln: number | null
  /** actual − planned (ujemne = raporty zjadły więcej niż plan) */
  variancePln: number | null
}

const ACTIVE_STATUSES = new Set<Course['status']>(['planned', 'loading', 'in_transit'])

export function reportsForCourse(course: Course, reports: DailyReport[]): DailyReport[] {
  return reports.filter(
    (r) =>
      r.courseId === course.id ||
      (r.courseReference && r.courseReference === course.reference),
  )
}

export function buildCourseSettlementSummaries(
  courses: Course[],
  reports: DailyReport[],
): CourseSettlementSummary[] {
  return courses
    .filter((c) => c.status !== 'cancelled')
    .map((course) => {
      const linked = reportsForCourse(course, reports)
      const reportCostsPln = linked.reduce((s, r) => s + dailyReportTotalCosts(r), 0)
      const reportKm = linked.reduce((s, r) => s + r.kmDriven, 0)
      const tollEurFromReports = linked.reduce((s, r) => s + (r.tollEur ?? 0), 0)
      const plannedCostsPln = course.routeCostsPln ?? 0
      const plannedMargin = courseMargin(course)
      const actualMarginPln =
        course.freightPln > 0 ? course.freightPln - plannedCostsPln - reportCostsPln : null

      return {
        courseId: course.id,
        reference: course.reference,
        shipper: course.shipper,
        status: course.status,
        freightPln: course.freightPln,
        freightEur: course.freightEur,
        plannedCostsPln,
        reportCostsPln,
        reportKm,
        reportDays: new Set(linked.map((r) => r.date)).size,
        tollEurFromReports,
        plannedMarginPln: plannedMargin,
        actualMarginPln,
        variancePln:
          plannedMargin != null && actualMarginPln != null
            ? actualMarginPln - plannedMargin
            : null,
      }
    })
    .sort((a, b) => b.reportCostsPln - a.reportCostsPln)
}

export function activeCourseForDriver(
  tenantId: string,
  driverName: string,
  courses: Course[],
): Course | undefined {
  const driver = findDriverByDisplayName(tenantId, driverName)
  const mine = courses.filter(
    (c) =>
      ACTIVE_STATUSES.has(c.status) &&
      (driver ? c.driverId === driver.id : c.driverId == null),
  )
  const rank: Course['status'][] = ['in_transit', 'loading', 'planned']
  for (const status of rank) {
    const hit = mine.find((c) => c.status === status)
    if (hit) return hit
  }
  return undefined
}

export interface WeeklyOpsSummary {
  weekStart: string
  reportCount: number
  totalKm: number
  totalCostsPln: number
  driversReporting: number
  activeCourses: number
  coursesWithReports: number
}

export function buildWeeklyOpsSummary(
  courses: Course[],
  reports: DailyReport[],
  weekStart = getWeekStart(new Date().toISOString().slice(0, 10)),
): WeeklyOpsSummary {
  const weekReports = reports.filter((r) => isDateInWeek(r.date, weekStart))
  const settlements = buildCourseSettlementSummaries(courses, reports)
  return {
    weekStart,
    reportCount: weekReports.length,
    totalKm: weekReports.reduce((s, r) => s + r.kmDriven, 0),
    totalCostsPln: weekReports.reduce((s, r) => s + dailyReportTotalCosts(r), 0),
    driversReporting: new Set(weekReports.map((r) => r.driverName)).size,
    activeCourses: courses.filter((c) => ACTIVE_STATUSES.has(c.status)).length,
    coursesWithReports: settlements.filter((s) => s.reportDays > 0).length,
  }
}

/** Kursy, gdzie koszty z raportów znacząco obniżają marżę względem planu */
export function courseCostOverruns(
  summaries: CourseSettlementSummary[],
  minLossPln = 300,
): CourseSettlementSummary[] {
  return summaries.filter(
    (s) => s.variancePln != null && s.variancePln <= -minLossPln && s.reportDays > 0,
  )
}
