import type { DatedDocument } from '@/lib/domain/compliance'
import { isCompanyDeployment } from '@/config/branding'
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

export interface MechanicContact {
  id: string
  name: string
  phone: string
  email?: string
  workshop?: string
  active: boolean
  updatedAt?: string
}

/** Osoby uprawnione do weryfikacji zgłoszeń awarii (user id z auth) */
export interface RepairWorkflowSettings {
  /** Puste = właściciel + wszyscy dyspozytorzy */
  verifierUserIds: string[]
  defaultMechanicId?: string
}

export interface TenantSettingsData {
  companyDocuments: CompanyDocument[]
  mechanics: MechanicContact[]
  repairWorkflow: RepairWorkflowSettings
}

const DEFAULT_SETTINGS: TenantSettingsData = {
  companyDocuments: [],
  mechanics: [],
  repairWorkflow: { verifierUserIds: [] },
}

export const COMPANY_DOC_LABELS: Record<CompanyDocumentType, string> = {
  licencja_krajowa: 'Licencja krajowa',
  licencja_wspolnotowa: 'Licencja wspólnotowa (GITD)',
  zezwolenie_przewoznika: 'Zezwolenie przewoźnika',
  ckz: 'CKZ — certyfikat kompetencji',
  baza_eksploatacyjna: 'Baza eksploatacyjna',
}

export function loadTenantSettingsData(tenantId: string): TenantSettingsData {
  const raw = readTenantData<TenantSettingsData>(tenantId, 'settings', DEFAULT_SETTINGS)
  return {
    companyDocuments: raw.companyDocuments ?? [],
    mechanics: raw.mechanics ?? [],
    repairWorkflow: raw.repairWorkflow ?? { verifierUserIds: [] },
  }
}

export function saveTenantSettingsData(tenantId: string, data: TenantSettingsData): void {
  writeTenantData(tenantId, 'settings', data)
}

export function seedDemoCompanyDocuments(tenantId: string): TenantSettingsData {
  const existing = loadTenantSettingsData(tenantId)
  const needsMechanics = !existing.mechanics?.length
  const needsDocs = existing.companyDocuments.length === 0
  if (!needsMechanics && !needsDocs) return existing

  const data: TenantSettingsData = {
    companyDocuments: needsDocs
      ? [
          { type: 'licencja_wspolnotowa', label: 'Licencja wspólnotowa', expiresAt: '2030-06-01' },
          { type: 'ckz', label: 'CKZ — Jan Kowalski', expiresAt: '2028-03-15' },
          { type: 'zezwolenie_przewoznika', label: 'Zezwolenie przewoźnika', expiresAt: '2029-01-01' },
          { type: 'baza_eksploatacyjna', label: 'Zaświadczenie bazy', expiresAt: '2027-12-31' },
        ]
      : existing.companyDocuments,
    mechanics: needsMechanics
      ? [
          {
            id: 'mechanic-demo-001',
            name: 'Tomasz Mechanik',
            phone: '+48 600 500 600',
            email: isCompanyDeployment() ? 'mechanik@tajski-trans.pl' : 'mechanik@demo-trans.pl',
            workshop: 'Warsztat Trans Serwis, Wrocław',
            active: true,
          },
        ]
      : existing.mechanics,
    repairWorkflow: existing.repairWorkflow ?? {
      verifierUserIds: ['user-dispatcher-demo'],
      defaultMechanicId: 'mechanic-demo-001',
    },
  }
  saveTenantSettingsData(tenantId, data)
  return data
}

export function canVerifyRepairs(
  settings: TenantSettingsData,
  userId: string,
  role: 'owner' | 'dispatcher' | 'driver' | 'mechanic',
): boolean {
  if (role === 'owner') return true
  if (role !== 'dispatcher') return false
  const ids = settings.repairWorkflow?.verifierUserIds ?? []
  if (ids.length === 0) return true
  return ids.includes(userId)
}
