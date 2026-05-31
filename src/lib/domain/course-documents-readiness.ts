import type { Course } from '@/lib/domain/course'

export type CourseDocGap = 'missing_pod' | 'missing_cmr' | 'missing_any' | 'complete'

export function courseHasPodAttachment(course: Course): boolean {
  return (course.attachments ?? []).some((a) => a.kind === 'pod')
}

export function courseHasCmrAttachment(course: Course): boolean {
  return Boolean(course.cmrNumber?.trim()) || (course.attachments ?? []).some((a) => a.kind === 'cmr')
}

export function courseDocumentGap(course: Course): CourseDocGap {
  if (!['delivered', 'completed'].includes(course.status)) return 'complete'
  const hasPod = courseHasPodAttachment(course)
  const hasCmr = courseHasCmrAttachment(course)
  if (hasPod && (course.scope === 'domestic' || hasCmr)) return 'complete'
  if (!hasPod && !hasCmr) return 'missing_any'
  if (!hasPod) return 'missing_pod'
  if (course.scope !== 'domestic' && !hasCmr) return 'missing_cmr'
  return 'complete'
}

/** Kurs można fakturować — dostarczony, fracht PLN, komplet dokumentów */
export function courseReadyForInvoicing(course: Course): boolean {
  if (!['delivered', 'completed'].includes(course.status)) return false
  if (course.freightPln <= 0) return false
  if (course.invoiceIssuedAt) return false
  return courseDocumentGap(course) === 'complete'
}

export function coursesMissingDocumentsAfterDelivery(courses: Course[]): Course[] {
  return courses.filter(
    (c) => ['delivered', 'completed'].includes(c.status) && courseDocumentGap(c) !== 'complete',
  )
}

export function coursesReadyForInvoicing(courses: Course[]): Course[] {
  return courses.filter(courseReadyForInvoicing)
}

export function coursesAwaitingPayment(courses: Course[]): Course[] {
  const today = new Date().toISOString().slice(0, 10)
  return courses.filter(
    (c) =>
      c.invoiceIssuedAt &&
      c.paymentDueAt &&
      c.paymentDueAt >= today &&
      !c.paymentReceivedAt,
  )
}

export function coursesOverduePayment(courses: Course[]): Course[] {
  const today = new Date().toISOString().slice(0, 10)
  return courses.filter(
    (c) => c.invoiceIssuedAt && c.paymentDueAt && c.paymentDueAt < today && !c.paymentReceivedAt,
  )
}
