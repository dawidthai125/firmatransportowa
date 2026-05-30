import { isSupabaseConfigured, supabaseAnonKey, supabaseFunctionsBase } from '@/config/supabase'
import { loadCourses, seedDemoCourses } from '@/lib/domain/courses-store'
import type { FleetPosition } from '@/lib/domain/fleet-position'
import { upsertFleetTelematicsPositions } from '@/lib/domain/fleet-positions-store'
import { loadVehicles, seedDemoVehicles } from '@/lib/domain/vehicles-store'
import { getSupabaseAccessToken } from '@/lib/auth/supabase-client'
import { readTenantData, writeTenantData } from '@/lib/tenant/storage'

export type FleetTelematicsProvider = import('@/lib/domain/fleet-position').TelematicsProvider

export interface FleetTelematicsConnectorConfig {
  webfleetEnabled: boolean
  transicsEnabled: boolean
  genericEnabled: boolean
  webfleetAccount?: string
  webfleetApiKey?: string
  transicsFleetId?: string
  genericWebhookUrl?: string
  lastSyncByProvider: Partial<Record<FleetTelematicsProvider, string>>
  lastSyncAt?: string
  lastSyncError?: string
}

const DEFAULT: FleetTelematicsConnectorConfig = {
  webfleetEnabled: false,
  transicsEnabled: false,
  genericEnabled: false,
  lastSyncByProvider: {},
}

export function loadFleetTelematicsConfig(tenantId: string): FleetTelematicsConnectorConfig {
  const raw = readTenantData<Partial<FleetTelematicsConnectorConfig>>(
    tenantId,
    'fleet-telematics-connectors',
    {},
  )
  return { ...DEFAULT, ...raw, lastSyncByProvider: raw.lastSyncByProvider ?? {} }
}

export function saveFleetTelematicsConfig(
  tenantId: string,
  cfg: FleetTelematicsConnectorConfig,
): void {
  writeTenantData(tenantId, 'fleet-telematics-connectors', cfg)
}

export interface FleetTelematicsSyncResult {
  updated: number
  syncedAt: string
  providers: FleetTelematicsProvider[]
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

function inferStatus(speedKmh: number): FleetPosition['status'] {
  if (speedKmh > 8) return 'in_transit'
  if (speedKmh > 0) return 'loading'
  return 'parked'
}

function synthesizeLocalTelematics(tenantId: string): FleetTelematicsSyncResult {
  const cfg = loadFleetTelematicsConfig(tenantId)
  const now = new Date().toISOString()
  const providers: FleetTelematicsProvider[] = []
  const incoming: Omit<FleetPosition, 'updatedAt'>[] = []

  seedDemoVehicles(tenantId)
  seedDemoCourses(tenantId)
  const vehicles = loadVehicles(tenantId).filter((v) => v.active)
  const courses = loadCourses(tenantId)

  if (cfg.webfleetEnabled && vehicles[0]) {
    providers.push('webfleet')
    const course = courses.find((c) => c.vehicleId === vehicles[0].id && c.status === 'in_transit')
    incoming.push({
      vehicleId: vehicles[0].id,
      registration: vehicles[0].registration,
      driverName: 'Jan Kowalski',
      courseRef: course?.reference,
      lat: 51.12 + Math.random() * 0.02,
      lng: 17.05 + Math.random() * 0.02,
      speedKmh: 78 + Math.round(Math.random() * 15),
      status: 'in_transit',
      source: 'telematics',
      telematicsProvider: 'webfleet',
      externalId: `webfleet-${vehicles[0].id}`,
    })
  }

  if (cfg.transicsEnabled && vehicles[1]) {
    providers.push('transics')
    const course = courses.find((c) => c.vehicleId === vehicles[1].id)
    incoming.push({
      vehicleId: vehicles[1].id,
      registration: vehicles[1].registration,
      driverName: 'Piotr Nowak',
      courseRef: course?.reference,
      lat: 51.77 + Math.random() * 0.01,
      lng: 19.48 + Math.random() * 0.01,
      speedKmh: 0,
      status: 'loading',
      source: 'telematics',
      telematicsProvider: 'transics',
      externalId: `transics-${vehicles[1].id}`,
    })
  }

  if (cfg.genericEnabled && vehicles[0]) {
    providers.push('generic')
    incoming.push({
      vehicleId: vehicles[0].id,
      registration: vehicles[0].registration,
      lat: 52.23,
      lng: 21.01,
      speedKmh: 55,
      status: inferStatus(55),
      source: 'telematics',
      telematicsProvider: 'generic',
      externalId: `generic-${vehicles[0].id}`,
    })
  }

  if (providers.length === 0) {
    return {
      updated: 0,
      syncedAt: now,
      providers: [],
      error: 'Włącz Webfleet, Transics lub innego dostawcę w Ustawieniach firmy',
    }
  }

  const stamped = incoming.map((p) => ({ ...p, updatedAt: now }))
  const { updated } = upsertFleetTelematicsPositions(tenantId, stamped)

  for (const p of providers) {
    cfg.lastSyncByProvider[p] = now
  }
  cfg.lastSyncAt = now
  cfg.lastSyncError = undefined
  saveFleetTelematicsConfig(tenantId, cfg)

  return { updated, syncedAt: now, providers }
}

export async function syncFleetTelematics(tenantId: string): Promise<FleetTelematicsSyncResult> {
  const cfg = loadFleetTelematicsConfig(tenantId)
  const anyEnabled = cfg.webfleetEnabled || cfg.transicsEnabled || cfg.genericEnabled

  if (!anyEnabled) {
    return {
      updated: 0,
      syncedAt: new Date().toISOString(),
      providers: [],
      error: 'Włącz co najmniej jednego dostawcę telematyki w Ustawieniach firmy',
    }
  }

  if (!isSupabaseConfigured()) {
    return synthesizeLocalTelematics(tenantId)
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), CLOUD_FETCH_TIMEOUT_MS)

  try {
    const res = await fetch(`${supabaseFunctionsBase}/fleet-telematics-sync`, {
      method: 'POST',
      headers: await apiHeaders(),
      body: JSON.stringify({ tenantId }),
      signal: controller.signal,
    })

    if (!res.ok) {
      const msg = `fleet-telematics-sync ${res.status}`
      saveFleetTelematicsConfig(tenantId, { ...cfg, lastSyncError: msg })
      return {
        updated: 0,
        syncedAt: new Date().toISOString(),
        providers: [],
        error: msg,
      }
    }

    const json = (await res.json()) as {
      ok?: boolean
      updated?: number
      syncedAt?: string
      providers?: FleetTelematicsProvider[]
      positions?: FleetPosition[]
      error?: string
    }

    if (json.positions?.length) {
      upsertFleetTelematicsPositions(tenantId, json.positions)
    }

    const syncedAt = json.syncedAt ?? new Date().toISOString()
    saveFleetTelematicsConfig(tenantId, {
      ...loadFleetTelematicsConfig(tenantId),
      lastSyncAt: syncedAt,
      lastSyncError: json.error,
    })

    return {
      updated: json.updated ?? 0,
      syncedAt,
      providers: json.providers ?? [],
      error: json.error,
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Sync error'
    saveFleetTelematicsConfig(tenantId, { ...cfg, lastSyncError: msg })
    return {
      updated: 0,
      syncedAt: new Date().toISOString(),
      providers: [],
      error: msg,
    }
  } finally {
    clearTimeout(timer)
  }
}

export function fleetTelematicsStatusLabel(tenantId: string): string {
  const cfg = loadFleetTelematicsConfig(tenantId)
  const enabled = [
    cfg.webfleetEnabled && 'Webfleet',
    cfg.transicsEnabled && 'Transics',
    cfg.genericEnabled && 'Inny',
  ].filter(Boolean)

  if (enabled.length === 0) return 'Brak telematyki — skonfiguruj w Ustawieniach firmy'
  if (cfg.lastSyncError) return `Błąd sync: ${cfg.lastSyncError}`
  if (cfg.lastSyncAt) {
    return `Telematyka (${enabled.join(', ')}) · sync ${new Date(cfg.lastSyncAt).toLocaleString('pl-PL')}`
  }
  return `Skonfigurowano: ${enabled.join(', ')} · jeszcze nie synchronizowano`
}
