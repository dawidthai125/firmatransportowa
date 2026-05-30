import {
  isSupabaseConfigured,
  supabaseAnonKey,
  supabaseFunctionsBase,
} from '@/config/supabase'
import {
  TENANT_DATA_KEYS,
  tenantStorageKey,
  tenantsRegistryKey,
} from '@/lib/tenant/types'
import {
  loadTenantsRegistry,
  readRawStorageEntry,
  writeTenantDataEnvelope,
} from '@/lib/tenant/storage'
import { mergeSyncEnvelopes, parseTenantStorageKey } from '@/lib/sync/merge-strategy'

export type CloudSyncStatus = 'idle' | 'syncing' | 'ok' | 'error' | 'offline'

export const SYNC_MERGED_EVENT = 'transflow:sync-merged'

let statusListeners: ((s: CloudSyncStatus, msg?: string) => void)[] = []
let lastStatus: CloudSyncStatus = isSupabaseConfigured() ? 'idle' : 'offline'
let pushTimer: ReturnType<typeof setTimeout> | null = null
let pendingPushKeys = new Set<string>()
let pullInFlight: Promise<void> | null = null

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
  if (keys.length === 0) return []
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
  if (entries.length === 0) return
  const res = await fetch(`${supabaseFunctionsBase}/batch-set`, {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify({ entries }),
  })
  if (!res.ok) throw new Error(`batch-set ${res.status}`)
}

function notifySyncMerged(keys: string[]) {
  if (typeof window === 'undefined' || keys.length === 0) return
  window.dispatchEvent(new CustomEvent(SYNC_MERGED_EVENT, { detail: { keys } }))
}

/**
 * Scal lokalną kopię z chmurą — najświeższe rekordy wygrywają (LWW per id).
 * Zapisuje wynik lokalnie; opcjonalnie od razu wypycha do KV.
 */
export function mergeStorageKey(
  storageKey: string,
  cloudRaw: unknown,
  pushAfter = false,
): boolean {
  const parsed = parseTenantStorageKey(storageKey)
  if (!parsed) return false

  const localRaw = readRawStorageEntry(storageKey)
  if (cloudRaw == null && localRaw == null) return false

  const merged = mergeSyncEnvelopes(
    parsed.dataKey,
    localRaw,
    cloudRaw,
    parsed.dataKey === 'registry' ? [] : null,
  )

  const prevJson = localRaw != null ? JSON.stringify(localRaw) : null
  const nextJson = JSON.stringify(merged)
  if (prevJson === nextJson && !pushAfter) return false

  writeTenantDataEnvelope(storageKey, merged)

  if (pushAfter) {
    void batchSet([{ key: storageKey, value: merged }])
  }

  return prevJson !== nextJson
}

/** Pull + merge wielu kluczy; zwraca klucze, które się zmieniły lokalnie */
async function mergeKeysFromCloud(keys: string[]): Promise<string[]> {
  if (keys.length === 0) return []
  const cloudValues = await batchGet(keys)
  const changed: string[] = []
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    const cloudVal = cloudValues[i]
    if (cloudVal == null && readRawStorageEntry(key) == null) continue
    const didChange = mergeStorageKey(key, cloudVal, false)
    if (didChange) changed.push(key)
  }
  return changed
}

/** Pobierz rejestr firm + dane tenantów — merge, nigdy ślepe nadpisanie chmurą */
export async function pullAllFromCloud(): Promise<void> {
  if (!isSupabaseConfigured()) return

  if (pullInFlight) {
    await pullInFlight
    return
  }

  pullInFlight = (async () => {
    setStatus('syncing')
    try {
      const registryKey = tenantsRegistryKey()
      const [registryCloud] = await batchGet([registryKey])
      const registryChanged = mergeStorageKey(registryKey, registryCloud, false)
      const tenants = loadTenantsRegistry()

      const dataKeys: string[] = []
      for (const tenant of tenants) {
        for (const dk of TENANT_DATA_KEYS) {
          dataKeys.push(tenantStorageKey(tenant.id, dk))
        }
      }

      const changedData = await mergeKeysFromCloud(dataKeys)
      const allChanged = registryChanged ? [registryKey, ...changedData] : changedData

      if (allChanged.length > 0) notifySyncMerged(allChanged)
      setStatus('ok')
    } catch (e) {
      console.error('[TransFlow] pull failed', e)
      setStatus('error', e instanceof Error ? e.message : 'Sync error')
    } finally {
      pullInFlight = null
    }
  })()

  await pullInFlight
}

export function scheduleCloudPush(storageKey: string): void {
  if (!isSupabaseConfigured()) return
  pendingPushKeys.add(storageKey)
  if (pushTimer) clearTimeout(pushTimer)
  pushTimer = setTimeout(flushCloudPush, 2000)
}

/** Push z read-modify-write — pobiera chmurę, scala, dopiero wtedy zapisuje */
async function flushCloudPush(): Promise<void> {
  if (!isSupabaseConfigured() || pendingPushKeys.size === 0) return

  const keys = [...pendingPushKeys]
  pendingPushKeys.clear()

  setStatus('syncing')
  try {
    const cloudValues = await batchGet(keys)
    const entries: { key: string; value: unknown }[] = []

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      const localRaw = readRawStorageEntry(key)
      if (localRaw == null) continue

      const parsed = parseTenantStorageKey(key)
      if (!parsed) {
        entries.push({ key, value: localRaw })
        continue
      }

      const merged = mergeSyncEnvelopes(parsed.dataKey, localRaw, cloudValues[i], null)
      writeTenantDataEnvelope(key, merged)
      entries.push({ key, value: merged })
    }

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
  const localRaw = readRawStorageEntry(storageKey)
  if (localRaw == null) return

  const parsed = parseTenantStorageKey(storageKey)
  if (!parsed) {
    await batchSet([{ key: storageKey, value: localRaw }])
    return
  }

  const [cloudVal] = await batchGet([storageKey])
  const merged = mergeSyncEnvelopes(parsed.dataKey, localRaw, cloudVal, null)
  writeTenantDataEnvelope(storageKey, merged)
  await batchSet([{ key: storageKey, value: merged }])
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

/** Okresowy pull gdy użytkownik wraca do karty — świeże dane od innych adminów/kierowców */
export function startCloudSyncListeners(): () => void {
  if (!isSupabaseConfigured() || typeof document === 'undefined') return () => {}

  const onVisible = () => {
    if (document.visibilityState === 'visible') {
      void pullAllFromCloud()
    }
  }

  document.addEventListener('visibilitychange', onVisible)
  return () => document.removeEventListener('visibilitychange', onVisible)
}
