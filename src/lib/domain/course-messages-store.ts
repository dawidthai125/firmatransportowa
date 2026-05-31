import type { CourseMessage } from '@/lib/domain/course-message'
import { readTenantData, writeTenantData } from '@/lib/tenant/storage'

export function loadCourseMessages(tenantId: string): CourseMessage[] {
  return readTenantData<CourseMessage[]>(tenantId, 'course-messages', [])
}

export function saveCourseMessages(tenantId: string, messages: CourseMessage[]): void {
  writeTenantData(tenantId, 'course-messages', messages)
}

export function messagesForCourse(tenantId: string, courseId: string): CourseMessage[] {
  return loadCourseMessages(tenantId)
    .filter((m) => m.courseId === courseId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export function appendCourseMessage(tenantId: string, message: CourseMessage): CourseMessage[] {
  const next = [...loadCourseMessages(tenantId), message]
  saveCourseMessages(tenantId, next)
  return next
}

export function unreadDriverMessagesCount(
  tenantId: string,
  courseIds: string[],
  sinceIso?: string,
): number {
  const since = sinceIso ? Date.parse(sinceIso) : 0
  return loadCourseMessages(tenantId).filter(
    (m) =>
      courseIds.includes(m.courseId) &&
      m.authorRole === 'driver' &&
      Date.parse(m.createdAt) > since,
  ).length
}
