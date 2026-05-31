import { checkRecordStale, confirmSaveOverStaleRecord } from '@/lib/sync/record-conflict'
import { useCloudSyncRefreshKeys } from '@/lib/sync/useCloudSyncRefresh'
import type { TenantDataKey } from '@/lib/tenant/types'
import { useCallback, useEffect, useRef, useState } from 'react'

type TimestampedRecord = { id: string; serverSavedAt?: string; updatedAt?: string }

/**
 * Pilnuje edycji rekordu: wykrywa zmiany z chmury i pyta przed nadpisaniem.
 */
export function useSyncedEditGuard<T extends TimestampedRecord>(
  tenantId: string | undefined,
  dataKey: TenantDataKey,
  editing: T | null,
  setEditing: (value: T | null) => void,
  isNew: boolean,
  entityLabel: string,
) {
  const [conflict, setConflict] = useState(false)
  const baselineRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (!editing || isNew) {
      baselineRef.current = editing?.serverSavedAt ?? editing?.updatedAt
      setConflict(false)
      return
    }
    baselineRef.current = editing.serverSavedAt ?? editing.updatedAt
    setConflict(false)
  }, [editing?.id, isNew, editing?.serverSavedAt, editing?.updatedAt])

  const refreshConflict = useCallback(() => {
    if (!tenantId || !editing || isNew) {
      setConflict(false)
      return
    }
    const check = checkRecordStale(tenantId, dataKey, editing.id, baselineRef.current)
    setConflict(check.isStale)
  }, [tenantId, dataKey, editing, isNew])

  useCloudSyncRefreshKeys(tenantId, [dataKey], refreshConflict)

  function reloadFromStore(loader: () => T[]) {
    if (!editing) return
    const fresh = loader().find((r) => r.id === editing.id)
    if (fresh) {
      setEditing(fresh)
      baselineRef.current = fresh.updatedAt
      setConflict(false)
    }
  }

  function guardSave(): boolean {
    if (isNew || !conflict) return true
    return confirmSaveOverStaleRecord(entityLabel)
  }

  function getBaselineUpdatedAt(): string | undefined {
    return baselineRef.current
  }

  return { conflict, reloadFromStore, guardSave, refreshConflict, getBaselineUpdatedAt }
}
