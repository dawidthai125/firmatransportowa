import type { Vehicle } from '@/lib/domain/vehicle'
import { tombstoneDeleteInTenantData } from '@/lib/sync/tombstone'
import { readTenantData, writeTenantData } from '@/lib/tenant/storage'

export function loadVehicles(tenantId: string): Vehicle[] {
  return readTenantData<Vehicle[]>(tenantId, 'vehicles', [])
}

export function saveVehicles(tenantId: string, vehicles: Vehicle[]): void {
  writeTenantData(tenantId, 'vehicles', vehicles)
}

export function upsertVehicle(tenantId: string, vehicle: Vehicle): Vehicle[] {
  const vehicles = loadVehicles(tenantId)
  const idx = vehicles.findIndex((v) => v.id === vehicle.id)
  const next = [...vehicles]
  if (idx >= 0) next[idx] = vehicle
  else next.unshift(vehicle)
  saveVehicles(tenantId, next)
  return next
}

export function deleteVehicle(tenantId: string, vehicleId: string): Vehicle[] {
  tombstoneDeleteInTenantData(tenantId, 'vehicles', vehicleId)
  return loadVehicles(tenantId)
}

export function seedDemoVehicles(tenantId: string): Vehicle[] {
  const existing = loadVehicles(tenantId)
  if (existing.length > 0) return existing

  const now = new Date().toISOString()
  const demo: Vehicle[] = [
    {
      id: 'vehicle-demo-001',
      tenantId,
      registration: 'DW 12345',
      type: 'truck',
      brand: 'Volvo',
      model: 'FH',
      year: 2021,
      adrEnabled: false,
      active: true,
      odometerKm: 412000,
      documents: [
        { label: 'Przegląd techniczny', expiresAt: '2026-06-15' },
        { label: 'Ubezpieczenie OC', expiresAt: '2026-09-01' },
        { label: 'Legalizacja tachografu', expiresAt: '2026-11-20' },
      ],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'vehicle-demo-002',
      tenantId,
      registration: 'DW 9ADR1',
      type: 'set',
      brand: 'Scania',
      model: 'R450',
      year: 2019,
      adrEnabled: true,
      active: true,
      odometerKm: 589000,
      documents: [
        { label: 'Przegląd techniczny', expiresAt: '2026-04-01' },
        { label: 'Ubezpieczenie OC', expiresAt: '2026-08-15' },
        { label: 'Zezwolenie ADR (pojazd)', expiresAt: '2026-05-15' },
        { label: 'Legalizacja tachografu', expiresAt: '2025-12-01' },
      ],
      createdAt: now,
      updatedAt: now,
    },
  ]

  saveVehicles(tenantId, demo)
  return demo
}
