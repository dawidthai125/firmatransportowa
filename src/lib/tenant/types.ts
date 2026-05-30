/** Plan abonamentowy — na start wszystkie funkcje włączone (dev / trial). */
export type SubscriptionPlan = 'trial' | 'starter' | 'business' | 'enterprise'

export type TenantStatus = 'active' | 'suspended' | 'trial_expired'

export interface Tenant {
  id: string
  /** Krótki kod do logowania, np. TRANS-KOWALSKI */
  slug: string
  name: string
  plan: SubscriptionPlan
  status: TenantStatus
  createdAt: string
  /** NIP / dane do faktury — opcjonalnie na start */
  taxId?: string
  settings: TenantSettings
}

export interface TenantSettings {
  country: 'PL' | 'EU'
  /** Transport krajowy / międzynarodowy / oba */
  transportScope: 'domestic' | 'international' | 'both'
  currency: 'PLN' | 'EUR'
  timezone: string
  /** Włączone moduły — pod abonament */
  modules: TenantModules
}

export interface TenantModules {
  fleet: boolean
  drivers: boolean
  courses: boolean
  compliance: boolean
  gps: boolean
  loadBoard: boolean
  tachographImport: boolean
}

export const DEFAULT_MODULES: TenantModules = {
  fleet: true,
  drivers: true,
  courses: true,
  compliance: true,
  gps: false,
  loadBoard: false,
  tachographImport: false,
}

export function createDefaultTenantSettings(): TenantSettings {
  return {
    country: 'PL',
    transportScope: 'domestic',
    currency: 'PLN',
    timezone: 'Europe/Warsaw',
    modules: { ...DEFAULT_MODULES },
  }
}

/** Klucze danych per tenant — każda firma ma izolowany namespace. */
export type TenantDataKey =
  | 'drivers'
  | 'vehicles'
  | 'courses'
  | 'daily-reports'
  | 'compliance-alerts'
  | 'settings'

export const TENANT_DATA_KEYS: TenantDataKey[] = [
  'drivers',
  'vehicles',
  'courses',
  'daily-reports',
  'compliance-alerts',
  'settings',
]

export function tenantStorageKey(tenantId: string, key: TenantDataKey): string {
  return `ft-${tenantId}-${key}`
}

export function tenantsRegistryKey(): string {
  return 'ft-tenants-registry'
}
