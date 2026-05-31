import {
  isSupabaseConfigured,
  supabaseAnonKey,
  supabaseFunctionsBase,
} from '@/config/supabase'
import { getSupabaseAccessToken } from '@/lib/auth/supabase-client'
import {
  TENANT_DATA_KEYS,
  tenantStorageKey,
  tenantsRegistryKey,
  type TenantDataKey,
} from '@/lib/tenant/types'
import {
  loadTenantsRegistry,
  readRawStorageEntry,
  writeTenantDataEnvelope,
} from '@/lib/tenant/storage'
import { mergeSyncEnvelopes, parseTenantStorageKey } from '@/lib/sync/merge-strategy'
import type { SyncEnvelope } from '@/lib/sync/sync-envelope'
import { isSyncEnvelope } from '@/lib/sync/sync-envelope'

export type CloudSyncStatus = 'idle' | 'syncing' | 'ok' | 'error' | 'offline'

export const SYNC_MERGED_EVENT = 'transflow:sync-merged'

let statusListeners: ((s: CloudSyncStatus, msg?: string) => void)[] = []
let lastStatus: CloudSyncStatus = isSupabaseConfigured() ? 'idle' : 'offline'
let lastSyncError: string | null = null
let pushTimer: ReturnType<typeof setTimeout> | null = null
const pendingPushKeys = new Set<string>()
/** id rekordu → baseline ISO UTC wysłany przy zapisie (ochrona przed nadpisaniem) */
const pendingSaveBaselines = new Map<string, Record<string, string>>()
let syncChain: Promise<void> = Promise.resolve()

export function getLastSyncError(): string | null {
  return lastSyncError
}

export async function retryCloudSync(): Promise<void> {
  await pullAllFromCloud()
}

/** Zarejestruj baseline formularza — serwer odrzuci zapis, jeśli w KV jest nowsza wersja */
export function registerSaveBaseline(
  tenantId: string,
  dataKey: TenantDataKey,
  recordId: string,
  baselineUpdatedAt: string,
): void {
  if (!baselineUpdatedAt) return
  const storageKey = tenantStorageKey(tenantId, dataKey)
  const map = pendingSaveBaselines.get(storageKey) ?? {}
  map[recordId] = baselineUpdatedAt
  pendingSaveBaselines.set(storageKey, map)
  pendingPushKeys.add(storageKey)
}

function attachSaveBaselines(key: string, value: unknown): unknown {
  const baselines = pendingSaveBaselines.get(key)
  if (!baselines || Object.keys(baselines).length === 0) return value
  pendingSaveBaselines.delete(key)
  if (!isSyncEnvelope(value)) return value
  const env = value as SyncEnvelope
  return { ...env, saveBaselines: baselines }
}

/** Pobierz i scal jeden klucz tenant — przed zapisem z formularza */
export async function pullTenantDataKey(
  tenantId: string,
  dataKey: TenantDataKey,
): Promise<void> {
  if (!isSupabaseConfigured()) return
  const key = tenantStorageKey(tenantId, dataKey)
  await withSyncLock(async () => {
    const [cloudVal] = await batchGet([key])
    mergeStorageKey(key, cloudVal, false)
  })
}

function withSyncLock<T>(fn: () => Promise<T>): Promise<T> {
  const next = syncChain.then(fn, fn)
  syncChain = next.then(
    () => undefined,
    () => undefined,
  )
  return next
}

export function onCloudStatus(cb: (s: CloudSyncStatus, msg?: string) => void): () => void {
  statusListeners.push(cb)
  cb(lastStatus)
  return () => {
    statusListeners = statusListeners.filter((x) => x !== cb)
  }
}

function setStatus(s: CloudSyncStatus, msg?: string) {
  lastStatus = s
  if (s === 'ok') lastSyncError = null
  if (s === 'error' && msg) lastSyncError = msg
  statusListeners.forEach((cb) => cb(s, msg))
}

const CLOUD_FETCH_TIMEOUT_MS = 20_000
const CLOUD_BATCH_CHUNK_SIZE = 8
const CLOUD_PULL_MAX_RETRIES = 3

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function withRetries<T>(label: string, fn: () => Promise<T>): Promise<T> {
  let lastErr: unknown
  for (let attempt = 1; attempt <= CLOUD_PULL_MAX_RETRIES; attempt++) {
    try {
      return await fn()
    } catch (e) {
      lastErr = e
      if (attempt < CLOUD_PULL_MAX_RETRIES) {
        await sleep(400 * attempt)
      }
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(`${label} failed`)
}

async function apiHeaders(): Promise<Record<string, string>> {
  const jwt = await getSupabaseAccessToken()
  const bearer = jwt ?? supabaseAnonKey
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${bearer}`,
    apikey: supabaseAnonKey,
  }
}

async function fetchCloud(
  path: string,
  init: RequestInit,
  timeoutMs = CLOUD_FETCH_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(`${supabaseFunctionsBase}${path}`, {
      ...init,
      signal: controller.signal,
    })
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      throw new Error(`timeout ${timeoutMs}ms`, { cause: e })
    }
    throw e
  } finally {
    clearTimeout(timer)
  }
}

async function batchGet(keys: string[]): Promise<unknown[]> {
  if (keys.length === 0) return []
  const out: unknown[] = []
  for (let i = 0; i < keys.length; i += CLOUD_BATCH_CHUNK_SIZE) {
    const chunk = keys.slice(i, i + CLOUD_BATCH_CHUNK_SIZE)
    const values = await withRetries('batch-get', async () => {
      const res = await fetchCloud('/batch-get', {
        method: 'POST',
        headers: await apiHeaders(),
        body: JSON.stringify({ keys: chunk }),
      })
      if (!res.ok) throw new Error(`batch-get ${res.status}`)
      const json = (await res.json()) as { values: unknown[] }
      return json.values
    })
    out.push(...values)
  }
  return out
}

async function batchSet(entries: { key: string; value: unknown }[]): Promise<void> {
  if (entries.length === 0) return
  const payload = entries.map(({ key, value }) => ({
    key,
    value: attachSaveBaselines(key, value),
  }))
  const res = await fetchCloud('/batch-set', {
    method: 'POST',
    headers: await apiHeaders(),
    body: JSON.stringify({ entries: payload }),
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

function allTenantStorageKeys(): string[] {
  const registryKey = tenantsRegistryKey()
  const tenants = loadTenantsRegistry()
  const dataKeys: string[] = []
  for (const tenant of tenants) {
    for (const dk of TENANT_DATA_KEYS) {
      dataKeys.push(tenantStorageKey(tenant.id, dk))
    }
  }
  return [registryKey, ...dataKeys]
}

/** Pobierz rejestr firm + dane tenantów — merge, nigdy ślepe nadpisanie chmurą */
export async function pullAllFromCloud(options?: { pushLocalAfter?: boolean }): Promise<void> {
  if (!isSupabaseConfigured()) return

  await withSyncLock(async () => {
    setStatus('syncing')
    try {
      await withRetries('pull', async () => {
        const registryKey = tenantsRegistryKey()
        const [registryCloud] = await batchGet([registryKey])
        const registryChanged = mergeStorageKey(registryKey, registryCloud, false)

        const dataKeys = allTenantStorageKeys().slice(1)
        const changedData = await mergeKeysFromCloud(dataKeys)
        const allChanged = registryChanged ? [registryKey, ...changedData] : changedData

        if (allChanged.length > 0) notifySyncMerged(allChanged)
      })

      if (options?.pushLocalAfter) {
        for (const key of allTenantStorageKeys()) {
          if (readRawStorageEntry(key) != null) pendingPushKeys.add(key)
        }
      }

      setStatus('ok')
    } catch (e) {
      console.error('[TransFlow] pull failed', e)
      const msg = e instanceof Error ? e.message : 'Sync error'
      setStatus('error', msg)
      throw e
    }
  })

  if (pendingPushKeys.size > 0) {
    await flushCloudPush()
  }
}

export function scheduleCloudPush(storageKey: string): void {
  if (!isSupabaseConfigured()) return
  pendingPushKeys.add(storageKey)
  if (pushTimer) clearTimeout(pushTimer)
  pushTimer = setTimeout(() => {
    void flushCloudPush()
  }, 2000)
}

/** Wymuś push oczekujących kluczy (np. po automatyzacji / harmonogramie) */
export async function flushCloudPushNow(): Promise<void> {
  if (pushTimer) {
    clearTimeout(pushTimer)
    pushTimer = null
  }
  await flushCloudPush()
}

/** Czekaj aż bieżąca operacja sync (pull/push) się zakończy */
export async function awaitCloudSyncIdle(): Promise<void> {
  await syncChain
}

/** Push wielu kluczy jednego tenanta w jednej transakcji sync */
export async function pushTenantKeysNow(tenantId: string, dataKeys: TenantDataKey[]): Promise<void> {
  if (!isSupabaseConfigured()) return
  const keys = dataKeys.map((k) => tenantStorageKey(tenantId, k))
  return withSyncLock(async () => {
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
      console.error('[TransFlow] push tenant keys failed', e)
      setStatus('error', e instanceof Error ? e.message : 'Push error')
      throw e
    }
  })
}

/** Push z read-modify-write — pobiera chmurę, scala, dopiero wtedy zapisuje */
async function flushCloudPush(): Promise<void> {
  if (!isSupabaseConfigured() || pendingPushKeys.size === 0) return

  return withSyncLock(async () => {
    const keys = [...pendingPushKeys]
    pendingPushKeys.clear()

    setStatus('syncing')
    try {
      const cloudValues = await batchGet(keys)
      const entries: { key: string; value: unknown }[] = []
      const mergedKeys: string[] = []

      for (let i = 0; i < keys.length; i++) {
        const key = keys[i]
        const localRaw = readRawStorageEntry(key)
        if (localRaw == null) continue

        try {
          const parsed = parseTenantStorageKey(key)
          if (!parsed) {
            entries.push({ key, value: localRaw })
            mergedKeys.push(key)
            continue
          }

          const prevJson = JSON.stringify(localRaw)
          const merged = mergeSyncEnvelopes(parsed.dataKey, localRaw, cloudValues[i], null)
          writeTenantDataEnvelope(key, merged)
          entries.push({ key, value: merged })
          if (JSON.stringify(merged) !== prevJson) mergedKeys.push(key)
        } catch (mergeErr) {
          console.error('[TransFlow] merge failed for', key, mergeErr)
          entries.push({ key, value: localRaw })
          mergedKeys.push(key)
        }
      }

      if (entries.length > 0) await batchSet(entries)
      if (mergedKeys.length > 0) notifySyncMerged(mergedKeys)
      setStatus('ok')
    } catch (e) {
      console.error('[TransFlow] push failed', e)
      setStatus('error', e instanceof Error ? e.message : 'Push error')
      keys.forEach((k) => pendingPushKeys.add(k))
    }
  })
}

export async function pushKeyNow(storageKey: string): Promise<void> {
  if (!isSupabaseConfigured()) return

  return withSyncLock(async () => {
    setStatus('syncing')
    try {
      const localRaw = readRawStorageEntry(storageKey)
      if (localRaw == null) return

      const parsed = parseTenantStorageKey(storageKey)
      if (!parsed) {
        await batchSet([{ key: storageKey, value: localRaw }])
        setStatus('ok')
        return
      }

      const [cloudVal] = await batchGet([storageKey])
      const merged = mergeSyncEnvelopes(parsed.dataKey, localRaw, cloudVal, null)
      writeTenantDataEnvelope(storageKey, merged)
      await batchSet([{ key: storageKey, value: merged }])
      setStatus('ok')
    } catch (e) {
      console.error('[TransFlow] pushKeyNow failed', storageKey, e)
      setStatus('error', e instanceof Error ? e.message : 'Push error')
      throw e
    }
  })
}

export async function checkCloudHealth(): Promise<boolean> {
  if (!isSupabaseConfigured()) return false
  try {
    const res = await fetchCloud('/health', { headers: await apiHeaders() }, 8000)
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
      void pullAllFromCloud().catch(() => undefined)
    } else if (pendingPushKeys.size > 0) {
      void flushCloudPush()
    }
  }

  document.addEventListener('visibilitychange', onVisible)
  return () => document.removeEventListener('visibilitychange', onVisible)
}
