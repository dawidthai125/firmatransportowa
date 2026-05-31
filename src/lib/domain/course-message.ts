export interface CourseMessage {
  id: string
  courseId: string
  authorName: string
  authorRole: 'owner' | 'dispatcher' | 'driver'
  text: string
  createdAt: string
  updatedAt: string
}

export function createCourseMessage(
  courseId: string,
  authorName: string,
  authorRole: CourseMessage['authorRole'],
  text: string,
): CourseMessage {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    courseId,
    authorName,
    authorRole,
    text: text.trim(),
    createdAt: now,
    updatedAt: now,
  }
}
