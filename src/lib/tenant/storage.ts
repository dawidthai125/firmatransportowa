import type { Tenant, TenantDataKey } from './types'
import { tenantStorageKey, tenantsRegistryKey } from './types'
import { scheduleCloudPush } from '@/lib/cloud-sync'

export function loadTenantsRegistry(): Tenant[] {
  try {
    const raw = localStorage.getItem(tenantsRegistryKey())
    if (!raw) return []
    return JSON.parse(raw) as Tenant[]
  } catch {
    return []
  }
}

export function saveTenantsRegistry(tenants: Tenant[]): void {
  localStorage.setItem(tenantsRegistryKey(), JSON.stringify(tenants))
  scheduleCloudPush(tenantsRegistryKey())
}

export function readTenantData<T>(tenantId: string, key: TenantDataKey, fallback: T): T {
  try {
    const raw = localStorage.getItem(tenantStorageKey(tenantId, key))
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function writeTenantData<T>(tenantId: string, key: TenantDataKey, value: T): void {
  const storageKey = tenantStorageKey(tenantId, key)
  localStorage.setItem(storageKey, JSON.stringify(value))
  scheduleCloudPush(storageKey)
}
