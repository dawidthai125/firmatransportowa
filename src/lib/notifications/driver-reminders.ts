import { loadCourses, seedDemoCourses } from '@/lib/domain/courses-store'
import { getTodayReportForDriver } from '@/lib/domain/daily-reports-store'
import { findDriverByDisplayName } from '@/lib/domain/driver-profile'
import {
  driverUnreadCount,
  loadDriverNotifications,
  pushDriverNotification,
} from '@/lib/notifications/driver-inbox'
import { messagesForCourse } from '@/lib/domain/course-messages-store'
import { showAppNotification } from '@/lib/notifications/app-notify'

const SEEN_COURSES_KEY = 'ft-driver-seen-courses'
const SEEN_CHAT_KEY = 'ft-driver-seen-chat'

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

function seenChatKey(tenantId: string, driverName: string): string {
  return `${SEEN_CHAT_KEY}:${tenantId}:${driverName.toLowerCase()}`
}

function loadSeenChatAt(tenantId: string, driverName: string): string {
  return localStorage.getItem(seenChatKey(tenantId, driverName)) ?? ''
}

function saveSeenChatAt(tenantId: string, driverName: string, iso: string): void {
  localStorage.setItem(seenChatKey(tenantId, driverName), iso)
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
    void showAppNotification(n.title, n.message, { tag: 'driver-course' })
    seen.add(course.id)
  }
  saveSeenCourseIds(tenantId, driverName, [...seen])

  let latestDispatcherMsg = ''
  for (const course of active) {
    const msgs = messagesForCourse(tenantId, course.id).filter((m) => m.authorRole !== 'driver')
    const last = msgs[msgs.length - 1]
    if (last && last.createdAt > latestDispatcherMsg) latestDispatcherMsg = last.createdAt
  }
  const seenChat = loadSeenChatAt(tenantId, driverName)
  if (latestDispatcherMsg && latestDispatcherMsg > seenChat) {
    const n = pushDriverNotification(tenantId, driverName, {
      title: 'Wiadomość od dyspozytora',
      message: 'Nowa wiadomość przy aktywnym kursie — sprawdź czat.',
      level: 'info',
      actionView: 'courses',
    })
    void showAppNotification(n.title, n.message, { tag: 'driver-chat' })
    saveSeenChatAt(tenantId, driverName, latestDispatcherMsg)
  }

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
    void showAppNotification(n.title, n.message, { tag: 'driver-course' })
  }
}

export { driverUnreadCount }
