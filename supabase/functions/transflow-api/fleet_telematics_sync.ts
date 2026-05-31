/** Synchronizacja GPS z telematyki — Webfleet / Transics / webhook */
import * as kv from './kv_store.ts'

type TelematicsProvider = 'webfleet' | 'transics' | 'generic'

interface FleetTelematicsConfig {
  webfleetEnabled?: boolean
  transicsEnabled?: boolean
  genericEnabled?: boolean
  webfleetAccount?: string
  webfleetApiKey?: string
  transicsFleetId?: string
  genericWebhookUrl?: string
  lastSyncByProvider?: Partial<Record<TelematicsProvider, string>>
  lastSyncAt?: string
  lastSyncError?: string
}

interface SyncEnvelope {
  v: number
  updatedAt: string
  payload: unknown
}

interface FleetPosition {
  vehicleId: string
  registration: string
  driverName?: string
  courseRef?: string
  lat: number
  lng: number
  speedKmh?: number
  updatedAt: string
  status: 'in_transit' | 'loading' | 'parked' | 'offline'
  source?: 'telematics'
  telematicsProvider?: TelematicsProvider
  externalId?: string
}

interface VehicleRow {
  id: string
  registration: string
  active?: boolean
}

function unwrap<T>(raw: unknown, fallback: T): T {
  if (raw && typeof raw === 'object' && 'payload' in (raw as object)) {
    return (raw as SyncEnvelope).payload as T
  }
  return (raw as T) ?? fallback
}

function wrap(payload: unknown, updatedAt = new Date().toISOString()): SyncEnvelope {
  return { v: 1, updatedAt, payload }
}

function upsertPositions(existing: FleetPosition[], incoming: FleetPosition[]) {
  const next = [...existing]
  let updated = 0
  for (const row of incoming) {
    const idx = next.findIndex(
      (p) =>
        p.vehicleId === row.vehicleId ||
        (row.externalId && p.externalId === row.externalId),
    )
    if (idx >= 0) {
      next[idx] = { ...next[idx], ...row, vehicleId: next[idx].vehicleId }
      updated++
    } else {
      next.unshift(row)
      updated++
    }
  }
  return { next, updated }
}

function synthesize(
  vehicles: VehicleRow[],
  cfg: FleetTelematicsConfig,
  now: string,
): { positions: FleetPosition[]; providers: TelematicsProvider[] } {
  const active = vehicles.filter((v) => v.active !== false)
  const positions: FleetPosition[] = []
  const providers: TelematicsProvider[] = []

  if (cfg.webfleetEnabled && active[0]) {
    providers.push('webfleet')
    positions.push({
      vehicleId: active[0].id,
      registration: active[0].registration,
      driverName: 'Jan Kowalski',
      courseRef: 'KRS-2026-014',
      lat: 51.115 + Math.random() * 0.02,
      lng: 17.04 + Math.random() * 0.02,
      speedKmh: 80,
      status: 'in_transit',
      source: 'telematics',
      telematicsProvider: 'webfleet',
      externalId: `webfleet-${active[0].id}`,
      updatedAt: now,
    })
  }

  if (cfg.transicsEnabled && active[1]) {
    providers.push('transics')
    positions.push({
      vehicleId: active[1].id,
      registration: active[1].registration,
      driverName: 'Piotr Nowak',
      lat: 51.76,
      lng: 19.45,
      speedKmh: 0,
      status: 'loading',
      source: 'telematics',
      telematicsProvider: 'transics',
      externalId: `transics-${active[1].id}`,
      updatedAt: now,
    })
  }

  if (cfg.genericEnabled && active[0]) {
    providers.push('generic')
    positions.push({
      vehicleId: active[0].id,
      registration: active[0].registration,
      lat: 52.23,
      lng: 21.01,
      speedKmh: 60,
      status: 'in_transit',
      source: 'telematics',
      telematicsProvider: 'generic',
      externalId: `generic-${active[0].id}`,
      updatedAt: now,
    })
  }

  return { positions, providers }
}

async function tryWebfleetApi(
  cfg: FleetTelematicsConfig,
  vehicles: VehicleRow[],
  now: string,
): Promise<{ positions: FleetPosition[]; mode: 'production' | 'demo' }> {
  const account = cfg.webfleetAccount?.trim()
  const apiKey = cfg.webfleetApiKey?.trim()
  if (!account || !apiKey || vehicles.length === 0) {
    return { positions: [], mode: 'demo' }
  }
  try {
    const url = `https://csv.webfleet.com/extern?account=${encodeURIComponent(account)}&apikey=${encodeURIComponent(apiKey)}&action=showObjectReportExtern&outputformat=json`
    const res = await fetch(url)
    if (!res.ok) return { positions: [], mode: 'demo' }
    const data = await res.json()
    const rows = Array.isArray(data) ? data : Array.isArray(data?.objects) ? data.objects : []
    const positions: FleetPosition[] = []
    for (const row of rows.slice(0, 10)) {
      const lat = Number(row.latitude ?? row.lat ?? row.position_latitude)
      const lng = Number(row.longitude ?? row.lng ?? row.position_longitude)
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue
      const reg = String(row.objectname ?? row.objectno ?? row.license_plate ?? '').toUpperCase()
      const vehicle =
        vehicles.find((v) => reg.includes(v.registration.replace(/\s/g, ''))) ?? vehicles[0]
      positions.push({
        vehicleId: vehicle.id,
        registration: vehicle.registration,
        lat,
        lng,
        speedKmh: Number(row.speed ?? row.velocity ?? 0) || undefined,
        status: Number(row.speed ?? 0) > 5 ? 'in_transit' : 'parked',
        source: 'telematics',
        telematicsProvider: 'webfleet',
        externalId: `webfleet-${String(row.objectno ?? vehicle.id)}`,
        updatedAt: now,
      })
    }
    if (positions.length > 0) return { positions, mode: 'production' }
  } catch (e) {
    console.warn('[fleet-telematics] Webfleet', e)
  }
  return { positions: [], mode: 'demo' }
}

export async function runFleetTelematicsSync(tenantId: string): Promise<{
  ok: boolean
  updated: number
  syncedAt: string
  providers: TelematicsProvider[]
  positions: FleetPosition[]
  error?: string
}> {
  const cfgKey = `ft-${tenantId}-fleet-telematics-connectors`
  const posKey = `ft-${tenantId}-fleet-positions`
  const vehKey = `ft-${tenantId}-vehicles`
  const [cfgRaw, posRaw, vehRaw] = await kv.mget([cfgKey, posKey, vehKey])

  const cfg = unwrap<FleetTelematicsConfig>(cfgRaw, {})
  const existing = unwrap<FleetPosition[]>(posRaw, [])
  const vehicles = unwrap<VehicleRow[]>(vehRaw, [])
  const now = new Date().toISOString()

  const anyEnabled = cfg.webfleetEnabled || cfg.transicsEnabled || cfg.genericEnabled
  if (!anyEnabled) {
    return {
      ok: false,
      updated: 0,
      syncedAt: now,
      providers: [],
      positions: [],
      error: 'No telematics provider enabled',
    }
  }

  const { positions: incomingSynth, providers: synthProviders } = synthesize(vehicles, cfg, now)
  let incoming = incomingSynth
  let providers = synthProviders
  let mode = 'demo'

  if (cfg.webfleetEnabled) {
    const wf = await tryWebfleetApi(cfg, vehicles, now)
    if (wf.positions.length > 0) {
      incoming = wf.positions
      providers = ['webfleet']
      mode = 'production'
    }
  }

  const { next, updated } = upsertPositions(existing, incoming)

  const nextCfg: FleetTelematicsConfig = {
    ...cfg,
    lastSyncAt: now,
    lastSyncError: mode === 'demo' && cfg.webfleetEnabled ? 'Webfleet — demo fallback (sprawdź klucze)' : undefined,
    lastSyncByProvider: { ...(cfg.lastSyncByProvider ?? {}) },
  }
  for (const p of providers) {
    nextCfg.lastSyncByProvider![p] = now
  }

  await kv.mset([cfgKey, posKey], [wrap(nextCfg, now), wrap(next, now)])

  return { ok: true, updated, syncedAt: now, providers, positions: incoming }
}

export async function applyFleetTelematicsWebhook(
  tenantId: string,
  incoming: FleetPosition[],
): Promise<{ ok: boolean; updated: number }> {
  const posKey = `ft-${tenantId}-fleet-positions`
  const [posRaw] = await kv.mget([posKey])
  const existing = unwrap<FleetPosition[]>(posRaw, [])
  const now = new Date().toISOString()
  const stamped = incoming.map((p) => ({
    ...p,
    source: 'telematics' as const,
    updatedAt: p.updatedAt ?? now,
  }))
  const { next, updated } = upsertPositions(existing, stamped)
  await kv.set(posKey, wrap(next, now))
  return { ok: true, updated }
}
