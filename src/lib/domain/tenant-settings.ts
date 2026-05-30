import type { DatedDocument } from '@/lib/domain/compliance'
import { readTenantData, writeTenantData } from '@/lib/tenant/storage'

export type CompanyDocumentType =
  | 'licencja_krajowa'
  | 'licencja_wspolnotowa'
  | 'zezwolenie_przewoznika'
  | 'ckz'
  | 'baza_eksploatacyjna'

export interface CompanyDocument extends DatedDocument {
  type: CompanyDocumentType
}

export interface TenantSettingsData {
  companyDocuments: CompanyDocument[]
}

const DEFAULT_SETTINGS: TenantSettingsData = {
  companyDocuments: [],
}

export const COMPANY_DOC_LABELS: Record<CompanyDocumentType, string> = {
  licencja_krajowa: 'Licencja krajowa',
  licencja_wspolnotowa: 'Licencja wspólnotowa (GITD)',
  zezwolenie_przewoznika: 'Zezwolenie przewoźnika',
  ckz: 'CKZ — certyfikat kompetencji',
  baza_eksploatacyjna: 'Baza eksploatacyjna',
}

export function loadTenantSettingsData(tenantId: string): TenantSettingsData {
  return readTenantData<TenantSettingsData>(tenantId, 'settings', DEFAULT_SETTINGS)
}

export function saveTenantSettingsData(tenantId: string, data: TenantSettingsData): void {
  writeTenantData(tenantId, 'settings', data)
}

export function seedDemoCompanyDocuments(tenantId: string): TenantSettingsData {
  const existing = loadTenantSettingsData(tenantId)
  if (existing.companyDocuments.length > 0) return existing

  const data: TenantSettingsData = {
    companyDocuments: [
      { type: 'licencja_wspolnotowa', label: 'Licencja wspólnotowa', expiresAt: '2030-06-01' },
      { type: 'ckz', label: 'CKZ — Jan Kowalski', expiresAt: '2028-03-15' },
      { type: 'zezwolenie_przewoznika', label: 'Zezwolenie przewoźnika', expiresAt: '2029-01-01' },
      { type: 'baza_eksploatacyjna', label: 'Zaświadczenie bazy', expiresAt: '2027-12-31' },
    ],
  }
  saveTenantSettingsData(tenantId, data)
  return data
}
