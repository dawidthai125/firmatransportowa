import type { AutomationRule, AutomationSettings } from '@/lib/automation/rules'
import type { TenantSettingsData } from '@/lib/domain/tenant-settings'
import type { Tenant, TenantDataKey } from '@/lib/tenant/types'
import {
  maxIso,
  normalizeToEnvelope,
  recordTimestamp,
  type SyncEnvelope,
  wrapForSync,
} from '@/lib/sync/sync-envelope'

/** Klucze z rekordami posiadającymi id — merge per rekord (najnowszy updatedAt wygrywa) */
export const RECORD_ARRAY_KEYS: TenantDataKey[] = [
  'drivers',
  'vehicles',
  'courses',
  'daily-reports',
  'repair-reports',
  'files',
]

type Identifiable = { id: string; updatedAt?: string; importedAt?: string; createdAt?: string }

export function mergeRecordsByNewest<T extends Identifiable>(...groups: T[][]): T[] {
  const map = new Map<string, T>()
  for (const group of groups) {
    for (const item of group) {
      const prev = map.get(item.id)
      if (!prev || recordTimestamp(item) >= recordTimestamp(prev)) {
        map.set(item.id, item)
      }
    }
  }
  return [...map.values()]
}

function mergeAutomationSettings(
  local: AutomationSettings,
  cloud: AutomationSettings,
  localAt: string,
  cloudAt: string,
): AutomationSettings {
  const preferLocal = Date.parse(localAt) >= Date.parse(cloudAt)
  const first = preferLocal ? local : cloud
  const second = preferLocal ? cloud : local
  const rulesMap = new Map<string, AutomationRule>()
  for (const r of first.rules) rulesMap.set(r.id, r)
  for (const r of second.rules) rulesMap.set(r.id, r)
  return {
    rules: [...rulesMap.values()],
    lastDailyRun: maxIso(local.lastDailyRun, cloud.lastDailyRun),
    lastWeeklyRun: maxIso(local.lastWeeklyRun, cloud.lastWeeklyRun),
  }
}

function mergeCompanyDocuments(
  local: TenantSettingsData['companyDocuments'],
  cloud: TenantSettingsData['companyDocuments'],
) {
  const key = (d: { type: string; label: string }) => `${d.type}::${d.label}`
  const map = new Map<string, (typeof local)[0]>()
  for (const d of cloud) map.set(key(d), d)
  for (const d of local) map.set(key(d), d)
  return [...map.values()]
}

function mergeTenantSettings(local: TenantSettingsData, cloud: TenantSettingsData): TenantSettingsData {
  return {
    companyDocuments: mergeCompanyDocuments(local.companyDocuments, cloud.companyDocuments),
    mechanics: mergeRecordsByNewest(local.mechanics, cloud.mechanics).map((m) => ({
      id: m.id,
      name: m.name,
      phone: m.phone,
      email: m.email,
      workshop: m.workshop,
      active: m.active,
      updatedAt: m.updatedAt,
    })),
    repairWorkflow: {
      verifierUserIds: [
        ...new Set([
          ...(local.repairWorkflow?.verifierUserIds ?? []),
          ...(cloud.repairWorkflow?.verifierUserIds ?? []),
        ]),
      ],
      defaultMechanicId:
        local.repairWorkflow?.defaultMechanicId ?? cloud.repairWorkflow?.defaultMechanicId,
    },
  }
}

function mergeTenants(local: Tenant[], cloud: Tenant[]): Tenant[] {
  return mergeRecordsByNewest(
    local.map((t) => ({ ...t, updatedAt: t.createdAt })),
    cloud.map((t) => ({ ...t, updatedAt: t.createdAt })),
  ).map(({ updatedAt: _u, ...t }) => t as Tenant)
}

function mergePayload(dataKey: TenantDataKey | 'registry', local: unknown, cloud: unknown): unknown {
  if (dataKey === 'registry') {
    const l = Array.isArray(local) ? (local as Tenant[]) : []
    const c = Array.isArray(cloud) ? (cloud as Tenant[]) : []
    return mergeTenants(l, c)
  }

  if (RECORD_ARRAY_KEYS.includes(dataKey)) {
    const l = Array.isArray(local) ? local : []
    const c = Array.isArray(cloud) ? cloud : []
    return mergeRecordsByNewest(l as Identifiable[], c as Identifiable[])
  }

  if (dataKey === 'settings') {
    const empty: TenantSettingsData = { companyDocuments: [], mechanics: [], repairWorkflow: { verifierUserIds: [] } }
    return mergeTenantSettings(
      (local as TenantSettingsData) ?? empty,
      (cloud as TenantSettingsData) ?? empty,
    )
  }

  if (dataKey === 'automation') {
    const empty: AutomationSettings = { rules: [] }
    return mergeAutomationSettings(
      (local as AutomationSettings) ?? empty,
      (cloud as AutomationSettings) ?? empty,
      '1970-01-01T00:00:00.000Z',
      '1970-01-01T00:00:00.000Z',
    )
  }

  // compliance-alerts i inne — bezpieczny fallback: scal tablice po id, inaczej nowszy blob
  if (Array.isArray(local) && Array.isArray(cloud)) {
    return mergeRecordsByNewest(local as Identifiable[], cloud as Identifiable[])
  }

  return local ?? cloud
}

/** Scal dwa wpisy (local + cloud) — wynik zawiera najświeższe rekordy */
export function mergeSyncEnvelopes(
  dataKey: TenantDataKey | 'registry',
  localRaw: unknown,
  cloudRaw: unknown,
  localFallback: unknown = null,
): SyncEnvelope {
  const localEnv = normalizeToEnvelope(localRaw, localFallback)
  const cloudEnv = normalizeToEnvelope(cloudRaw, localFallback)

  if (dataKey === 'automation') {
    const payload = mergeAutomationSettings(
      localEnv.payload as AutomationSettings,
      cloudEnv.payload as AutomationSettings,
      localEnv.updatedAt,
      cloudEnv.updatedAt,
    )
    return wrapForSync(payload, maxIso(localEnv.updatedAt, cloudEnv.updatedAt))
  }

  const payload = mergePayload(dataKey, localEnv.payload, cloudEnv.payload)
  return wrapForSync(payload, maxIso(localEnv.updatedAt, cloudEnv.updatedAt))
}

export function parseTenantStorageKey(
  storageKey: string,
): { dataKey: TenantDataKey | 'registry'; tenantId: string | null } | null {
  if (storageKey === 'ft-tenants-registry') {
    return { dataKey: 'registry', tenantId: null }
  }
  const prefixes = [
    'drivers',
    'vehicles',
    'courses',
    'daily-reports',
    'compliance-alerts',
    'settings',
    'files',
    'automation',
    'repair-reports',
  ] as const
  for (const dk of prefixes) {
    const suffix = `-${dk}`
    if (storageKey.startsWith('ft-') && storageKey.endsWith(suffix)) {
      return {
        dataKey: dk,
        tenantId: storageKey.slice(3, storageKey.length - suffix.length),
      }
    }
  }
  return null
}
