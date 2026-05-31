import type { AdminView } from '@/lib/navigation'
import { buildComplianceAlerts, buildCompanyComplianceAlerts } from '@/lib/domain/compliance'
import { loadCourses, seedDemoCourses } from '@/lib/domain/courses-store'
import { getTodayReportForDriver } from '@/lib/domain/daily-reports-store'
import { driverDisplayName, type Driver } from '@/lib/domain/driver'
import { loadDrivers, seedDemoDrivers } from '@/lib/domain/drivers-store'
import { buildDrivingTimeAlerts } from '@/lib/domain/driving-time'
import { loadDailyReports, seedDemoDailyReports } from '@/lib/domain/daily-reports-store'
import { staleGpsSnapshotsForAlerts } from '@/lib/domain/fleet-enrichment'
import { activeItdAlerts } from '@/lib/domain/itd-store'
import { buildInternationalCourseAlerts } from '@/lib/domain/international-compliance'
import {
  coursesMissingDocumentsAfterDelivery,
  coursesReadyForInvoicing,
} from '@/lib/domain/course-documents-readiness'
import { loadRepairReports, seedDemoRepairReports } from '@/lib/domain/repair-reports-store'
import { seedDemoCompanyDocuments, loadTenantSettingsData } from '@/lib/domain/tenant-settings'
import { loadVehicles, seedDemoVehicles } from '@/lib/domain/vehicles-store'

export type ExceptionSeverity = 'critical' | 'warning' | 'info'

export interface OperationException {
  id: string
  severity: ExceptionSeverity
  title: string
  description: string
  actionView: AdminView
}

function driversOnActiveCourses(tenantId: string): string[] {
  seedDemoCourses(tenantId)
  seedDemoDrivers(tenantId)
  const drivers = loadDrivers(tenantId)
  const nameById = new Map(drivers.map((d) => [d.id, driverDisplayName(d)]))
  const courses = loadCourses(tenantId).filter((c) =>
    ['planned', 'loading', 'in_transit'].includes(c.status),
  )
  const names = new Set<string>()
  for (const c of courses) {
    if (c.driverId) {
      const name = nameById.get(c.driverId)
      if (name) names.add(name)
    }
  }
  return [...names]
}

/** Wyjątki operacyjne na dziś — właściciel reaguje tylko na to */
export function buildOperationsExceptions(
  tenantId: string,
  tenantName: string,
  gpsEnabled: boolean,
): OperationException[] {
  seedDemoDrivers(tenantId)
  seedDemoVehicles(tenantId)
  seedDemoDailyReports(tenantId)
  seedDemoRepairReports(tenantId)
  seedDemoCompanyDocuments(tenantId)

  const drivers = loadDrivers(tenantId)
  const vehicles = loadVehicles(tenantId)
  const reports = loadDailyReports(tenantId)
  const companyDocs = loadTenantSettingsData(tenantId).companyDocuments
  const repairs = loadRepairReports(tenantId)
  const itdActive = activeItdAlerts(tenantId)

  const out: OperationException[] = []

  seedDemoCourses(tenantId)
  const intlAlerts = buildInternationalCourseAlerts(tenantId, loadCourses(tenantId))
  const rmpdMissing = intlAlerts.filter((a) => a.issue === 'missing_rmpd')
  const cmrMissing = intlAlerts.filter((a) => a.issue === 'missing_cmr')

  if (rmpdMissing.length > 0) {
    out.push({
      id: 'rmpd-missing',
      severity: rmpdMissing.some((a) => a.severity === 'critical') ? 'critical' : 'warning',
      title: `${rmpdMissing.length} kursów bez RMPD / SENT`,
      description: rmpdMissing.map((a) => a.courseRef).join(', '),
      actionView: 'courses',
    })
  }

  if (cmrMissing.length > 0) {
    out.push({
      id: 'cmr-missing',
      severity: cmrMissing.some((a) => a.severity === 'critical') ? 'critical' : 'warning',
      title: `${cmrMissing.length} kursów bez numeru CMR`,
      description: cmrMissing.map((a) => a.courseRef).join(', '),
      actionView: 'courses',
    })
  }

  const missingDocs = coursesMissingDocumentsAfterDelivery(loadCourses(tenantId))
  if (missingDocs.length > 0) {
    out.push({
      id: 'pod-missing-invoice-block',
      severity: 'warning',
      title: `${missingDocs.length} dostarczonych kursów bez POD/CMR`,
      description: `${missingDocs.map((c) => c.reference).join(', ')} — faktura i płatność czekają`,
      actionView: 'courses',
    })
  }

  const invoiceReady = coursesReadyForInvoicing(loadCourses(tenantId))
  if (invoiceReady.length > 0) {
    out.push({
      id: 'invoice-ready',
      severity: 'info',
      title: `${invoiceReady.length} kursów gotowych do faktury`,
      description: 'Dokumenty kompletne — wystaw fakturę bez szukania skanów',
      actionView: 'invoicing',
    })
  }

  const recentStatus = loadCourses(tenantId).filter((c) => {
    if (!c.statusUpdatedAt) return false
    return Date.now() - Date.parse(c.statusUpdatedAt) < 86400000
  })
  if (recentStatus.length > 0) {
    out.push({
      id: 'course-status-ping',
      severity: 'info',
      title: `${recentStatus.length} aktualizacji statusu z kabiny (24 h)`,
      description: recentStatus
        .map((c) => `${c.reference}${c.statusUpdatedBy ? ` — ${c.statusUpdatedBy}` : ''}`)
        .join(', '),
      actionView: 'courses',
    })
  }

  if (itdActive.length > 0) {
    out.push({
      id: 'itd-active',
      severity: 'critical',
      title: `${itdActive.length} alertów ITD od kierowców`,
      description: itdActive.map((a) => `${a.driverName} — ${a.locationLabel}`).join('; '),
      actionView: 'itd',
    })
  }

  const pendingRepairs = repairs.filter((r) => r.status === 'submitted')
  if (pendingRepairs.length > 0) {
    out.push({
      id: 'repairs-pending',
      severity: 'critical',
      title: `${pendingRepairs.length} awarii czeka na weryfikację`,
      description: pendingRepairs.map((r) => r.reference).join(', '),
      actionView: 'repairs',
    })
  }

  const activeDriverNames = driversOnActiveCourses(tenantId)
  const missingReports = activeDriverNames.filter(
    (name) => !getTodayReportForDriver(tenantId, name),
  )
  if (missingReports.length > 0) {
    out.push({
      id: 'reports-missing',
      severity: 'warning',
      title: `${missingReports.length} kierowców bez raportu dziś`,
      description: missingReports.join(', '),
      actionView: 'reports',
    })
  }

  const complianceCount =
    buildComplianceAlerts(tenantId, drivers, vehicles).length +
    buildCompanyComplianceAlerts(tenantId, tenantName, companyDocs).length
  if (complianceCount > 0) {
    out.push({
      id: 'compliance',
      severity: 'warning',
      title: `${complianceCount} alertów dokumentów`,
      description: 'Licencje, CKZ, pojazdy — sprawdź przed kontrolą ITD',
      actionView: 'compliance',
    })
  }

  const drivingAlerts = buildDrivingTimeAlerts(tenantId, reports)
  if (drivingAlerts.length > 0) {
    out.push({
      id: 'driving-time',
      severity: 'warning',
      title: `${drivingAlerts.length} alertów czasu jazdy`,
      description: 'Limity 561/2006 — rozliczenia i dyscyplina odpoczynku',
      actionView: 'settlements',
    })
  }

  if (gpsEnabled) {
    const staleSnapshots = staleGpsSnapshotsForAlerts(tenantId)
    if (staleSnapshots.length > 0) {
      const onCourse = staleSnapshots.filter((s) => s.courseRef)
      out.push({
        id: 'gps-stale',
        severity: onCourse.length > 0 ? 'warning' : 'info',
        title: `${staleSnapshots.length} pojazdów bez świeżego GPS (> 3 h)`,
        description: staleSnapshots.map((s) => s.vehicle.registration).join(', '),
        actionView: 'fleet',
      })
    }
  }

  const idleDrivers = drivers.filter(
    (d: Driver) => d.active && !activeDriverNames.includes(driverDisplayName(d)),
  )
  if (idleDrivers.length > 0 && idleDrivers.length <= 5) {
    out.push({
      id: 'drivers-idle',
      severity: 'info',
      title: `${idleDrivers.length} kierowców bez aktywnego kursu`,
      description: idleDrivers.map((d) => driverDisplayName(d)).join(', '),
      actionView: 'courses',
    })
  }

  return out
}

export function countCriticalExceptions(exceptions: OperationException[]): number {
  return exceptions.filter((e) => e.severity === 'critical' || e.severity === 'warning').length
}
