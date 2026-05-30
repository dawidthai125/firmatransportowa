import type { Driver } from '@/lib/domain/driver'
import { driverDisplayName } from '@/lib/domain/driver'
import { loadDrivers, seedDemoDrivers } from '@/lib/domain/drivers-store'
import { loadVehicles, seedDemoVehicles } from '@/lib/domain/vehicles-store'
import type { Vehicle } from '@/lib/domain/vehicle'

export function findDriverByDisplayName(tenantId: string, displayName: string): Driver | undefined {
  seedDemoDrivers(tenantId)
  const key = displayName.trim().toLowerCase()
  return loadDrivers(tenantId).find((d) => driverDisplayName(d).toLowerCase() === key)
}

export function resolveDriverVehicle(tenantId: string, driver: Driver): Vehicle | undefined {
  if (!driver.vehicleId) return undefined
  seedDemoVehicles(tenantId)
  return loadVehicles(tenantId).find((v) => v.id === driver.vehicleId)
}
