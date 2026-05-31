import { pullTenantDataKey, pushKeyNow, registerSaveBaseline } from '@/lib/cloud-sync'
import { isSupabaseConfigured } from '@/config/supabase'
import { checkRecordStale } from '@/lib/sync/record-conflict'
import { fetchServerTimeUtc } from '@/lib/sync/server-time'
import type { TenantDataKey } from '@/lib/tenant/types'
import { tenantStorageKey } from '@/lib/tenant/types'

export class StaleRecordSaveError extends Error {
  remoteUpdatedAt?: string

  constructor(remoteUpdatedAt?: string) {
    super('STALE_RECORD')
    this.name = 'StaleRecordSaveError'
    this.remoteUpdatedAt = remoteUpdatedAt
  }
}

export interface GuardedSaveOptions {
  /** Czas otwarcia formularza (serverSavedAt lub updatedAt z chmury) */
  baselineUpdatedAt?: string
  /** Pomiń sprawdzenie — tylko po potwierdzeniu użytkownika */
  force?: boolean
}

type AuthoritativeRecord = {
  id: string
  updatedAt?: string
  serverSavedAt?: string
  createdAt?: string
}

/**
 * Przed zapisem: pobierz chmurę, sprawdź czy nie ma nowszej wersji, nadaj znacznik czasu serwera (UTC).
 */
export async function prepareGuardedRecordSave<T extends AuthoritativeRecord>(
  tenantId: string,
  dataKey: TenantDataKey,
  record: T,
  options: GuardedSaveOptions = {},
): Promise<T> {
  if (isSupabaseConfigured()) {
    await pullTenantDataKey(tenantId, dataKey)
  }

  if (!options.force && options.baselineUpdatedAt) {
    const check = checkRecordStale(tenantId, dataKey, record.id, options.baselineUpdatedAt)
    if (check.isStale) {
      throw new StaleRecordSaveError(check.remoteUpdatedAt)
    }
  }

  const serverTime = await fetchServerTimeUtc()
  registerSaveBaseline(
    tenantId,
    dataKey,
    record.id,
    options.baselineUpdatedAt ?? record.serverSavedAt ?? record.updatedAt ?? '',
  )

  return {
    ...record,
    updatedAt: serverTime,
    serverSavedAt: serverTime,
  }
}

/** Zapis tablicy tenant + natychmiastowy push z baseline (serwer odrzuci starszy zapis). */
export async function writeGuardedTenantArrayRecord<T extends AuthoritativeRecord>(
  tenantId: string,
  dataKey: TenantDataKey,
  record: T,
  loadFn: (tenantId: string) => T[],
  saveFn: (tenantId: string, rows: T[]) => void,
  options: GuardedSaveOptions = {},
): Promise<T[]> {
  const stamped = await prepareGuardedRecordSave(tenantId, dataKey, record, options)
  const rows = loadFn(tenantId)
  const idx = rows.findIndex((r) => r.id === stamped.id)
  const next = [...rows]
  if (idx >= 0) next[idx] = stamped
  else next.unshift(stamped)
  saveFn(tenantId, next)

  if (isSupabaseConfigured()) {
    await pushKeyNow(tenantStorageKey(tenantId, dataKey))
  }

  return next
}

export function staleSaveMessage(): string {
  return 'Ktoś inny zapisał nowszą wersję w międzyczasie. Odśwież dane i spróbuj ponownie.'
}
