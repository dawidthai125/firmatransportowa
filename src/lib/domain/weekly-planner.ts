import type { Course } from '@/lib/domain/course'
import { COURSE_STATUS_LABELS } from '@/lib/domain/course'

export interface WeekDaySlot {
  date: string
  label: string
  courses: Course[]
}

function startOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function formatDayLabel(iso: string): string {
  const d = new Date(iso + 'T12:00:00')
  return d.toLocaleDateString('pl-PL', { weekday: 'short', day: 'numeric', month: 'short' })
}

export function buildWeeklyPlannerSlots(courses: Course[], anchor = new Date()): WeekDaySlot[] {
  const weekStart = startOfWeek(anchor)
  const slots: WeekDaySlot[] = []

  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    const date = d.toISOString().slice(0, 10)
    const dayCourses = courses.filter((c) => {
      const loadDay = c.loadAt.slice(0, 10)
      const unloadDay = c.unloadAt.slice(0, 10)
      return loadDay <= date && unloadDay >= date && c.status !== 'cancelled'
    })
    slots.push({ date, label: formatDayLabel(date), courses: dayCourses })
  }

  return slots
}

export function coursePlannerLabel(course: Course): string {
  return `${course.reference} · ${COURSE_STATUS_LABELS[course.status]}`
}

export function ensureTrackingToken(course: Course): string {
  return course.trackingToken ?? crypto.randomUUID().slice(0, 12)
}

export function findCourseByTrackingToken(
  courses: Course[],
  token: string,
): Course | undefined {
  return courses.find((c) => c.trackingPublic && c.trackingToken === token)
}
