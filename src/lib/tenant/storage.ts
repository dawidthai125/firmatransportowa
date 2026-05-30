import type { Tenant, TenantDataKey } from './types'
import { tenantStorageKey, tenantsRegistryKey } from './types'

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
  localStorage.setItem(tenantStorageKey(tenantId, key), JSON.stringify(value))
}
