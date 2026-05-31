/** Synchronizacja tachografu — demo syntetyczne odczyty; prod: TachoScan / VDO API */
import * as kv from './kv_store.ts'

type TachographProvider = 'tacho_scan' | 'vdo_online' | 'telematics_fms'

interface TachographConnectorConfig {
  tachoScanEnabled?: boolean
  vdoOnlineEnabled?: boolean
  telematicsFmsEnabled?: boolean
  tachoScanApiKey?: string
  vdoFleetId?: string
  telematicsEndpoint?: string
  lastSyncByProvider?: Partial<Record<TachographProvider, string>>
  lastSyncAt?: string
  lastSyncError?: string
}

interface SyncEnvelope {
  v: number
  updatedAt: string
  payload: unknown
  tombstones?: Record<string, string>
}

interface TachographRecord {
  id: string
  tenantId: string
  filename: string
  source: 'remote_api' | 'telematics' | 'manual_upload'
  recordType: 'driver_card' | 'vehicle_unit' | 'unknown'
  driverName?: string
  vehicleRegistration?: string
  periodFrom?: string
  periodTo?: string
  sizeBytes: number
  importedAt: string
  lastSyncAt?: string
  drivingMinutes?: number
  restMinutes?: number
  externalId?: string
  notes?: string
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

function synthesizeRecords(
  tenantId: string,
  cfg: TachographConnectorConfig,
  now: string,
): { records: TachographRecord[]; providers: TachographProvider[] } {
  const today = now.slice(0, 10)
  const weekAgo = new Date(Date.now() - 86400000 * 7).toISOString().slice(0, 10)
  const suffix = Date.now().toString(36).slice(-4).toUpperCase()
  const records: TachographRecord[] = []
  const providers: TachographProvider[] = []

  if (cfg.tachoScanEnabled) {
    providers.push('tacho_scan')
    records.push({
      id: crypto.randomUUID(),
      tenantId,
      filename: `API_TachoScan_C_KOWALSKI_${weekAgo.replace(/-/g, '')}_${today.replace(/-/g, '')}.ddd`,
      source: 'remote_api',
      recordType: 'driver_card',
      driverName: 'Jan Kowalski',
      periodFrom: weekAgo,
      periodTo: today,
      sizeBytes: 0,
      drivingMinutes: 492,
      restMinutes: 660,
      importedAt: now,
      lastSyncAt: now,
      externalId: `tacho-scan-${suffix}`,
      notes: 'Edge TachoScan — produkcja: SDK / REST partnera',
    })
  }

  if (cfg.vdoOnlineEnabled) {
    providers.push('vdo_online')
    records.push({
      id: crypto.randomUUID(),
      tenantId,
      filename: `API_VDO_M_DW9ADR1_${weekAgo.replace(/-/g, '')}_${today.replace(/-/g, '')}.ddd`,
      source: 'remote_api',
      recordType: 'vehicle_unit',
      vehicleRegistration: 'DW 9ADR1',
      periodFrom: weekAgo,
      periodTo: today,
      sizeBytes: 0,
      drivingMinutes: 510,
      restMinutes: 600,
      importedAt: now,
      lastSyncAt: now,
      externalId: `vdo-online-${suffix}`,
      notes: 'Edge VDO Fleet — zdalny download VU',
    })
  }

  if (cfg.telematicsFmsEnabled) {
    providers.push('telematics_fms')
    records.push({
      id: crypto.randomUUID(),
      tenantId,
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
      importedAt: now,
      lastSyncAt: now,
      externalId: `telematics-fms-${suffix}`,
      notes: 'Edge telematyka FMS — czasy z CAN (operacyjnie, nie zastępuje DDD)',
    })
  }

  return { records, providers }
}

function upsertRecords(existing: TachographRecord[], incoming: TachographRecord[]) {
  const next = [...existing]
  let added = 0
  let updated = 0

  for (const row of incoming) {
    const idx = next.findIndex(
      (r) =>
        (row.externalId && r.externalId === row.externalId) ||
        r.filename.toLowerCase() === row.filename.toLowerCase(),
    )
    if (idx >= 0) {
      next[idx] = { ...next[idx], ...row, id: next[idx].id, importedAt: next[idx].importedAt }
      updated++
    } else {
      next.unshift(row)
      added++
    }
  }

  return { next, added, updated }
}

async function tryTachoScanApi(
  tenantId: string,
  cfg: TachographConnectorConfig,
  now: string,
): Promise<{ records: TachographRecord[]; mode: 'production' | 'demo' }> {
  const key = cfg.tachoScanApiKey?.trim()
  if (!key) return { records: [], mode: 'demo' }
  const base = Deno.env.get('TACHOSCAN_API_BASE') ?? 'https://api.tachoscan.pl'
  try {
    const res = await fetch(`${base}/api/v1/downloads?limit=5`, {
      headers: { Authorization: `Bearer ${key}`, Accept: 'application/json' },
    })
    if (!res.ok) return { records: [], mode: 'demo' }
    const data = await res.json()
    const items = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : []
    if (items.length === 0) return { records: [], mode: 'demo' }
    const today = now.slice(0, 10)
    const records: TachographRecord[] = items.slice(0, 5).map((item: Record<string, unknown>) => ({
      id: crypto.randomUUID(),
      tenantId,
      filename: String(item.filename ?? item.name ?? `TachoScan_${today}.ddd`),
      source: 'remote_api' as const,
      recordType: (item.type === 'vu' ? 'vehicle_unit' : 'driver_card') as TachographRecord['recordType'],
      driverName: String(item.driverName ?? item.driver ?? ''),
      periodFrom: String(item.periodFrom ?? item.from ?? today),
      periodTo: String(item.periodTo ?? item.to ?? today),
      sizeBytes: Number(item.size ?? 0),
      importedAt: now,
      lastSyncAt: now,
      drivingMinutes: Number(item.drivingMinutes ?? 0) || undefined,
      restMinutes: Number(item.restMinutes ?? 0) || undefined,
      externalId: String(item.id ?? item.externalId ?? ''),
      notes: 'TachoScan API',
    }))
    return { records, mode: 'production' }
  } catch (e) {
    console.warn('[tachograph-sync] TachoScan', e)
    return { records: [], mode: 'demo' }
  }
}

export async function runTachographSync(tenantId: string): Promise<{
  ok: boolean
  added: number
  updated: number
  syncedAt: string
  providers: TachographProvider[]
  records: TachographRecord[]
  error?: string
}> {
  const cfgKey = `ft-${tenantId}-tachograph-connectors`
  const tachoKey = `ft-${tenantId}-tachograph`
  const [cfgRaw, tachoRaw] = await kv.mget([cfgKey, tachoKey])

  const cfg = unwrap<TachographConnectorConfig>(cfgRaw, {})
  const existing = unwrap<TachographRecord[]>(tachoRaw, [])
  const now = new Date().toISOString()

  const anyEnabled = cfg.tachoScanEnabled || cfg.vdoOnlineEnabled || cfg.telematicsFmsEnabled
  if (!anyEnabled) {
    return {
      ok: false,
      added: 0,
      updated: 0,
      syncedAt: now,
      providers: [],
      records: [],
      error: 'No tachograph provider enabled',
    }
  }

  let { records: incoming, providers } = synthesizeRecords(tenantId, cfg, now)
  let mode = 'demo'

  if (cfg.tachoScanEnabled && cfg.tachoScanApiKey) {
    const fromApi = await tryTachoScanApi(tenantId, cfg, now)
    if (fromApi.records.length > 0) {
      incoming = fromApi.records
      providers = ['tacho_scan']
      mode = 'production'
    }
  }

  const { next, added, updated } = upsertRecords(existing, incoming)

  const nextCfg: TachographConnectorConfig = {
    ...cfg,
    lastSyncAt: now,
    lastSyncError:
      mode === 'demo' && cfg.tachoScanEnabled
        ? 'TachoScan — demo fallback (sprawdź klucz API)'
        : undefined,
    lastSyncByProvider: { ...(cfg.lastSyncByProvider ?? {}) },
  }
  for (const p of providers) {
    nextCfg.lastSyncByProvider![p] = now
  }

  await kv.mset([cfgKey, tachoKey], [wrap(nextCfg, now), wrap(next, now)])

  return {
    ok: true,
    added,
    updated,
    syncedAt: now,
    providers,
    records: incoming,
  }
}

export async function applyTachographWebhook(
  tenantId: string,
  incoming: TachographRecord[],
): Promise<{ ok: boolean; added: number; updated: number }> {
  const tachoKey = `ft-${tenantId}-tachograph`
  const [tachoRaw] = await kv.mget([tachoKey])
  const existing = unwrap<TachographRecord[]>(tachoRaw, [])
  const now = new Date().toISOString()
  const stamped = incoming.map((r) => ({
    ...r,
    tenantId,
    id: r.id ?? crypto.randomUUID(),
    importedAt: r.importedAt ?? now,
    lastSyncAt: now,
  }))
  const { next, added, updated } = upsertRecords(existing, stamped)
  await kv.set(tachoKey, wrap(next, now))
  return { ok: true, added, updated }
}
