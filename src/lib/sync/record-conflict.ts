import { recordTimestamp } from '@/lib/sync/sync-envelope'
import { readTenantData } from '@/lib/tenant/storage'
import type { TenantDataKey } from '@/lib/tenant/types'

export interface StaleRecordCheck {
  isStale: boolean
  remoteUpdatedAt?: string
}

type TimestampedRecord = {
  id: string
  updatedAt?: string
  importedAt?: string
  createdAt?: string
}

export function findTenantRecord<T extends TimestampedRecord>(
  tenantId: string,
  dataKey: TenantDataKey,
  recordId: string,
): T | undefined {
  const list = readTenantData<T[]>(tenantId, dataKey, [])
  return list.find((r) => r.id === recordId)
}

/** Czy ktoś inny zaktualizował ten sam rekord od otwarcia formularza? */
export function checkRecordStale(
  tenantId: string,
  dataKey: TenantDataKey,
  recordId: string,
  baselineUpdatedAt: string | undefined,
): StaleRecordCheck {
  if (!baselineUpdatedAt) return { isStale: false }
  const remote = findTenantRecord(tenantId, dataKey, recordId)
  if (!remote) return { isStale: false }
  const remoteTs = recordTimestamp(remote)
  const baselineTs = recordTimestamp({ updatedAt: baselineUpdatedAt })
  if (remoteTs > baselineTs) {
    return { isStale: true, remoteUpdatedAt: remote.updatedAt ?? remote.createdAt }
  }
  return { isStale: false }
}

export function confirmSaveOverStaleRecord(entityLabel: string): boolean {
  return window.confirm(
    `${entityLabel}\n\nKtoś inny zaktualizował ten wpis, gdy miałeś otwarty formularz.\n\nZapis nadpisze nowszą wersję. Kontynuować mimo to?`,
  )
}
