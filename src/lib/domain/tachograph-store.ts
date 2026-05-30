import { parseDddFilename } from '@/lib/domain/tachograph-parse'
import type { TachographDownload } from '@/lib/domain/tachograph-types'
import { driverDisplayName, type Driver } from '@/lib/domain/driver'
import { loadDrivers, seedDemoDrivers } from '@/lib/domain/drivers-store'
import { readTenantData, writeTenantData } from '@/lib/tenant/storage'

export function loadTachographDownloads(tenantId: string): TachographDownload[] {
  return readTenantData<TachographDownload[]>(tenantId, 'tachograph', [])
}

export function saveTachographDownloads(tenantId: string, rows: TachographDownload[]): void {
  writeTenantData(tenantId, 'tachograph', rows)
}

function matchDriverByHint(drivers: Driver[], hint?: string): Driver | undefined {
  if (!hint) return undefined
  const norm = hint.toLowerCase()
  return drivers.find((d) => {
    const full = driverDisplayName(d).toLowerCase()
    const last = d.lastName.toLowerCase()
    return full.includes(norm) || last.includes(norm) || norm.includes(last)
  })
}

export function importTachographFile(
  tenantId: string,
  file: { filename: string; sizeBytes: number; fileId?: string },
): TachographDownload {
  seedDemoDrivers(tenantId)
  const parsed = parseDddFilename(file.filename)
  const drivers = loadDrivers(tenantId)
  const matched = matchDriverByHint(drivers, parsed.driverHint)

  const row: TachographDownload = {
    id: crypto.randomUUID(),
    tenantId,
    filename: file.filename,
    source: parsed.source,
    driverId: matched?.id,
    driverName: matched ? driverDisplayName(matched) : parsed.driverHint,
    vehicleRegistration: parsed.vehicleHint,
    periodFrom: parsed.periodFrom,
    periodTo: parsed.periodTo,
    sizeBytes: file.sizeBytes,
    importedAt: new Date().toISOString(),
    fileId: file.fileId,
  }

  const next = [row, ...loadTachographDownloads(tenantId)]
  saveTachographDownloads(tenantId, next)
  return row
}

export function updateTachographDownload(
  tenantId: string,
  id: string,
  patch: Partial<TachographDownload>,
): TachographDownload[] {
  const next = loadTachographDownloads(tenantId).map((r) =>
    r.id === id ? { ...r, ...patch } : r,
  )
  saveTachographDownloads(tenantId, next)
  return next
}

export function deleteTachographDownload(tenantId: string, id: string): TachographDownload[] {
  const next = loadTachographDownloads(tenantId).filter((r) => r.id !== id)
  saveTachographDownloads(tenantId, next)
  return next
}

export function seedDemoTachographDownloads(tenantId: string): TachographDownload[] {
  const existing = loadTachographDownloads(tenantId)
  if (existing.length > 0) return existing

  seedDemoDrivers(tenantId)
  const drivers = loadDrivers(tenantId)
  const jan = drivers.find((d) => d.firstName === 'Jan')
  const now = new Date().toISOString()
  const weekAgo = new Date(Date.now() - 86400000 * 7).toISOString().slice(0, 10)
  const today = new Date().toISOString().slice(0, 10)

  const demo: TachographDownload[] = [
    {
      id: 'tacho-demo-001',
      tenantId,
      filename: `C_KOWALSKI_${weekAgo.replace(/-/g, '')}_${today.replace(/-/g, '')}.ddd`,
      source: 'driver_card',
      driverId: jan?.id,
      driverName: jan ? driverDisplayName(jan) : 'Jan Kowalski',
      periodFrom: weekAgo,
      periodTo: today,
      sizeBytes: 245760,
      importedAt: now,
      notes: 'Demo — tygodniowy odczyt karty',
    },
    {
      id: 'tacho-demo-002',
      tenantId,
      filename: `M_DW9ADR1_${weekAgo.replace(/-/g, '')}_${today.replace(/-/g, '')}.ddd`,
      source: 'vehicle_unit',
      vehicleRegistration: 'DW 9ADR1',
      periodFrom: weekAgo,
      periodTo: today,
      sizeBytes: 512000,
      importedAt: now,
      notes: 'Demo — odczyt VU ciągnika ADR',
    },
  ]

  saveTachographDownloads(tenantId, demo)
  return demo
}
