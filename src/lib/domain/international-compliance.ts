import type { Course } from '@/lib/domain/course'
import { courseRouteLabel } from '@/lib/domain/course'

export type InternationalIssueType = 'missing_cmr' | 'missing_rmpd' | 'missing_license_extract'

export interface InternationalCourseAlert {
  id: string
  tenantId: string
  courseId: string
  courseRef: string
  route: string
  issue: InternationalIssueType
  severity: 'warning' | 'critical'
  label: string
  daysUntilLoad: number
}

const ACTIVE_STATUSES = new Set<Course['status']>(['planned', 'loading', 'in_transit'])

export function courseNeedsInternationalCheck(course: Course): boolean {
  return course.scope !== 'domestic' && ACTIVE_STATUSES.has(course.status)
}

export function buildInternationalCourseAlerts(
  tenantId: string,
  courses: Course[],
): InternationalCourseAlert[] {
  const alerts: InternationalCourseAlert[] = []
  const now = new Date()
  now.setHours(0, 0, 0, 0)

  for (const course of courses) {
    if (!courseNeedsInternationalCheck(course)) continue

    const loadAt = new Date(course.loadAt)
    loadAt.setHours(0, 0, 0, 0)
    const daysUntilLoad = Math.ceil((loadAt.getTime() - now.getTime()) / 86400000)
    const route = courseRouteLabel(course)
    const base = { tenantId, courseId: course.id, courseRef: course.reference, route, daysUntilLoad }

    if (!course.cmrNumber?.trim()) {
      alerts.push({
        ...base,
        id: `intl-${course.id}-cmr`,
        issue: 'missing_cmr',
        severity: daysUntilLoad <= 1 ? 'critical' : 'warning',
        label: 'Brak numeru CMR',
      })
    }

    if (course.scope !== 'domestic' && !course.licenseExtractNo?.trim()) {
      alerts.push({
        ...base,
        id: `intl-${course.id}-wypis`,
        issue: 'missing_license_extract',
        severity: 'warning',
        label: 'Brak wypisu z licencji wspólnotowej',
      })
    }

    if (course.scope === 'international_third' && !course.rmpdRegistered) {
      alerts.push({
        ...base,
        id: `intl-${course.id}-rmpd`,
        issue: 'missing_rmpd',
        severity: daysUntilLoad <= 2 ? 'critical' : 'warning',
        label: 'Brak rejestracji RMPD / SENT (PUESC)',
      })
    }
  }

  return alerts.sort((a, b) => {
    const sev = (s: InternationalCourseAlert['severity']) => (s === 'critical' ? 0 : 1)
    if (sev(a.severity) !== sev(b.severity)) return sev(a.severity) - sev(b.severity)
    return a.daysUntilLoad - b.daysUntilLoad
  })
}

export const INTERNATIONAL_ISSUE_HINTS: Record<InternationalIssueType, string> = {
  missing_cmr: 'Uzupełnij numer listu przewozowego CMR przed wyjazdem za granicę.',
  missing_rmpd: 'Zarejestruj przewóz w systemie PUESC (formularz RMPD100) przed wjazdem do kraju trzeciego.',
  missing_license_extract: 'Kierowca musi mieć w kabinie wypis z licencji wspólnotowej na ten transport.',
}

/** Link do portalu PUESC — rejestracja RMPD */
export const PUESC_RMPD_URL = 'https://puesc.gov.pl/'
