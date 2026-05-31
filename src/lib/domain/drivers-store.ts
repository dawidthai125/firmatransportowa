import type { Driver } from '@/lib/domain/driver'
import { tombstoneDeleteInTenantData } from '@/lib/sync/tombstone'
import {
  type GuardedSaveOptions,
  writeGuardedTenantArrayRecord,
} from '@/lib/sync/guarded-save'
import { readTenantData, writeTenantData } from '@/lib/tenant/storage'

export function loadDrivers(tenantId: string): Driver[] {
  return readTenantData<Driver[]>(tenantId, 'drivers', [])
}

export function saveDrivers(tenantId: string, drivers: Driver[]): void {
  writeTenantData(tenantId, 'drivers', drivers)
}

export function upsertDriver(tenantId: string, driver: Driver): Driver[] {
  const drivers = loadDrivers(tenantId)
  const idx = drivers.findIndex((d) => d.id === driver.id)
  const next = [...drivers]
  if (idx >= 0) next[idx] = driver
  else next.unshift(driver)
  saveDrivers(tenantId, next)
  return next
}

export async function upsertDriverGuarded(
  tenantId: string,
  driver: Driver,
  options?: GuardedSaveOptions,
): Promise<Driver[]> {
  return writeGuardedTenantArrayRecord(
    tenantId,
    'drivers',
    driver,
    loadDrivers,
    saveDrivers,
    options,
  )
}

export function deleteDriver(tenantId: string, driverId: string): Driver[] {
  tombstoneDeleteInTenantData(tenantId, 'drivers', driverId)
  return loadDrivers(tenantId)
}

export function seedDemoDrivers(tenantId: string): Driver[] {
  const existing = loadDrivers(tenantId)
  if (existing.length > 0) return existing

  const now = new Date().toISOString()
  const demo: Driver[] = [
    {
      id: 'driver-demo-001',
      tenantId,
      firstName: 'Jan',
      lastName: 'Kowalski',
      phone: '+48 600 100 200',
      licenseCategory: 'C+E',
      adrCertified: false,
      vehicleId: 'vehicle-demo-001',
      active: true,
      documents: [
        { label: 'Prawo jazdy', expiresAt: '2027-06-15' },
        { label: 'Kod 95', expiresAt: '2026-06-20' },
        { label: 'Badania lekarskie', expiresAt: '2026-12-01' },
      ],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'driver-demo-002',
      tenantId,
      firstName: 'Piotr',
      lastName: 'Nowak',
      phone: '+48 600 300 400',
      licenseCategory: 'C+E',
      adrCertified: true,
      vehicleId: 'vehicle-demo-002',
      active: true,
      documents: [
        { label: 'Prawo jazdy', expiresAt: '2028-01-10' },
        { label: 'Kod 95', expiresAt: '2026-04-15' },
        { label: 'Certyfikat ADR', expiresAt: '2026-03-01' },
        { label: 'Badania lekarskie', expiresAt: '2027-03-01' },
      ],
      createdAt: now,
      updatedAt: now,
    },
  ]

  saveDrivers(tenantId, demo)
  return demo
}
