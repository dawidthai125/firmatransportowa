import {
  isSupabaseConfigured,
  supabaseAnonKey,
  supabaseFunctionsBase,
} from '@/config/supabase'
import type { Tenant } from '@/lib/tenant/types'
import {
  TENANT_DATA_KEYS,
  tenantStorageKey,
  tenantsRegistryKey,
} from '@/lib/tenant/types'
import { saveTenantsRegistry } from '@/lib/tenant/storage'

export type CloudSyncStatus = 'idle' | 'syncing' | 'ok' | 'error' | 'offline'

let statusListeners: ((s: CloudSyncStatus, msg?: string) => void)[] = []
let lastStatus: CloudSyncStatus = isSupabaseConfigured() ? 'idle' : 'offline'
let pushTimer: ReturnType<typeof setTimeout> | null = null
let pendingPushKeys = new Set<string>()

export function onCloudStatus(cb: (s: CloudSyncStatus, msg?: string) => void): () => void {
  statusListeners.push(cb)
  cb(lastStatus)
  return () => {
    statusListeners = statusListeners.filter((x) => x !== cb)
  }
}

function setStatus(s: CloudSyncStatus, msg?: string) {
  lastStatus = s
  statusListeners.forEach((cb) => cb(s, msg))
}

function apiHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${supabaseAnonKey}`,
    apikey: supabaseAnonKey,
  }
}

async function batchGet(keys: string[]): Promise<unknown[]> {
  const res = await fetch(`${supabaseFunctionsBase}/batch-get`, {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify({ keys }),
  })
  if (!res.ok) throw new Error(`batch-get ${res.status}`)
  const json = (await res.json()) as { values: unknown[] }
  return json.values
}

async function batchSet(entries: { key: string; value: unknown }[]): Promise<void> {
  const res = await fetch(`${supabaseFunctionsBase}/batch-set`, {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify({ entries }),
  })
  if (!res.ok) throw new Error(`batch-set ${res.status}`)
}

function mergeArrayById<T extends { id: string }>(local: T[], cloud: T[]): T[] {
  const map = new Map<string, T>()
  for (const item of local) map.set(item.id, item)
  for (const item of cloud) map.set(item.id, item)
  return [...map.values()]
}

function mergeJsonArray<T extends { id: string }>(localRaw: unknown, cloudRaw: unknown): T[] {
  const local = Array.isArray(localRaw) ? (localRaw as T[]) : []
  const cloud = Array.isArray(cloudRaw) ? (cloudRaw as T[]) : []
  if (cloud.length === 0) return local
  if (local.length === 0) return cloud
  return mergeArrayById(local, cloud)
}

function mergeTenants(local: Tenant[], cloud: Tenant[]): Tenant[] {
  const map = new Map<string, Tenant>()
  for (const t of local) map.set(t.id, t)
  for (const t of cloud) map.set(t.id, t)
  return [...map.values()]
}

/** Pobierz rejestr firm + dane wszystkich tenantów z demo (pełny pull przy starcie). */
export async function pullAllFromCloud(): Promise<void> {
  if (!isSupabaseConfigured()) return

  setStatus('syncing')
  try {
    const registryKey = tenantsRegistryKey()
    const [registryRaw] = await batchGet([registryKey])
    const localRegistry = JSON.parse(localStorage.getItem(registryKey) || '[]') as Tenant[]
    const cloudRegistry = Array.isArray(registryRaw) ? (registryRaw as Tenant[]) : []
    const mergedRegistry = mergeTenants(localRegistry, cloudRegistry)
    saveTenantsRegistry(mergedRegistry)

    const dataKeys: string[] = []
    for (const tenant of mergedRegistry) {
      for (const dk of TENANT_DATA_KEYS) {
        dataKeys.push(tenantStorageKey(tenant.id, dk))
      }
    }

    if (dataKeys.length === 0) {
      setStatus('ok')
      return
    }

    const values = await batchGet(dataKeys)
    for (let i = 0; i < dataKeys.length; i++) {
      const key = dataKeys[i]
      const cloudVal = values[i]
      if (cloudVal == null) continue

      const localRaw = localStorage.getItem(key)
      let merged: unknown = cloudVal

      if (localRaw) {
        try {
          const localVal = JSON.parse(localRaw)
          const dataKey = TENANT_DATA_KEYS.find((dk) => key.endsWith(`-${dk}`))
          if (dataKey && ['drivers', 'vehicles', 'courses', 'daily-reports', 'files'].includes(dataKey)) {
            merged = mergeJsonArray(localVal, cloudVal)
          } else {
            merged = cloudVal
          }
        } catch {
          merged = cloudVal
        }
      }

      localStorage.setItem(key, JSON.stringify(merged))
    }

    setStatus('ok')
  } catch (e) {
    console.error('[TransFlow] pull failed', e)
    setStatus('error', e instanceof Error ? e.message : 'Sync error')
  }
}

export function scheduleCloudPush(storageKey: string): void {
  if (!isSupabaseConfigured()) return
  pendingPushKeys.add(storageKey)
  if (pushTimer) clearTimeout(pushTimer)
  pushTimer = setTimeout(flushCloudPush, 2000)
}

async function flushCloudPush(): Promise<void> {
  if (!isSupabaseConfigured() || pendingPushKeys.size === 0) return

  const keys = [...pendingPushKeys]
  pendingPushKeys.clear()

  setStatus('syncing')
  try {
    const entries = keys
      .map((key) => {
        const raw = localStorage.getItem(key)
        if (!raw) return null
        return { key, value: JSON.parse(raw) }
      })
      .filter(Boolean) as { key: string; value: unknown }[]

    if (entries.length > 0) await batchSet(entries)
    setStatus('ok')
  } catch (e) {
    console.error('[TransFlow] push failed', e)
    setStatus('error', e instanceof Error ? e.message : 'Push error')
    keys.forEach((k) => pendingPushKeys.add(k))
  }
}

export async function pushKeyNow(storageKey: string): Promise<void> {
  if (!isSupabaseConfigured()) return
  const raw = localStorage.getItem(storageKey)
  if (!raw) return
  await batchSet([{ key: storageKey, value: JSON.parse(raw) }])
}

export async function checkCloudHealth(): Promise<boolean> {
  if (!isSupabaseConfigured()) return false
  try {
    const res = await fetch(`${supabaseFunctionsBase}/health`, { headers: apiHeaders() })
    return res.ok
  } catch {
    return false
  }
}

export function getCloudStatus(): CloudSyncStatus {
  return lastStatus
}
