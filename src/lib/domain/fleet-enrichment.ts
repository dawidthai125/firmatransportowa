import { driverDisplayName } from '@/lib/domain/driver'
import type { Driver } from '@/lib/domain/driver'
import type { Course } from '@/lib/domain/course'
import type { FleetPosition, FleetVehicleStatus } from '@/lib/domain/fleet-position'
import { loadCourses, seedDemoCourses } from '@/lib/domain/courses-store'
import { loadDrivers, seedDemoDrivers } from '@/lib/domain/drivers-store'
import { loadFleetPositions, seedDemoFleetPositions } from '@/lib/domain/fleet-positions-store'
import type { Vehicle } from '@/lib/domain/vehicle'
import { loadVehicles, seedDemoVehicles } from '@/lib/domain/vehicles-store'

export const GPS_STALE_MAX_AGE_HOURS = 3

const ACTIVE_COURSE_STATUSES = new Set<Course['status']>(['planned', 'loading', 'in_transit'])

export type FleetGpsFreshness = 'live' | 'stale' | 'none'

export interface FleetVehicleSnapshot {
  vehicle: Vehicle
  position?: FleetPosition
  driverName?: string
  courseRef?: string
  speedKmh?: number
  lastSignalAt?: string
  gpsFreshness: FleetGpsFreshness
  displayStatus: FleetVehicleStatus
}

export function isGpsStale(updatedAt: string, maxAgeHours = GPS_STALE_MAX_AGE_HOURS): boolean {
  const cutoff = Date.now() - maxAgeHours * 3600_000
  return new Date(updatedAt).getTime() < cutoff
}

export function staleGpsPositions(
  positions: FleetPosition[],
  maxAgeHours = GPS_STALE_MAX_AGE_HOURS,
): FleetPosition[] {
  return positions.filter((p) => isGpsStale(p.updatedAt, maxAgeHours))
}

/** Najświeższa pozycja per vehicleId */
export function latestPositionByVehicle(positions: FleetPosition[]): Map<string, FleetPosition> {
  const map = new Map<string, FleetPosition>()
  for (const p of positions) {
    const prev = map.get(p.vehicleId)
    if (!prev || new Date(p.updatedAt).getTime() > new Date(prev.updatedAt).getTime()) {
      map.set(p.vehicleId, p)
    }
  }
  return map
}

export function activeCourseForVehicle(vehicleId: string, courses: Course[]): Course | undefined {
  const mine = courses.filter(
    (c) => ACTIVE_COURSE_STATUSES.has(c.status) && c.vehicleId === vehicleId,
  )
  const rank: Course['status'][] = ['in_transit', 'loading', 'planned']
  for (const status of rank) {
    const hit = mine.find((c) => c.status === status)
    if (hit) return hit
  }
  return undefined
}

function driverNameForCourse(course: Course | undefined, drivers: Driver[]): string | undefined {
  if (!course?.driverId) return undefined
  const driver = drivers.find((d) => d.id === course.driverId)
  return driver ? driverDisplayName(driver) : undefined
}

export function buildFleetVehicleSnapshots(
  tenantId: string,
  options?: { vehicles?: Vehicle[]; positions?: FleetPosition[]; courses?: Course[]; drivers?: Driver[] },
): FleetVehicleSnapshot[] {
  seedDemoVehicles(tenantId)
  seedDemoCourses(tenantId)
  seedDemoDrivers(tenantId)
  seedDemoFleetPositions(tenantId)

  const vehicles = options?.vehicles ?? loadVehicles(tenantId)
  const positions = options?.positions ?? loadFleetPositions(tenantId)
  const courses = options?.courses ?? loadCourses(tenantId)
  const drivers = options?.drivers ?? loadDrivers(tenantId)
  const byVehicle = latestPositionByVehicle(positions)

  return vehicles.map((vehicle) => {
    const position = byVehicle.get(vehicle.id)
    const course = activeCourseForVehicle(vehicle.id, courses)
    const courseDriver = driverNameForCourse(course, drivers)

    const driverName = position?.driverName ?? courseDriver
    const courseRef = position?.courseRef ?? course?.reference

    let gpsFreshness: FleetGpsFreshness = 'none'
    if (position) {
      gpsFreshness = isGpsStale(position.updatedAt) ? 'stale' : 'live'
    }

    let displayStatus: FleetVehicleStatus = position?.status ?? 'offline'
    if (gpsFreshness === 'stale') displayStatus = 'offline'

    return {
      vehicle,
      position,
      driverName,
      courseRef,
      speedKmh: position?.speedKmh,
      lastSignalAt: position?.updatedAt,
      gpsFreshness,
      displayStatus,
    }
  })
}

/** Aktywne pojazdy bez świeżego GPS — do alertów pulpitu i banera Floty */
export function staleGpsSnapshotsForAlerts(
  tenantId: string,
  maxAgeHours = GPS_STALE_MAX_AGE_HOURS,
): FleetVehicleSnapshot[] {
  const snapshots = buildFleetVehicleSnapshots(tenantId)
  const courses = loadCourses(tenantId)

  return snapshots.filter((s) => {
    if (!s.vehicle.active) return false
    if (s.position && isGpsStale(s.position.updatedAt, maxAgeHours)) return true
    const onActiveCourse = !!activeCourseForVehicle(s.vehicle.id, courses)
    if (onActiveCourse && s.gpsFreshness === 'none') return true
    return false
  })
}

export function formatLastSignal(iso?: string): string {
  if (!iso) return 'Brak sygnału'
  const d = new Date(iso)
  const ageMin = Math.round((Date.now() - d.getTime()) / 60_000)
  if (ageMin < 1) return 'Przed chwilą'
  if (ageMin < 60) return `${ageMin} min temu`
  const ageH = Math.floor(ageMin / 60)
  if (ageH < 24) return `${ageH} h temu`
  return d.toLocaleString('pl-PL')
}
