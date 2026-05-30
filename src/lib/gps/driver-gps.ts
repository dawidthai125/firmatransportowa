import type { FleetPosition } from '@/lib/domain/fleet-position'
import { loadFleetPositions, saveFleetPositions } from '@/lib/domain/fleet-positions-store'

export interface DriverGpsPayload {
  driverName: string
  vehicleId?: string
  registration?: string
  courseRef?: string
  lat: number
  lng: number
  speedKmh?: number
}

/** Zapis pozycji z telefonu kierowcy — widoczna na mapie w biurze */
export function upsertDriverLivePosition(
  tenantId: string,
  payload: DriverGpsPayload,
): FleetPosition[] {
  const positions = loadFleetPositions(tenantId)
  const speed = payload.speedKmh ?? 0
  const status = speed > 8 ? 'in_transit' : speed > 0 ? 'loading' : 'parked'

  const entry: FleetPosition = {
    vehicleId: payload.vehicleId ?? `live-${payload.driverName.replace(/\s+/g, '-').toLowerCase()}`,
    registration: payload.registration ?? '—',
    driverName: payload.driverName,
    courseRef: payload.courseRef,
    lat: payload.lat,
    lng: payload.lng,
    speedKmh: Math.round(speed),
    updatedAt: new Date().toISOString(),
    status,
    source: 'driver-pwa',
  }

  const idx = positions.findIndex(
    (p) => p.driverName?.toLowerCase() === payload.driverName.toLowerCase(),
  )
  const next = [...positions]
  if (idx >= 0) next[idx] = entry
  else next.unshift(entry)

  saveFleetPositions(tenantId, next)
  return next
}

export function hasLiveDriverPositions(tenantId: string): boolean {
  return loadFleetPositions(tenantId).some((p) => p.source === 'driver-pwa')
}

const GPS_PREF = 'ft-driver-gps-enabled'

export function isDriverGpsSharingEnabled(tenantId: string, driverName: string): boolean {
  try {
    return localStorage.getItem(`${GPS_PREF}:${tenantId}:${driverName}`) === '1'
  } catch {
    return false
  }
}

export function setDriverGpsSharingEnabled(
  tenantId: string,
  driverName: string,
  enabled: boolean,
): void {
  try {
    localStorage.setItem(`${GPS_PREF}:${tenantId}:${driverName}`, enabled ? '1' : '0')
  } catch {
    /* ignore */
  }
}
