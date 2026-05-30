import { scheduleCloudPush } from '@/lib/cloud-sync'
import {
  readRawStorageEntry,
  readStorageEnvelope,
  writeTenantDataEnvelope,
} from '@/lib/tenant/storage'
import type { TenantDataKey } from '@/lib/tenant/types'
import { tenantStorageKey } from '@/lib/tenant/types'
import { RECORD_ARRAY_KEYS } from '@/lib/sync/merge-strategy'
import {
  maxIso,
  normalizeToEnvelope,
  recordTimestamp,
  wrapForSync,
  type SyncEnvelope,
} from '@/lib/sync/sync-envelope'

type Identifiable = { id: string; updatedAt?: string; importedAt?: string; createdAt?: string }

/** Scal mapy tombstone — najnowszy deletedAt wygrywa per id */
export function mergeTombstoneMaps(
  a: Record<string, string> | undefined,
  b: Record<string, string> | undefined,
): Record<string, string> {
  const out: Record<string, string> = { ...(a ?? {}) }
  for (const [id, ts] of Object.entries(b ?? {})) {
    out[id] = maxIso(out[id], ts)
  }
  return out
}

/** Usuń rekordy, dla których tombstone jest nowszy niż rekord */
export function applyTombstones<T extends Identifiable>(
  records: T[],
  tombstones: Record<string, string> | undefined,
): T[] {
  if (!tombstones || Object.keys(tombstones).length === 0) return records
  return records.filter((r) => {
    const deletedAt = tombstones[r.id]
    if (!deletedAt) return true
    return recordTimestamp(r) > Date.parse(deletedAt)
  })
}

export function mergeEnvelopeTombstones(
  local: SyncEnvelope,
  cloud: SyncEnvelope,
): Record<string, string> {
  return mergeTombstoneMaps(local.tombstones, cloud.tombstones)
}

/** Odczyt tablicy z envelope z uwzględnieniem tombstone */
export function unwrapArrayPayload<T extends Identifiable>(
  raw: unknown,
  fallback: T[],
): T[] {
  const env = normalizeToEnvelope(raw, fallback)
  const arr = Array.isArray(env.payload) ? (env.payload as T[]) : fallback
  return applyTombstones(arr, env.tombstones)
}

/** Usuń rekord z tablicy tenant data + zapisz tombstone (sync między urządzeniami) */
export function tombstoneDeleteInTenantData(
  tenantId: string,
  dataKey: TenantDataKey,
  recordId: string,
): void {
  if (!RECORD_ARRAY_KEYS.includes(dataKey)) {
    throw new Error(`tombstoneDelete not supported for ${dataKey}`)
  }
  const storageKey = tenantStorageKey(tenantId, dataKey)
  const env = readStorageEnvelope(storageKey) ?? wrapForSync<Identifiable[]>([])
  const payload = Array.isArray(env.payload) ? (env.payload as Identifiable[]) : []
  const now = new Date().toISOString()
  const tombstones = mergeTombstoneMaps(env.tombstones, { [recordId]: now })
  const nextPayload = payload.filter((r) => r.id !== recordId)
  writeTenantDataEnvelope(storageKey, {
    ...wrapForSync(nextPayload, now),
    tombstones,
  })
  scheduleCloudPush(storageKey)
}

/** Po merge — zapisz envelope z payload + tombstones */
export function wrapMergedEnvelope<T>(
  payload: T,
  updatedAt: string,
  tombstones: Record<string, string>,
): SyncEnvelope<T> {
  const base = wrapForSync(payload, updatedAt)
  return Object.keys(tombstones).length > 0 ? { ...base, tombstones } : base
}

/** Legacy: odczyt surowego envelope z localStorage (merge path) */
export function readEnvelopeFromStorage(storageKey: string): SyncEnvelope | null {
  const raw = readRawStorageEntry(storageKey)
  if (raw == null) return null
  return normalizeToEnvelope(raw, null)
}
