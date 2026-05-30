import { loadCourses, seedDemoCourses } from '@/lib/domain/courses-store'
import { getTodayReportForDriver } from '@/lib/domain/daily-reports-store'
import { findDriverByDisplayName } from '@/lib/domain/driver-profile'
import {
  driverUnreadCount,
  loadDriverNotifications,
  pushDriverNotification,
} from '@/lib/notifications/driver-inbox'
import { showWebNotification } from '@/lib/notifications/web-notify'

const SEEN_COURSES_KEY = 'ft-driver-seen-courses'

function seenCoursesKey(tenantId: string, driverName: string): string {
  return `${SEEN_COURSES_KEY}:${tenantId}:${driverName.toLowerCase()}`
}

function loadSeenCourseIds(tenantId: string, driverName: string): string[] {
  try {
    const raw = localStorage.getItem(seenCoursesKey(tenantId, driverName))
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

function saveSeenCourseIds(tenantId: string, driverName: string, ids: string[]): void {
  localStorage.setItem(seenCoursesKey(tenantId, driverName), JSON.stringify(ids))
}

/** Sprawdza nowe kursy i brak raportu — wywołaj na Start kierowcy */
export function syncDriverReminders(tenantId: string, driverName: string): void {
  seedDemoCourses(tenantId)
  const driver = findDriverByDisplayName(tenantId, driverName)
  if (!driver) return

  const courses = loadCourses(tenantId).filter((c) => c.driverId === driver.id)
  const seen = new Set(loadSeenCourseIds(tenantId, driverName))
  const active = courses.filter((c) => ['planned', 'loading', 'in_transit'].includes(c.status))

  for (const course of active) {
    if (seen.has(course.id)) continue
    const n = pushDriverNotification(tenantId, driverName, {
      title: 'Nowy kurs przypisany',
      message: `${course.reference}: ${course.loadCity} → ${course.unloadCity}`,
      level: 'info',
      actionView: 'courses',
    })
    void showWebNotification(n.title, n.message)
    seen.add(course.id)
  }
  saveSeenCourseIds(tenantId, driverName, [...seen])

  const hour = new Date().getHours()
  const hasReport = Boolean(getTodayReportForDriver(tenantId, driverName))
  const alreadyReminded = loadDriverNotifications(tenantId, driverName).some(
    (n) => n.title === 'Przypomnienie: raport dzienny' && n.createdAt.slice(0, 10) === new Date().toISOString().slice(0, 10),
  )

  if (hour >= 16 && !hasReport && !alreadyReminded) {
    const n = pushDriverNotification(tenantId, driverName, {
      title: 'Przypomnienie: raport dzienny',
      message: 'Uzupełnij km, paliwo i myto — bez dzwonienia do biura.',
      level: 'warning',
      actionView: 'report',
    })
    void showWebNotification(n.title, n.message)
  }
}

export { driverUnreadCount }
