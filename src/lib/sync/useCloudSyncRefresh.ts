import { SYNC_MERGED_EVENT } from '@/lib/cloud-sync'
import { tenantStorageKey, type TenantDataKey } from '@/lib/tenant/types'
import { useEffect } from 'react'

/** Odśwież widok po merge z chmury (inny admin/kierowca zapisał dane) */
export function useCloudSyncRefresh(
  tenantId: string | undefined,
  dataKey: TenantDataKey,
  onRefresh: () => void,
): void {
  useEffect(() => {
    if (!tenantId) return
    const storageKey = tenantStorageKey(tenantId, dataKey)

    const handler = (e: Event) => {
      const keys = (e as CustomEvent<{ keys: string[] }>).detail?.keys ?? []
      if (keys.includes(storageKey)) onRefresh()
    }

    window.addEventListener(SYNC_MERGED_EVENT, handler)
    return () => window.removeEventListener(SYNC_MERGED_EVENT, handler)
  }, [tenantId, dataKey, onRefresh])
}
