/** Punkt kontroli ITD / częste lokalizacje inspekcji */
export type ItdHotspotType =
  | 'weigh_station'
  | 'roadside'
  | 'border'
  | 'parking'
  | 'reported_live'

export interface ItdHotspot {
  id: string
  type: ItdHotspotType
  name: string
  lat: number
  lng: number
  road?: string
  activity: 'low' | 'medium' | 'high'
  source: 'curated' | 'driver_report' | 'dispatcher_report'
  reportedAt: string
  notes?: string
  expiresAt?: string
  /** Moderacja zgłoszeń kierowcy/dyspozytora */
  moderation?: 'pending' | 'confirmed' | 'dismissed'
  reportedBy?: string
}

export type ItdPlaybookSectionKind = 'legal' | 'company' | 'checklist'

export interface ItdPlaybookSection {
  id: string
  kind: ItdPlaybookSectionKind
  title: string
  items: string[]
  order: number
}

export type ItdAlertStatus = 'active' | 'acknowledged' | 'resolved'

export interface ItdControlAlert {
  id: string
  tenantId: string
  driverName: string
  vehicleRegistration?: string
  locationLabel: string
  lat?: number
  lng?: number
  road?: string
  status: ItdAlertStatus
  message?: string
  createdAt: string
  acknowledgedAt?: string
  acknowledgedBy?: string
}

export type ItdControlOutcome = 'clean' | 'warning' | 'fine' | 'vehicle_detained'

export interface ItdControlRecord {
  id: string
  tenantId: string
  driverName: string
  vehicleRegistration: string
  controlDate: string
  locationLabel: string
  outcome: ItdControlOutcome
  finePln?: number
  protocolNumber?: string
  notes?: string
  attachmentName?: string
  attachmentFileId?: string
  alertId?: string
  createdAt: string
}

export interface ItdTenantData {
  playbook: ItdPlaybookSection[]
  hotspots: ItdHotspot[]
  alerts: ItdControlAlert[]
  records: ItdControlRecord[]
}

export const ITD_HOTSPOT_TYPE_LABELS: Record<ItdHotspotType, string> = {
  weigh_station: 'Waga / WIM',
  roadside: 'Kontrola drogowa',
  border: 'Granica / checkpoint',
  parking: 'Parking / MOP',
  reported_live: 'Zgłoszenie na żywo',
}

export const ITD_OUTCOME_LABELS: Record<ItdControlOutcome, string> = {
  clean: 'Bez uwag',
  warning: 'Upomnienie / pouczenie',
  fine: 'Mandat / kara',
  vehicle_detained: 'Zatrzymanie pojazdu',
}
