import { SYNC_MERGED_EVENT } from '@/lib/cloud-sync'
import { tenantStorageKey, tenantsRegistryKey, type TenantDataKey } from '@/lib/tenant/types'
import { useEffect } from 'react'

/** Odśwież widok po merge z chmury (inny admin/kierowca zapisał dane) */
export function useCloudSyncRefresh(
  tenantId: string | undefined,
  dataKey: TenantDataKey,
  onRefresh: () => void,
): void {
  useCloudSyncRefreshKeys(tenantId, [dataKey], onRefresh)
}

/** Odśwież gdy zsynchronizowano dowolny z podanych kluczy tenantowych */
export function useCloudSyncRefreshKeys(
  tenantId: string | undefined,
  dataKeys: TenantDataKey[],
  onRefresh: () => void,
): void {
  const keySignature = dataKeys.join('\0')

  useEffect(() => {
    if (!tenantId || dataKeys.length === 0) return
    const storageKeys = new Set(dataKeys.map((k) => tenantStorageKey(tenantId, k)))

    const handler = (e: Event) => {
      const keys = (e as CustomEvent<{ keys: string[] }>).detail?.keys ?? []
      if (keys.includes(tenantsRegistryKey()) || keys.some((k) => storageKeys.has(k))) {
        onRefresh()
      }
    }

    window.addEventListener(SYNC_MERGED_EVENT, handler)
    return () => window.removeEventListener(SYNC_MERGED_EVENT, handler)
  }, [tenantId, keySignature, onRefresh, dataKeys.length])
}
