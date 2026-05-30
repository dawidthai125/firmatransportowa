import {
  loadTachographDownloads,
  upsertTachographRemoteRecords,
} from '@/lib/domain/tachograph-store'
import type { TachographDownload } from '@/lib/domain/tachograph-types'
import { isSupabaseConfigured, supabaseAnonKey, supabaseFunctionsBase } from '@/config/supabase'
import { getSupabaseAccessToken } from '@/lib/auth/supabase-client'
import { readTenantData, writeTenantData } from '@/lib/tenant/storage'

export type TachographProvider = 'tacho_scan' | 'vdo_online' | 'telematics_fms'

export interface TachographConnectorConfig {
  tachoScanEnabled: boolean
  vdoOnlineEnabled: boolean
  telematicsFmsEnabled: boolean
  /** Demo / dev — produkcja: klucze w Supabase Secrets Edge */
  tachoScanApiKey?: string
  vdoFleetId?: string
  telematicsEndpoint?: string
  lastSyncByProvider: Partial<Record<TachographProvider, string>>
  lastSyncAt?: string
  lastSyncError?: string
}

const DEFAULT_CONNECTOR: TachographConnectorConfig = {
  tachoScanEnabled: false,
  vdoOnlineEnabled: false,
  telematicsFmsEnabled: false,
  lastSyncByProvider: {},
}

export function loadTachographConnectorConfig(tenantId: string): TachographConnectorConfig {
  const raw = readTenantData<Partial<TachographConnectorConfig>>(tenantId, 'tachograph-connectors', {})
  return { ...DEFAULT_CONNECTOR, ...raw, lastSyncByProvider: raw.lastSyncByProvider ?? {} }
}

export function saveTachographConnectorConfig(tenantId: string, cfg: TachographConnectorConfig): void {
  writeTenantData(tenantId, 'tachograph-connectors', cfg)
}

export interface TachographSyncResult {
  added: number
  updated: number
  syncedAt: string
  providers: TachographProvider[]
  error?: string
}

const CLOUD_FETCH_TIMEOUT_MS = 12_000

async function apiHeaders(): Promise<Record<string, string>> {
  const jwt = await getSupabaseAccessToken()
  const bearer = jwt ?? supabaseAnonKey
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${bearer}`,
    apikey: supabaseAnonKey,
  }
}

/** Demo lokalne — gdy brak Supabase */
function synthesizeLocalSync(tenantId: string): TachographSyncResult {
  const cfg = loadTachographConnectorConfig(tenantId)
  const now = new Date().toISOString()
  const today = now.slice(0, 10)
  const weekAgo = new Date(Date.now() - 86400000 * 7).toISOString().slice(0, 10)
  const suffix = Date.now().toString(36).slice(-4).toUpperCase()
  const records: Omit<TachographDownload, 'id' | 'tenantId' | 'importedAt'>[] = []

  if (cfg.tachoScanEnabled) {
    records.push({
      filename: `API_TachoScan_C_KOWALSKI_${weekAgo.replace(/-/g, '')}_${today.replace(/-/g, '')}.ddd`,
      source: 'remote_api',
      recordType: 'driver_card',
      driverName: 'Jan Kowalski',
      periodFrom: weekAgo,
      periodTo: today,
      sizeBytes: 0,
      drivingMinutes: 492,
      restMinutes: 660,
      lastSyncAt: now,
      externalId: `tacho-scan-${suffix}`,
      notes: 'Demo TachoScan API — pełne dekodowanie DDD w produkcji',
    })
    cfg.lastSyncByProvider.tacho_scan = now
  }

  if (cfg.vdoOnlineEnabled) {
    records.push({
      filename: `API_VDO_M_DW9ADR1_${weekAgo.replace(/-/g, '')}_${today.replace(/-/g, '')}.ddd`,
      source: 'remote_api',
      recordType: 'vehicle_unit',
      vehicleRegistration: 'DW 9ADR1',
      periodFrom: weekAgo,
      periodTo: today,
      sizeBytes: 0,
      drivingMinutes: 510,
      restMinutes: 600,
      lastSyncAt: now,
      externalId: `vdo-online-${suffix}`,
      notes: 'Demo VDO Fleet — zdalny download VU',
    })
    cfg.lastSyncByProvider.vdo_online = now
  }

  if (cfg.telematicsFmsEnabled) {
    records.push({
      filename: `FMS_telematics_${today.replace(/-/g, '')}.json`,
      source: 'telematics',
      recordType: 'unknown',
      driverName: 'Piotr Nowak',
      vehicleRegistration: 'DW 12345',
      periodFrom: weekAgo,
      periodTo: today,
      sizeBytes: 0,
      drivingMinutes: 465,
      restMinutes: 720,
      lastSyncAt: now,
      externalId: `telematics-fms-${suffix}`,
      notes: 'Demo telematyka — czasy jazdy z CAN/FMS (nie zastępuje DDD przy ITD)',
    })
    cfg.lastSyncByProvider.telematics_fms = now
  }

  const providers = (
    [
      cfg.tachoScanEnabled ? 'tacho_scan' : null,
      cfg.vdoOnlineEnabled ? 'vdo_online' : null,
      cfg.telematicsFmsEnabled ? 'telematics_fms' : null,
    ] as const
  ).filter(Boolean) as TachographProvider[]

  if (providers.length === 0) {
    return {
      added: 0,
      updated: 0,
      syncedAt: now,
      providers: [],
      error: 'Włącz co najmniej jednego dostawcę w Ustawieniach firmy',
    }
  }

  const { added, updated } = upsertTachographRemoteRecords(tenantId, records)
  cfg.lastSyncAt = now
  cfg.lastSyncError = undefined
  saveTachographConnectorConfig(tenantId, cfg)

  return { added, updated, syncedAt: now, providers }
}

/** Synchronizacja przez Edge Function (prod) lub lokalna symulacja (dev) */
export async function syncTachographConnectors(tenantId: string): Promise<TachographSyncResult> {
  const cfg = loadTachographConnectorConfig(tenantId)
  const anyEnabled = cfg.tachoScanEnabled || cfg.vdoOnlineEnabled || cfg.telematicsFmsEnabled

  if (!anyEnabled) {
    return {
      added: 0,
      updated: 0,
      syncedAt: new Date().toISOString(),
      providers: [],
      error: 'Włącz co najmniej jednego dostawcę tachografu w Ustawieniach firmy',
    }
  }

  if (!isSupabaseConfigured()) {
    return synthesizeLocalSync(tenantId)
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), CLOUD_FETCH_TIMEOUT_MS)

  try {
    const res = await fetch(`${supabaseFunctionsBase}/tachograph-sync`, {
      method: 'POST',
      headers: await apiHeaders(),
      body: JSON.stringify({ tenantId }),
      signal: controller.signal,
    })

    if (!res.ok) {
      const msg = `tachograph-sync ${res.status}`
      saveTachographConnectorConfig(tenantId, { ...cfg, lastSyncError: msg })
      return {
        added: 0,
        updated: 0,
        syncedAt: new Date().toISOString(),
        providers: [],
        error: msg,
      }
    }

    const json = (await res.json()) as {
      ok: boolean
      added?: number
      updated?: number
      syncedAt?: string
      providers?: TachographProvider[]
      records?: TachographDownload[]
      error?: string
    }

    if (json.records?.length) {
      upsertTachographRemoteRecords(tenantId, json.records)
    }

    const syncedAt = json.syncedAt ?? new Date().toISOString()
    saveTachographConnectorConfig(tenantId, {
      ...loadTachographConnectorConfig(tenantId),
      lastSyncAt: syncedAt,
      lastSyncError: json.error,
    })

    return {
      added: json.added ?? 0,
      updated: json.updated ?? 0,
      syncedAt,
      providers: json.providers ?? [],
      error: json.error,
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Sync error'
    saveTachographConnectorConfig(tenantId, { ...cfg, lastSyncError: msg })
    return {
      added: 0,
      updated: 0,
      syncedAt: new Date().toISOString(),
      providers: [],
      error: msg,
    }
  } finally {
    clearTimeout(timer)
  }
}

export function connectorStatusLabel(tenantId: string): string {
  const cfg = loadTachographConnectorConfig(tenantId)
  const enabled = [
    cfg.tachoScanEnabled && 'TachoScan',
    cfg.vdoOnlineEnabled && 'VDO',
    cfg.telematicsFmsEnabled && 'FMS',
  ].filter(Boolean)

  if (enabled.length === 0) return 'Brak połączenia — skonfiguruj w Ustawieniach firmy'
  if (cfg.lastSyncError) return `Błąd sync: ${cfg.lastSyncError}`
  if (cfg.lastSyncAt) {
    return `Połączono (${enabled.join(', ')}) · ostatni sync ${new Date(cfg.lastSyncAt).toLocaleString('pl-PL')}`
  }
  return `Skonfigurowano: ${enabled.join(', ')} · jeszcze nie synchronizowano`
}

export function countRemoteDownloads(tenantId: string): number {
  return loadTachographDownloads(tenantId).filter((r) => r.source !== 'manual_upload').length
}
