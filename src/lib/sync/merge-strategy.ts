import type { AutomationRule, AutomationSettings } from '@/lib/automation/rules'
import type { FreightConnectorConfig } from '@/lib/domain/freight-connectors'
import type { FleetTelematicsConnectorConfig } from '@/lib/domain/fleet-telematics-connectors'
import type { InvoicingConfig } from '@/lib/domain/invoicing-config'
import type { TachographConnectorConfig } from '@/lib/domain/tachograph-connectors'
import type { RepairReport } from '@/lib/domain/repair-report'
import type { FreightSearchPreferences } from '@/lib/domain/freight-preferences'
import type { ItdPlaybookSection, ItdTenantData } from '@/lib/domain/itd-types'
import type { TenantSettingsData } from '@/lib/domain/tenant-settings'
import { COMPANY_BRANDING, isCompanyDeployment } from '@/config/branding'
import { TENANT_DATA_KEYS, type Tenant, type TenantDataKey } from '@/lib/tenant/types'
import {
  applyTombstones,
  mergeEnvelopeTombstones,
  wrapMergedEnvelope,
} from '@/lib/sync/tombstone'
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
  'fleet-positions',
  'freight-offers',
  'tachograph',
  'course-messages',
  'driver-payroll-rates',
]

type Identifiable = { id: string; updatedAt?: string; importedAt?: string; createdAt?: string }

export function mergeRecordsByNewest<T extends Identifiable>(
  ...groups: (T[] | { records: T[]; tombstones?: Record<string, string> })[]
): T[] {
  const map = new Map<string, T>()
  let tombstones: Record<string, string> = {}

  for (const group of groups) {
    const records = Array.isArray(group) ? group : group.records
    if (!Array.isArray(group)) {
      tombstones = { ...tombstones, ...(group.tombstones ?? {}) }
    }
    for (const item of records) {
      const prev = map.get(item.id)
      if (!prev || recordTimestamp(item) >= recordTimestamp(prev)) {
        map.set(item.id, item)
      }
    }
  }
  return applyTombstones([...map.values()], tombstones)
}

function mergeAutomationSettings(
  local: AutomationSettings,
  cloud: AutomationSettings,
  localAt: string,
  cloudAt: string,
): AutomationSettings {
  const preferLocal = Date.parse(localAt) >= Date.parse(cloudAt)
  const localSafe: AutomationSettings = { ...local, rules: local.rules ?? [] }
  const cloudSafe: AutomationSettings = { ...cloud, rules: cloud.rules ?? [] }
  const first = preferLocal ? localSafe : cloudSafe
  const second = preferLocal ? cloudSafe : localSafe
  const rulesMap = new Map<string, AutomationRule>()
  for (const r of first.rules) rulesMap.set(r.id, r)
  for (const r of second.rules) rulesMap.set(r.id, r)
  return {
    rules: [...rulesMap.values()],
    lastDailyRun: preferLocal
      ? localSafe.lastDailyRun
      : maxIso(localSafe.lastDailyRun, cloudSafe.lastDailyRun),
    lastWeeklyRun: preferLocal
      ? localSafe.lastWeeklyRun
      : maxIso(localSafe.lastWeeklyRun, cloudSafe.lastWeeklyRun),
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
  const localPwa = local.pwaBranding ?? {}
  const cloudPwa = cloud.pwaBranding ?? {}
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
    operationsContact: local.operationsContact ?? cloud.operationsContact,
    pwaBranding: {
      appName: localPwa.appName?.trim() || cloudPwa.appName?.trim(),
      shortName: localPwa.shortName?.trim() || cloudPwa.shortName?.trim(),
    },
  }
}

/** Scal zgłoszenia awarii — LWW + łączenie pól opisu naprawy z obu stron */
function mergeRepairReportRecord(local: RepairReport, cloud: RepairReport): RepairReport {
  const preferLocal = recordTimestamp(local) >= recordTimestamp(cloud)
  const base = preferLocal ? local : cloud
  const other = preferLocal ? cloud : local
  return {
    ...base,
    diagnosis: base.diagnosis?.trim() || other.diagnosis,
    partsReplaced: base.partsReplaced?.trim() || other.partsReplaced,
    repairSummary: base.repairSummary?.trim() || other.repairSummary,
    repairCostPln: base.repairCostPln ?? other.repairCostPln,
    mechanicNotes: base.mechanicNotes?.trim() || other.mechanicNotes,
    mechanicMessage: base.mechanicMessage?.trim() || other.mechanicMessage,
    scheduledRepairAt: maxIso(base.scheduledRepairAt, other.scheduledRepairAt) || base.scheduledRepairAt || other.scheduledRepairAt,
    completedAt: maxIso(base.completedAt, other.completedAt) || base.completedAt || other.completedAt,
    updatedAt: maxIso(local.updatedAt, cloud.updatedAt),
  }
}

function mergeRepairReports(
  local: RepairReport[],
  cloud: RepairReport[],
  localTombstones?: Record<string, string>,
  cloudTombstones?: Record<string, string>,
): RepairReport[] {
  const map = new Map<string, RepairReport>()
  let tombstones: Record<string, string> = { ...(cloudTombstones ?? {}), ...(localTombstones ?? {}) }

  for (const item of cloud) {
    map.set(item.id, item)
  }
  for (const item of local) {
    const prev = map.get(item.id)
    map.set(item.id, prev ? mergeRepairReportRecord(item, prev) : item)
  }
  return applyTombstones([...map.values()], tombstones)
}

function applyCompanyTenantBranding(t: Tenant): Tenant {
  if (!isCompanyDeployment() || t.id !== 'tenant-demo-001') return t
  return { ...t, name: COMPANY_BRANDING.name, slug: COMPANY_BRANDING.slug }
}

function mergeTenants(local: Tenant[], cloud: Tenant[]): Tenant[] {
  return mergeRecordsByNewest(
    local.map((t) => ({ ...t, updatedAt: t.updatedAt ?? t.createdAt })),
    cloud.map((t) => ({ ...t, updatedAt: t.updatedAt ?? t.createdAt })),
  ).map(applyCompanyTenantBranding) as Tenant[]
}

function mergePlaybookSections(
  local: ItdPlaybookSection[],
  cloud: ItdPlaybookSection[],
): ItdPlaybookSection[] {
  const map = new Map<string, ItdPlaybookSection>()
  for (const s of cloud) map.set(s.id, s)
  for (const s of local) map.set(s.id, s)
  return [...map.values()].sort((a, b) => a.order - b.order)
}

function mergeItdData(local: ItdTenantData, cloud: ItdTenantData): ItdTenantData {
  const empty: ItdTenantData = { playbook: [], hotspots: [], alerts: [], records: [] }
  const l = local ?? empty
  const c = cloud ?? empty

  return {
    playbook: mergePlaybookSections(l.playbook, c.playbook),
    hotspots: mergeRecordsByNewest(
      l.hotspots.map((h) => ({ ...h, updatedAt: h.reportedAt })),
      c.hotspots.map((h) => ({ ...h, updatedAt: h.reportedAt })),
    ).map(({ updatedAt: _updatedAt, ...h }) => h),
    alerts: mergeRecordsByNewest(
      l.alerts.map((a) => ({ ...a, updatedAt: a.acknowledgedAt ?? a.createdAt })),
      c.alerts.map((a) => ({ ...a, updatedAt: a.acknowledgedAt ?? a.createdAt })),
    ).map(({ updatedAt: _updatedAt, ...a }) => a),
    records: mergeRecordsByNewest(
      l.records.map((r) => ({ ...r, updatedAt: r.createdAt })),
      c.records.map((r) => ({ ...r, updatedAt: r.createdAt })),
    ).map(({ updatedAt: _updatedAt, ...r }) => r),
  }
}

function mergeFreightPreferences(
  local: Partial<FreightSearchPreferences>,
  cloud: Partial<FreightSearchPreferences>,
  localAt: string,
  cloudAt: string,
): Partial<FreightSearchPreferences> {
  const preferLocal = Date.parse(localAt) >= Date.parse(cloudAt)
  const newer = preferLocal ? local : cloud
  const older = preferLocal ? cloud : local
  return {
    ...older,
    ...newer,
    savedOfferIds: [
      ...new Set([...(older.savedOfferIds ?? []), ...(newer.savedOfferIds ?? [])]),
    ],
    updatedAt: maxIso(maxIso(local.updatedAt, cloud.updatedAt), maxIso(localAt, cloudAt)),
  }
}

function mergeFreightConnectors(
  local: Partial<FreightConnectorConfig>,
  cloud: Partial<FreightConnectorConfig>,
  localAt: string,
  cloudAt: string,
): FreightConnectorConfig {
  const preferLocal = Date.parse(localAt) >= Date.parse(cloudAt)
  const newer = preferLocal ? local : cloud
  const older = preferLocal ? cloud : local
  const lastSync: Partial<Record<string, string>> = {
    ...(older.lastSyncBySource ?? {}),
    ...(newer.lastSyncBySource ?? {}),
  }
  for (const key of Object.keys({ ...older.lastSyncBySource, ...newer.lastSyncBySource })) {
    const l = local.lastSyncBySource?.[key as keyof typeof local.lastSyncBySource]
    const c = cloud.lastSyncBySource?.[key as keyof typeof cloud.lastSyncBySource]
    if (l || c) lastSync[key] = maxIso(l, c)
  }
  return {
    transEuEnabled: newer.transEuEnabled ?? older.transEuEnabled ?? true,
    timocomEnabled: newer.timocomEnabled ?? older.timocomEnabled ?? true,
    telerouteEnabled: newer.telerouteEnabled ?? older.telerouteEnabled ?? true,
    cargo123Enabled: newer.cargo123Enabled ?? older.cargo123Enabled ?? true,
    transporeonEnabled: newer.transporeonEnabled ?? older.transporeonEnabled ?? true,
    wtransnetEnabled: newer.wtransnetEnabled ?? older.wtransnetEnabled ?? true,
    b2pwebEnabled: newer.b2pwebEnabled ?? older.b2pwebEnabled ?? true,
    freightlinkEnabled: newer.freightlinkEnabled ?? older.freightlinkEnabled ?? true,
    lastSyncBySource: lastSync as FreightConnectorConfig['lastSyncBySource'],
  }
}

function mergeFleetTelematicsConnectors(
  local: Partial<FleetTelematicsConnectorConfig>,
  cloud: Partial<FleetTelematicsConnectorConfig>,
  localAt: string,
  cloudAt: string,
): FleetTelematicsConnectorConfig {
  const preferLocal = Date.parse(localAt) >= Date.parse(cloudAt)
  const newer = preferLocal ? local : cloud
  const older = preferLocal ? cloud : local
  const lastSync: Partial<Record<string, string>> = {
    ...(older.lastSyncByProvider ?? {}),
    ...(newer.lastSyncByProvider ?? {}),
  }
  for (const key of Object.keys({ ...older.lastSyncByProvider, ...newer.lastSyncByProvider })) {
    const l = local.lastSyncByProvider?.[key as keyof typeof local.lastSyncByProvider]
    const c = cloud.lastSyncByProvider?.[key as keyof typeof cloud.lastSyncByProvider]
    if (l || c) lastSync[key] = maxIso(l, c)
  }
  return {
    webfleetEnabled: newer.webfleetEnabled ?? older.webfleetEnabled ?? false,
    transicsEnabled: newer.transicsEnabled ?? older.transicsEnabled ?? false,
    genericEnabled: newer.genericEnabled ?? older.genericEnabled ?? false,
    webfleetAccount: newer.webfleetAccount ?? older.webfleetAccount,
    webfleetApiKey: newer.webfleetApiKey ?? older.webfleetApiKey,
    transicsFleetId: newer.transicsFleetId ?? older.transicsFleetId,
    genericWebhookUrl: newer.genericWebhookUrl ?? older.genericWebhookUrl,
    lastSyncByProvider: lastSync as FleetTelematicsConnectorConfig['lastSyncByProvider'],
    lastSyncAt: maxIso(local.lastSyncAt, cloud.lastSyncAt),
    lastSyncError: preferLocal ? local.lastSyncError : cloud.lastSyncError ?? local.lastSyncError,
  }
}

function mergeTachographConnectors(
  local: Partial<TachographConnectorConfig>,
  cloud: Partial<TachographConnectorConfig>,
  localAt: string,
  cloudAt: string,
): TachographConnectorConfig {
  const preferLocal = Date.parse(localAt) >= Date.parse(cloudAt)
  const newer = preferLocal ? local : cloud
  const older = preferLocal ? cloud : local
  const lastSync: Partial<Record<string, string>> = {
    ...(older.lastSyncByProvider ?? {}),
    ...(newer.lastSyncByProvider ?? {}),
  }
  for (const key of Object.keys({ ...older.lastSyncByProvider, ...newer.lastSyncByProvider })) {
    const l = local.lastSyncByProvider?.[key as keyof typeof local.lastSyncByProvider]
    const c = cloud.lastSyncByProvider?.[key as keyof typeof cloud.lastSyncByProvider]
    if (l || c) lastSync[key] = maxIso(l, c)
  }
  return {
    tachoScanEnabled: newer.tachoScanEnabled ?? older.tachoScanEnabled ?? false,
    vdoOnlineEnabled: newer.vdoOnlineEnabled ?? older.vdoOnlineEnabled ?? false,
    telematicsFmsEnabled: newer.telematicsFmsEnabled ?? older.telematicsFmsEnabled ?? false,
    tachoScanApiKey: newer.tachoScanApiKey ?? older.tachoScanApiKey,
    vdoFleetId: newer.vdoFleetId ?? older.vdoFleetId,
    telematicsEndpoint: newer.telematicsEndpoint ?? older.telematicsEndpoint,
    lastSyncByProvider: lastSync as TachographConnectorConfig['lastSyncByProvider'],
    lastSyncAt: maxIso(local.lastSyncAt, cloud.lastSyncAt),
    lastSyncError: preferLocal ? local.lastSyncError : cloud.lastSyncError ?? local.lastSyncError,
  }
}

function mergePayload(
  dataKey: TenantDataKey | 'registry',
  local: unknown,
  cloud: unknown,
  localTombstones?: Record<string, string>,
  cloudTombstones?: Record<string, string>,
): unknown {
  if (dataKey === 'registry') {
    const l = Array.isArray(local) ? (local as Tenant[]) : []
    const c = Array.isArray(cloud) ? (cloud as Tenant[]) : []
    return mergeTenants(l, c)
  }

  if (RECORD_ARRAY_KEYS.includes(dataKey)) {
    const l = Array.isArray(local) ? local : []
    const c = Array.isArray(cloud) ? cloud : []
    return mergeRecordsByNewest(
      { records: l as Identifiable[], tombstones: localTombstones },
      { records: c as Identifiable[], tombstones: cloudTombstones },
    )
  }

  if (dataKey === 'settings') {
    const empty: TenantSettingsData = { companyDocuments: [], mechanics: [], repairWorkflow: { verifierUserIds: [] } }
    return mergeTenantSettings(
      (local as TenantSettingsData) ?? empty,
      (cloud as TenantSettingsData) ?? empty,
    )
  }

  if (dataKey === 'itd') {
    const empty: ItdTenantData = { playbook: [], hotspots: [], alerts: [], records: [] }
    return mergeItdData(
      (local as ItdTenantData) ?? empty,
      (cloud as ItdTenantData) ?? empty,
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

  if (dataKey === 'freight-board') {
    const payload = mergeFreightPreferences(
      localEnv.payload as Partial<FreightSearchPreferences>,
      cloudEnv.payload as Partial<FreightSearchPreferences>,
      localEnv.updatedAt,
      cloudEnv.updatedAt,
    )
    return wrapForSync(payload, maxIso(localEnv.updatedAt, cloudEnv.updatedAt))
  }

  if (dataKey === 'freight-connectors') {
    const payload = mergeFreightConnectors(
      localEnv.payload as Partial<FreightConnectorConfig>,
      cloudEnv.payload as Partial<FreightConnectorConfig>,
      localEnv.updatedAt,
      cloudEnv.updatedAt,
    )
    return wrapForSync(payload, maxIso(localEnv.updatedAt, cloudEnv.updatedAt))
  }

  if (dataKey === 'fleet-telematics-connectors') {
    const payload = mergeFleetTelematicsConnectors(
      localEnv.payload as Partial<FleetTelematicsConnectorConfig>,
      cloudEnv.payload as Partial<FleetTelematicsConnectorConfig>,
      localEnv.updatedAt,
      cloudEnv.updatedAt,
    )
    return wrapForSync(payload, maxIso(localEnv.updatedAt, cloudEnv.updatedAt))
  }

  if (dataKey === 'tachograph-connectors') {
    const payload = mergeTachographConnectors(
      localEnv.payload as Partial<TachographConnectorConfig>,
      cloudEnv.payload as Partial<TachographConnectorConfig>,
      localEnv.updatedAt,
      cloudEnv.updatedAt,
    )
    return wrapForSync(payload, maxIso(localEnv.updatedAt, cloudEnv.updatedAt))
  }

  if (dataKey === 'invoicing-config') {
    const preferLocal = Date.parse(localEnv.updatedAt) >= Date.parse(cloudEnv.updatedAt)
    const newer = preferLocal ? localEnv.payload : cloudEnv.payload
    const older = preferLocal ? cloudEnv.payload : localEnv.payload
    const payload: InvoicingConfig = {
      provider: 'csv',
      defaultPaymentDays: 14,
      ...(older as Partial<InvoicingConfig>),
      ...(newer as Partial<InvoicingConfig>),
    }
    return wrapForSync(payload, maxIso(localEnv.updatedAt, cloudEnv.updatedAt))
  }

  if (dataKey === 'repair-reports') {
    const l = Array.isArray(localEnv.payload) ? (localEnv.payload as RepairReport[]) : []
    const c = Array.isArray(cloudEnv.payload) ? (cloudEnv.payload as RepairReport[]) : []
    const payload = mergeRepairReports(l, c, localEnv.tombstones, cloudEnv.tombstones)
    const tombstones = mergeEnvelopeTombstones(localEnv, cloudEnv)
    return wrapMergedEnvelope(payload, maxIso(localEnv.updatedAt, cloudEnv.updatedAt), tombstones)
  }

  const payload = mergePayload(
    dataKey,
    localEnv.payload,
    cloudEnv.payload,
    localEnv.tombstones,
    cloudEnv.tombstones,
  )
  const tombstones = mergeEnvelopeTombstones(localEnv, cloudEnv)
  return wrapMergedEnvelope(payload, maxIso(localEnv.updatedAt, cloudEnv.updatedAt), tombstones)
}

/** Rozpoznaj klucz storage — wszystkie TENANT_DATA_KEYS (unikamy ślepego nadpisywania chmury). */
export function parseTenantStorageKey(
  storageKey: string,
): { dataKey: TenantDataKey | 'registry'; tenantId: string | null } | null {
  if (storageKey === 'ft-tenants-registry') {
    return { dataKey: 'registry', tenantId: null }
  }
  if (!storageKey.startsWith('ft-')) return null

  for (const dk of TENANT_DATA_KEYS) {
    const suffix = `-${dk}`
    if (storageKey.endsWith(suffix)) {
      const tenantId = storageKey.slice(3, storageKey.length - suffix.length)
      if (tenantId.length > 0) return { dataKey: dk, tenantId }
    }
  }
  return null
}
