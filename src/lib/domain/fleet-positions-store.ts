import type { FleetPosition } from '@/lib/domain/fleet-position'
import { loadCourses, seedDemoCourses } from '@/lib/domain/courses-store'
import { loadVehicles, seedDemoVehicles } from '@/lib/domain/vehicles-store'
import { readTenantData, writeTenantData } from '@/lib/tenant/storage'
import type { TenantDataKey } from '@/lib/tenant/types'

const KEY: TenantDataKey = 'fleet-positions'

export function loadFleetPositions(tenantId: string): FleetPosition[] {
  return readTenantData<FleetPosition[]>(tenantId, KEY, [])
}

export function saveFleetPositions(tenantId: string, positions: FleetPosition[]): void {
  writeTenantData(tenantId, KEY, positions)
}

/** Merge pozycji z telematyki — deduplikacja po vehicleId / externalId */
export function upsertFleetTelematicsPositions(
  tenantId: string,
  incoming: FleetPosition[],
): { updated: number } {
  const existing = loadFleetPositions(tenantId)
  const byVehicle = new Map(existing.map((p) => [p.vehicleId, p]))
  let updated = 0

  for (const row of incoming) {
    const prev = byVehicle.get(row.vehicleId)
    if (prev) {
      const idx = existing.findIndex((p) => p.vehicleId === row.vehicleId)
      if (idx >= 0) {
        existing[idx] = { ...prev, ...row, vehicleId: prev.vehicleId }
        updated++
      }
      byVehicle.set(row.vehicleId, existing[idx] ?? row)
    } else {
      existing.unshift(row)
      byVehicle.set(row.vehicleId, row)
      updated++
    }
  }

  saveFleetPositions(tenantId, existing)
  return { updated }
}

/** Demo: pozycje w okolicy Wrocławia / A4 / A8 */
export function seedDemoFleetPositions(tenantId: string): FleetPosition[] {
  const existing = loadFleetPositions(tenantId)
  if (existing.length > 0) return existing

  seedDemoVehicles(tenantId)
  seedDemoCourses(tenantId)
  const vehicles = loadVehicles(tenantId).filter((v) => v.active)
  const courses = loadCourses(tenantId)
  const now = new Date().toISOString()

  const demo: FleetPosition[] = [
    {
      vehicleId: vehicles[0]?.id ?? 'vehicle-demo-001',
      registration: vehicles[0]?.registration ?? 'DW 12345',
      driverName: 'Jan Kowalski',
      courseRef: courses.find((c) => c.status === 'in_transit')?.reference ?? 'KRS-2026-014',
      lat: 51.1079,
      lng: 17.0385,
      speedKmh: 82,
      heading: 240,
      updatedAt: now,
      status: 'in_transit',
      source: 'demo',
    },
    {
      vehicleId: vehicles[1]?.id ?? 'vehicle-demo-002',
      registration: vehicles[1]?.registration ?? 'DW 9ADR1',
      driverName: 'Piotr Nowak',
      courseRef: courses.find((c) => c.status === 'loading')?.reference ?? 'KRS-2026-018',
      lat: 51.7592,
      lng: 19.456,
      speedKmh: 0,
      updatedAt: new Date(Date.now() - 4 * 3600_000).toISOString(),
      status: 'loading',
      source: 'demo',
    },
    {
      vehicleId: vehicles[0]?.id ?? 'vehicle-demo-001',
      registration: 'DW 12345',
      driverName: undefined,
      courseRef: undefined,
      lat: 51.046,
      lng: 16.738,
      speedKmh: 0,
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
      status: 'parked',
      source: 'demo',
    },
  ]

  saveFleetPositions(tenantId, demo.slice(0, 2))
  return demo.slice(0, 2)
}

/** Symulacja ruchu — lekki przesuw markerów co odświeżenie */
export function tickFleetSimulation(tenantId: string): FleetPosition[] {
  const positions = loadFleetPositions(tenantId)
  if (positions.length === 0) return seedDemoFleetPositions(tenantId)

  const next = positions.map((p) => {
    if (p.source === 'driver-pwa' || p.source === 'telematics') return p
    if (p.status !== 'in_transit') return p
    const jitter = () => (Math.random() - 0.5) * 0.02
    return {
      ...p,
      lat: p.lat + jitter(),
      lng: p.lng + jitter(),
      speedKmh: 70 + Math.round(Math.random() * 20),
      updatedAt: new Date().toISOString(),
    }
  })
  saveFleetPositions(tenantId, next)
  return next
}
