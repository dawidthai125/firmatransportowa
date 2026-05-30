import type { AdminView } from '@/lib/navigation'
import { buildComplianceAlerts, buildCompanyComplianceAlerts } from '@/lib/domain/compliance'
import { loadCourses, seedDemoCourses } from '@/lib/domain/courses-store'
import { getTodayReportForDriver } from '@/lib/domain/daily-reports-store'
import { driverDisplayName, type Driver } from '@/lib/domain/driver'
import { loadDrivers, seedDemoDrivers } from '@/lib/domain/drivers-store'
import { buildDrivingTimeAlerts } from '@/lib/domain/driving-time'
import { loadDailyReports, seedDemoDailyReports } from '@/lib/domain/daily-reports-store'
import type { FleetPosition } from '@/lib/domain/fleet-position'
import { loadFleetPositions } from '@/lib/domain/fleet-positions-store'
import { activeItdAlerts } from '@/lib/domain/itd-store'
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

function staleGpsPositions(positions: FleetPosition[], maxAgeHours = 3): FleetPosition[] {
  const cutoff = Date.now() - maxAgeHours * 3600_000
  return positions.filter((p) => new Date(p.updatedAt).getTime() < cutoff)
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
  const positions = loadFleetPositions(tenantId)
  const itdActive = activeItdAlerts(tenantId)

  const out: OperationException[] = []

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

  if (gpsEnabled && positions.length > 0) {
    const stale = staleGpsPositions(positions)
    if (stale.length > 0) {
      out.push({
        id: 'gps-stale',
        severity: 'info',
        title: `${stale.length} pojazdów bez świeżego GPS`,
        description: stale.map((p) => p.registration).join(', '),
        actionView: 'dashboard',
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
