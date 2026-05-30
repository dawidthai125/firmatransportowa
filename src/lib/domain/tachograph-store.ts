import { parseDddFilename } from '@/lib/domain/tachograph-parse'
import type {
  TachographDownload,
  TachographImportSource,
  TachographRecordType,
} from '@/lib/domain/tachograph-types'
import { driverDisplayName, type Driver } from '@/lib/domain/driver'
import { loadDrivers, seedDemoDrivers } from '@/lib/domain/drivers-store'
import { tombstoneDeleteInTenantData } from '@/lib/sync/tombstone'
import { readTenantData, writeTenantData } from '@/lib/tenant/storage'

/** Migracja starych rekordów (source = driver_card | vehicle_unit) */
function normalizeDownload(row: TachographDownload & { source?: string; recordType?: string }): TachographDownload {
  const importSources: TachographImportSource[] = ['remote_api', 'telematics', 'manual_upload']
  if (row.source && importSources.includes(row.source as TachographImportSource) && row.recordType) {
    return row as TachographDownload
  }

  const legacySource = row.source as string | undefined
  const recordTypes: TachographRecordType[] = ['driver_card', 'vehicle_unit', 'unknown']
  if (legacySource && recordTypes.includes(legacySource as TachographRecordType)) {
    return {
      ...row,
      recordType: legacySource as TachographRecordType,
      source: 'manual_upload',
    }
  }

  return {
    ...row,
    source: (row.source as TachographImportSource) ?? 'manual_upload',
    recordType: (row.recordType as TachographRecordType) ?? 'unknown',
  }
}

export function loadTachographDownloads(tenantId: string): TachographDownload[] {
  const raw = readTenantData<TachographDownload[]>(tenantId, 'tachograph', [])
  return raw.map(normalizeDownload)
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
    source: 'manual_upload',
    recordType: parsed.recordType,
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

type RemoteRecordInput = Omit<TachographDownload, 'id' | 'tenantId' | 'importedAt'> &
  Partial<Pick<TachographDownload, 'id' | 'importedAt'>>

/** Merge rekordów z API / telematyki — deduplikacja po externalId lub filename */
export function upsertTachographRemoteRecords(
  tenantId: string,
  incoming: RemoteRecordInput[],
): { added: number; updated: number } {
  seedDemoDrivers(tenantId)
  const drivers = loadDrivers(tenantId)
  const existing = loadTachographDownloads(tenantId)
  const byExternal = new Map(existing.filter((r) => r.externalId).map((r) => [r.externalId!, r]))
  const byFilename = new Map(existing.map((r) => [r.filename.toLowerCase(), r]))

  let added = 0
  let updated = 0
  const next = [...existing]

  for (const raw of incoming) {
    const matched = matchDriverByHint(drivers, raw.driverName)
    const normalized = normalizeDownload({
      ...raw,
      tenantId,
      driverId: raw.driverId ?? matched?.id,
      driverName: raw.driverName ?? (matched ? driverDisplayName(matched) : undefined),
    } as TachographDownload)

    const prev =
      (normalized.externalId && byExternal.get(normalized.externalId)) ||
      byFilename.get(normalized.filename.toLowerCase())

    if (prev) {
      const idx = next.findIndex((r) => r.id === prev.id)
      if (idx >= 0) {
        next[idx] = {
          ...prev,
          ...normalized,
          id: prev.id,
          importedAt: prev.importedAt,
          lastSyncAt: normalized.lastSyncAt ?? new Date().toISOString(),
        }
        updated++
      }
      continue
    }

    const row: TachographDownload = {
      ...normalized,
      id: raw.id ?? crypto.randomUUID(),
      tenantId,
      importedAt: raw.importedAt ?? new Date().toISOString(),
      lastSyncAt: normalized.lastSyncAt ?? new Date().toISOString(),
    }
    next.unshift(row)
    if (row.externalId) byExternal.set(row.externalId, row)
    byFilename.set(row.filename.toLowerCase(), row)
    added++
  }

  saveTachographDownloads(tenantId, next)
  return { added, updated }
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
  tombstoneDeleteInTenantData(tenantId, 'tachograph', id)
  return loadTachographDownloads(tenantId)
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
      source: 'manual_upload',
      recordType: 'driver_card',
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
      source: 'manual_upload',
      recordType: 'vehicle_unit',
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
