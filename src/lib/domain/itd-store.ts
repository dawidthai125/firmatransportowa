import { pushNotification } from '@/lib/automation/notifications-store'
import { defaultItdPlaybook } from '@/lib/domain/itd-playbook-default'
import type {
  ItdControlAlert,
  ItdControlRecord,
  ItdHotspot,
  ItdPlaybookSection,
  ItdTenantData,
} from '@/lib/domain/itd-types'
import { readTenantData, writeTenantData } from '@/lib/tenant/storage'

const EMPTY: ItdTenantData = {
  playbook: [],
  hotspots: [],
  alerts: [],
  records: [],
}

function loadItd(tenantId: string): ItdTenantData {
  return readTenantData(tenantId, 'itd', EMPTY)
}

function saveItd(tenantId: string, data: ItdTenantData): void {
  writeTenantData(tenantId, 'itd', data)
}

const CURATED_HOTSPOTS: Omit<ItdHotspot, 'id' | 'reportedAt'>[] = [
  {
    type: 'weigh_station',
    name: 'WIM A2 — Świecko / granica DE',
    lat: 52.32,
    lng: 14.59,
    road: 'A2',
    activity: 'high',
    source: 'curated',
    notes: 'Częste ważenia i kontrole międzynarodowe',
  },
  {
    type: 'roadside',
    name: 'A1 — Piotrków Trybunalski (MOP)',
    lat: 51.41,
    lng: 19.68,
    road: 'A1',
    activity: 'medium',
    source: 'curated',
  },
  {
    type: 'weigh_station',
    name: 'Waga A4 — Balice / Kraków',
    lat: 50.08,
    lng: 19.78,
    road: 'A4',
    activity: 'medium',
    source: 'curated',
  },
  {
    type: 'border',
    name: 'DK17 — Dorohusk / UA',
    lat: 51.06,
    lng: 23.79,
    road: 'DK17',
    activity: 'high',
    source: 'curated',
    notes: 'Kontrole dokumentów przewozowych i RMPD',
  },
  {
    type: 'roadside',
    name: 'S8 — Wrocław Południe',
    lat: 51.03,
    lng: 17.02,
    road: 'S8',
    activity: 'medium',
    source: 'curated',
  },
  {
    type: 'parking',
    name: 'MOP A2 — Kłodzko Wschód',
    lat: 50.45,
    lng: 16.65,
    road: 'A2',
    activity: 'low',
    source: 'curated',
  },
  {
    type: 'weigh_station',
    name: 'WIM A1 — Toruń Południe',
    lat: 53.01,
    lng: 18.58,
    road: 'A1',
    activity: 'medium',
    source: 'curated',
  },
]

export function seedItdData(tenantId: string): ItdTenantData {
  const existing = loadItd(tenantId)
  const now = new Date().toISOString()
  let changed = false

  if (existing.playbook.length === 0) {
    existing.playbook = defaultItdPlaybook()
    changed = true
  }

  if (existing.hotspots.filter((h) => h.source === 'curated').length === 0) {
    existing.hotspots = [
      ...existing.hotspots,
      ...CURATED_HOTSPOTS.map((h, i) => ({
        ...h,
        id: `itd-hs-cur-${i}`,
        reportedAt: now,
      })),
    ]
    changed = true
  }

  if (changed) saveItd(tenantId, existing)
  return existing
}

export function loadItdPlaybook(tenantId: string): ItdPlaybookSection[] {
  return seedItdData(tenantId).playbook.sort((a, b) => a.order - b.order)
}

export function saveItdPlaybook(tenantId: string, playbook: ItdPlaybookSection[]): void {
  const data = seedItdData(tenantId)
  saveItd(tenantId, { ...data, playbook })
}

export function loadItdHotspots(tenantId: string): ItdHotspot[] {
  const now = Date.now()
  return seedItdData(tenantId).hotspots.filter((h) => {
    if (!h.expiresAt) return true
    return new Date(h.expiresAt).getTime() > now
  })
}

export function reportItdHotspot(
  tenantId: string,
  patch: Omit<ItdHotspot, 'id' | 'reportedAt' | 'source' | 'activity' | 'type'> & {
    source: 'driver_report' | 'dispatcher_report'
  },
): ItdHotspot {
  const data = seedItdData(tenantId)
  const expires = new Date(Date.now() + 4 * 3600_000).toISOString()
  const hotspot: ItdHotspot = {
    ...patch,
    id: crypto.randomUUID(),
    reportedAt: new Date().toISOString(),
    activity: 'high',
    type: 'reported_live',
    expiresAt: expires,
  }
  saveItd(tenantId, { ...data, hotspots: [hotspot, ...data.hotspots] })
  return hotspot
}

export function loadItdAlerts(tenantId: string): ItdControlAlert[] {
  return seedItdData(tenantId).alerts.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}

export function activeItdAlerts(tenantId: string): ItdControlAlert[] {
  return loadItdAlerts(tenantId).filter((a) => a.status === 'active')
}

export function submitItdControlAlert(
  tenantId: string,
  alert: Omit<ItdControlAlert, 'id' | 'createdAt' | 'status'>,
): ItdControlAlert {
  const data = seedItdData(tenantId)
  const item: ItdControlAlert = {
    ...alert,
    id: crypto.randomUUID(),
    status: 'active',
    createdAt: new Date().toISOString(),
  }
  saveItd(tenantId, { ...data, alerts: [item, ...data.alerts] })

  pushNotification(tenantId, {
    tenantId,
    title: 'Kontrola ITD — alert kierowcy',
    message: `${alert.driverName} · ${alert.locationLabel}${alert.road ? ` (${alert.road})` : ''}`,
    level: 'error',
    actionView: 'itd',
  })

  if (alert.lat != null && alert.lng != null) {
    reportItdHotspot(tenantId, {
      name: `Kontrola: ${alert.driverName}`,
      lat: alert.lat,
      lng: alert.lng,
      road: alert.road,
      notes: alert.message,
      source: 'driver_report',
    })
  }

  return item
}

export function acknowledgeItdAlert(
  tenantId: string,
  alertId: string,
  byUser: string,
): void {
  const data = seedItdData(tenantId)
  saveItd(tenantId, {
    ...data,
    alerts: data.alerts.map((a) =>
      a.id === alertId
        ? {
            ...a,
            status: 'acknowledged',
            acknowledgedAt: new Date().toISOString(),
            acknowledgedBy: byUser,
          }
        : a,
    ),
  })
}

export function loadItdRecords(tenantId: string): ItdControlRecord[] {
  return seedItdData(tenantId).records.sort(
    (a, b) => new Date(b.controlDate).getTime() - new Date(a.controlDate).getTime(),
  )
}

export function addItdControlRecord(
  tenantId: string,
  record: Omit<ItdControlRecord, 'id' | 'createdAt'>,
): ItdControlRecord {
  const data = seedItdData(tenantId)
  const item: ItdControlRecord = {
    ...record,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  }
  const alerts = record.alertId
    ? data.alerts.map((a) =>
        a.id === record.alertId ? { ...a, status: 'resolved' as const } : a,
      )
    : data.alerts
  saveItd(tenantId, { ...data, records: [item, ...data.records], alerts })
  return item
}

export function updatePlaybookSection(
  tenantId: string,
  sectionId: string,
  patch: Partial<Pick<ItdPlaybookSection, 'title' | 'items'>>,
  /** Dyspozytor może edytować tylko sekcje company */
  role: 'owner' | 'dispatcher',
): boolean {
  const data = seedItdData(tenantId)
  const section = data.playbook.find((s) => s.id === sectionId)
  if (!section) return false
  if (role === 'dispatcher' && section.kind !== 'company') return false

  const playbook = data.playbook.map((s) =>
    s.id === sectionId ? { ...s, ...patch } : s,
  )
  saveItd(tenantId, { ...data, playbook })
  return true
}
