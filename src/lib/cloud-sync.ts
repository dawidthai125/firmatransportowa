import {
  isSupabaseConfigured,
  supabaseAnonKey,
  supabaseFunctionsBase,
} from '@/config/supabase'
import { getSupabaseAccessToken, getSupabaseClient } from '@/lib/auth/supabase-client'
import { loadSession } from '@/lib/auth/session'
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
let lastStatus: CloudSyncStatus = isSupabaseConfigured() ? 'ok' : 'offline'
let lastSyncError: string | null = null
let pushTimer: ReturnType<typeof setTimeout> | null = null
const pendingPushKeys = new Set<string>()
/** id rekordu → baseline ISO UTC wysłany przy zapisie (ochrona przed nadpisaniem) */
const pendingSaveBaselines = new Map<string, Record<string, string>>()
let syncChain: Promise<void> = Promise.resolve()
let activeFullPull: Promise<void> | null = null
let lastPullOkAt = 0
let pushRetryTimer: ReturnType<typeof setTimeout> | null = null
let pushRetryAttempt = 0
let lastVisibilityPullAt = 0

const CLOUD_FETCH_TIMEOUT_MS = 12_000
const CLOUD_BATCH_CHUNK_SIZE = 24
const CLOUD_PULL_MAX_RETRIES = 2
const VISIBILITY_PULL_MIN_INTERVAL_MS = 45_000
const PUSH_RETRY_MAX = 6

/** Klucze potrzebne pulpitowi / kursom — reszta w drugiej fazie w tle */
const PRIORITY_TENANT_DATA_KEYS: TenantDataKey[] = [
  'settings',
  'courses',
  'drivers',
  'vehicles',
  'daily-reports',
  'repair-reports',
  'fleet-positions',
  'course-messages',
  'compliance-alerts',
]

export interface CloudPullOptions {
  /** @deprecated nie używać przy starcie */
  pushLocalAfter?: boolean
  /** Pull startowy / w tle — bez „Synchronizacja…” w badge */
  silent?: boolean
  /** false = tylko rejestr + klucze operacyjne bieżącego tenanta */
  full?: boolean
}

export function getLastSyncError(): string | null {
  return lastSyncError
}

function friendlySyncError(e: unknown): string {
  const raw = e instanceof Error ? e.message : String(e)
  if (/abort|timeout/i.test(raw)) {
    return 'Serwer chmury nie odpowiada — odśwież za chwilę'
  }
  if (/failed to fetch|network|load failed/i.test(raw)) {
    return 'Brak połączenia z internetem lub chmurą'
  }
  if (/50[23]/.test(raw)) {
    return 'Chmura startuje — spróbuj ponownie za kilka sekund'
  }
  return raw.length > 80 ? `${raw.slice(0, 77)}…` : raw
}

async function waitForSupabaseAuth(maxMs = 3500): Promise<void> {
  if (!isSupabaseConfigured()) return
  const sb = getSupabaseClient()
  if (!sb) return
  const deadline = Date.now() + maxMs
  while (Date.now() < deadline) {
    const { data } = await sb.auth.getSession()
    if (data.session?.access_token) return
    await sleep(120)
  }
}

export async function retryCloudSync(): Promise<void> {
  await pullAllFromCloud({ silent: false, full: true })
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

function setStatus(s: CloudSyncStatus, msg?: string, options?: { silent?: boolean }) {
  if (options?.silent) {
    if (s === 'syncing') return
    if (s === 'ok') {
      lastStatus = 'ok'
      lastSyncError = null
      statusListeners.forEach((cb) => cb(s, msg))
      return
    }
  }
  lastStatus = s
  if (s === 'ok') lastSyncError = null
  if (s === 'error' && msg) lastSyncError = msg
  statusListeners.forEach((cb) => cb(s, msg))
}

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
  const chunks: string[][] = []
  for (let i = 0; i < keys.length; i += CLOUD_BATCH_CHUNK_SIZE) {
    chunks.push(keys.slice(i, i + CLOUD_BATCH_CHUNK_SIZE))
  }
  const chunkResults = await Promise.all(
    chunks.map((chunk) =>
      withRetries('batch-get', async () => {
        const res = await fetchCloud('/batch-get', {
          method: 'POST',
          headers: await apiHeaders(),
          body: JSON.stringify({ keys: chunk }),
        })
        if (!res.ok) throw new Error(`batch-get ${res.status}`)
        const json = (await res.json()) as { values: unknown[] }
        return json.values
      }),
    ),
  )
  return chunkResults.flat()
}

async function batchSet(entries: { key: string; value: unknown }[]): Promise<void> {
  if (entries.length === 0) return
  for (let i = 0; i < entries.length; i += CLOUD_BATCH_CHUNK_SIZE) {
    const chunk = entries.slice(i, i + CLOUD_BATCH_CHUNK_SIZE)
    const payload = chunk.map(({ key, value }) => ({
      key,
      value: attachSaveBaselines(key, value),
    }))
    await withRetries('batch-set', async () => {
      const res = await fetchCloud('/batch-set', {
        method: 'POST',
        headers: await apiHeaders(),
        body: JSON.stringify({ entries: payload }),
      })
      if (!res.ok) throw new Error(`batch-set ${res.status}`)
    })
  }
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

function activeTenantId(): string | null {
  const session = loadSession()
  if (session?.tenantId) return session.tenantId
  const tenants = loadTenantsRegistry()
  return tenants[0]?.id ?? null
}

function buildPriorityStorageKeys(): string[] {
  const registryKey = tenantsRegistryKey()
  const tenantId = activeTenantId()
  if (!tenantId) return [registryKey]
  const dataKeys = PRIORITY_TENANT_DATA_KEYS.map((dk) => tenantStorageKey(tenantId, dk))
  return [registryKey, ...dataKeys]
}

function buildDeferredStorageKeys(): string[] {
  const priority = new Set(buildPriorityStorageKeys())
  return allTenantStorageKeys().filter((k) => !priority.has(k))
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
export async function pullAllFromCloud(options?: CloudPullOptions): Promise<void> {
  if (!isSupabaseConfigured()) return

  if (activeFullPull) return activeFullPull

  activeFullPull = pullAllFromCloudInner(options).finally(() => {
    window.setTimeout(() => {
      activeFullPull = null
    }, 800)
  })

  return activeFullPull
}

async function pullDeferredFromCloud(silent: boolean): Promise<void> {
  const keys = buildDeferredStorageKeys()
  if (keys.length === 0) return
  try {
    await withSyncLock(async () => {
      const changed = await mergeKeysFromCloud(keys)
      if (changed.length > 0) notifySyncMerged(changed)
    })
  } catch (e) {
    console.warn('[TransFlow] deferred pull failed', e)
    if (!silent) {
      setStatus('error', friendlySyncError(e))
    }
  }
}

async function pullAllFromCloudInner(options?: CloudPullOptions): Promise<void> {
  const silent = options?.silent ?? false
  const full = options?.full ?? true

  await waitForSupabaseAuth(silent ? 1800 : 3500)

  await withSyncLock(async () => {
    setStatus('syncing', undefined, { silent })
    try {
      await withRetries('pull', async () => {
        const keys = full ? allTenantStorageKeys() : buildPriorityStorageKeys()
        const changed = await mergeKeysFromCloud(keys)
        if (changed.length > 0) notifySyncMerged(changed)
      })

      lastPullOkAt = Date.now()

      if (options?.pushLocalAfter) {
        for (const key of allTenantStorageKeys()) {
          if (readRawStorageEntry(key) != null) pendingPushKeys.add(key)
        }
      }

      setStatus('ok', undefined, { silent })
    } catch (e) {
      console.error('[TransFlow] pull failed', e)
      const msg = friendlySyncError(e)
      setStatus('error', msg)
      throw e
    }
  })

  if (!full) {
    void pullDeferredFromCloud(true)
  }

  if (pendingPushKeys.size > 0) {
    queueMicrotask(() => {
      void flushCloudPush({ silent: true })
    })
  }
}

export function scheduleCloudPush(storageKey: string): void {
  if (!isSupabaseConfigured()) return
  pendingPushKeys.add(storageKey)
  if (pushTimer) clearTimeout(pushTimer)
  pushTimer = setTimeout(() => {
    void flushCloudPush({ silent: true })
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

function schedulePushRetry(keys: string[]): void {
  keys.forEach((k) => pendingPushKeys.add(k))
  if (pushRetryTimer) return
  if (pushRetryAttempt >= PUSH_RETRY_MAX) {
    console.warn('[TransFlow] limit ponowień push — dane zostają lokalnie')
    return
  }
  const delay = Math.min(8000 * 1.8 ** pushRetryAttempt, 120_000)
  pushRetryAttempt += 1
  pushRetryTimer = setTimeout(() => {
    pushRetryTimer = null
    void flushCloudPush({ silent: true })
  }, delay)
}

/** Push z read-modify-write — pobiera chmurę, scala, dopiero wtedy zapisuje */
async function flushCloudPush(options?: { silent?: boolean }): Promise<void> {
  if (!isSupabaseConfigured() || pendingPushKeys.size === 0) return

  const silent = options?.silent ?? false

  return withSyncLock(async () => {
    const keys = [...pendingPushKeys]
    pendingPushKeys.clear()

    setStatus('syncing', undefined, { silent })
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
      pushRetryAttempt = 0
      setStatus('ok', undefined, { silent })
    } catch (e) {
      console.error('[TransFlow] push failed', e)
      const msg = friendlySyncError(e)
      lastSyncError = msg
      const pullRecent = lastPullOkAt > 0 && Date.now() - lastPullOkAt < 120_000
      if (pullRecent) {
        setStatus('ok', undefined, { silent })
        schedulePushRetry(keys)
      } else {
        setStatus('error', msg, { silent })
        schedulePushRetry(keys)
      }
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
      const now = Date.now()
      if (now - lastVisibilityPullAt < VISIBILITY_PULL_MIN_INTERVAL_MS) return
      lastVisibilityPullAt = now
      void pullAllFromCloud({ silent: true, full: false }).catch(() => undefined)
    } else if (pendingPushKeys.size > 0) {
      void flushCloudPush({ silent: true })
    }
  }

  document.addEventListener('visibilitychange', onVisible)
  return () => document.removeEventListener('visibilitychange', onVisible)
}
