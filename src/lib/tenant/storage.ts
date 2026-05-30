import { scheduleCloudPush } from '@/lib/cloud-sync'
import { RECORD_ARRAY_KEYS } from '@/lib/sync/merge-strategy'
import { unwrapArrayPayload } from '@/lib/sync/tombstone'
import {
  isSyncEnvelope,
  unwrapFromSync,
  wrapForSync,
  type SyncEnvelope,
} from '@/lib/sync/sync-envelope'
import type { Tenant, TenantDataKey } from './types'
import { tenantStorageKey, tenantsRegistryKey } from './types'
import { sanitizeTenantsRegistry } from './demo-data'

export function loadTenantsRegistry(): Tenant[] {
  try {
    const raw = localStorage.getItem(tenantsRegistryKey())
    if (!raw) return []
    return sanitizeTenantsRegistry(unwrapFromSync<Tenant[]>(JSON.parse(raw), []))
  } catch {
    return []
  }
}

export function saveTenantsRegistry(tenants: Tenant[]): void {
  const storageKey = tenantsRegistryKey()
  const wrapped = wrapForSync(tenants)
  localStorage.setItem(storageKey, JSON.stringify(wrapped))
  scheduleCloudPush(storageKey)
}

export function readTenantData<T>(tenantId: string, key: TenantDataKey, fallback: T): T {
  try {
    const raw = localStorage.getItem(tenantStorageKey(tenantId, key))
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    if (RECORD_ARRAY_KEYS.includes(key) && Array.isArray(fallback)) {
      return unwrapArrayPayload(parsed, fallback as { id: string }[]) as T
    }
    return unwrapFromSync<T>(parsed, fallback)
  } catch {
    return fallback
  }
}

export function writeTenantData<T>(tenantId: string, key: TenantDataKey, value: T): void {
  const storageKey = tenantStorageKey(tenantId, key)
  const wrapped = wrapForSync(value)
  localStorage.setItem(storageKey, JSON.stringify(wrapped))
  scheduleCloudPush(storageKey)
}

/** Zapis po merge z chmurą — zachowuje obliczony updatedAt */
export function writeTenantDataEnvelope(storageKey: string, envelope: SyncEnvelope): void {
  localStorage.setItem(storageKey, JSON.stringify(envelope))
}

export function readRawStorageEntry(storageKey: string): unknown {
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function readStorageEnvelope(storageKey: string): SyncEnvelope | null {
  const raw = readRawStorageEntry(storageKey)
  if (raw == null) return null
  return isSyncEnvelope(raw) ? raw : wrapForSync(raw)
}
