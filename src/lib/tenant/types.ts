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
  /** Ostatnia zmiana planu / ustawień firmy — do merge rejestru tenantów */
  updatedAt?: string
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
  /** Moduł mapy GPS / floty na pulpicie */
  gps: boolean
  loadBoard: boolean
  /** Moduł ITD — instrukcje, alerty, mapa kontroli */
  itd: boolean
  tachographImport: boolean
  repairs: boolean
  /** Kierowca aktualizuje status kursu z kabiny */
  courseStatusPing: boolean
  /** Zdjęcia CMR / POD przy kursie */
  courseDocuments: boolean
  /** Marża per pojazd na pulpicie */
  vehicleMargin: boolean
  /** Eksport faktur — Fakturownia / wFirma / CSV */
  invoicing: boolean
  /** Checklista RMPD / SENT */
  rmpdSent: boolean
  /** Czat przy kursie dyspozytor ↔ kierowca */
  driverChat: boolean
  /** Rozliczenie wynagrodzenia kierowcy */
  driverPayroll: boolean
  /** Plan tygodnia — widok Gantt-lite */
  weeklyPlanner: boolean
  /** Link tracking read-only dla klienta */
  clientPortal: boolean
  /** OCR zlecenia transportowego (rate con) — zdjęcie / PDF */
  ocrRateCon: boolean
  /** Elektroniczny list przewozowy CMR (e-CMR) */
  eCmr: boolean
  /** Produkcyjne API Trans.eu / TimoCom (nie demo feed) */
  freightApiProd: boolean
}

export const DEFAULT_MODULES: TenantModules = {
  fleet: true,
  drivers: true,
  courses: true,
  compliance: true,
  gps: true,
  loadBoard: true,
  itd: true,
  tachographImport: true,
  repairs: true,
  courseStatusPing: true,
  courseDocuments: true,
  vehicleMargin: true,
  invoicing: false,
  rmpdSent: true,
  driverChat: true,
  driverPayroll: false,
  weeklyPlanner: true,
  clientPortal: false,
  ocrRateCon: false,
  eCmr: false,
  freightApiProd: true,
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
  | 'files'
  | 'automation'
  | 'repair-reports'
  | 'fleet-positions'
  | 'freight-board'
  | 'freight-offers'
  | 'freight-connectors'
  | 'itd'
  | 'tachograph'
  | 'tachograph-connectors'
  | 'fleet-telematics-connectors'
  | 'course-messages'
  | 'invoicing-config'
  | 'driver-payroll-rates'
  | 'ocr-config'

export const TENANT_DATA_KEYS: TenantDataKey[] = [
  'drivers',
  'vehicles',
  'courses',
  'daily-reports',
  'compliance-alerts',
  'settings',
  'files',
  'automation',
  'repair-reports',
  'fleet-positions',
  'freight-board',
  'freight-offers',
  'freight-connectors',
  'itd',
  'tachograph',
  'tachograph-connectors',
  'fleet-telematics-connectors',
  'course-messages',
  'invoicing-config',
  'driver-payroll-rates',
  'ocr-config',
]

export function tenantStorageKey(tenantId: string, key: TenantDataKey): string {
  return `ft-${tenantId}-${key}`
}

export function tenantsRegistryKey(): string {
  return 'ft-tenants-registry'
}
