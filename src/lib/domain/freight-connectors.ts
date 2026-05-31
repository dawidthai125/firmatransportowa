import type { FreightOffer, FreightSource } from '@/lib/domain/freight-offer'
import { loadAllFreightOffers, seedDemoFreightOffers } from '@/lib/domain/freight-board-store'
import { loadFreightPreferences, saveFreightPreferences } from '@/lib/domain/freight-preferences'
import { readTenantData, writeTenantData } from '@/lib/tenant/storage'

/** Zewnętrzne giełdy frachtu — demo symuluje API; produkcja: klucze w Supabase Edge */
export type ExternalFreightConnectorKey =
  | 'trans_eu'
  | 'timocom'
  | 'teleroute'
  | 'cargo123'
  | 'transporeon'
  | 'wtransnet'
  | 'b2pweb'
  | 'freightlink'

export interface FreightConnectorConfig {
  transEuEnabled: boolean
  timocomEnabled: boolean
  telerouteEnabled: boolean
  cargo123Enabled: boolean
  transporeonEnabled: boolean
  wtransnetEnabled: boolean
  b2pwebEnabled: boolean
  freightlinkEnabled: boolean
  /** Produkcyjne REST API (moduł freightApiProd) */
  productionApiEnabled: boolean
  transEuClientId?: string
  transEuApiKey?: string
  transEuSandbox?: boolean
  timocomApiKey?: string
  timocomCompanyId?: string
  lastSyncError?: string
  lastSyncBySource: Partial<Record<FreightSource, string>>
}

export const FREIGHT_CONNECTOR_META: {
  key: ExternalFreightConnectorKey
  label: string
  configKey: keyof Omit<FreightConnectorConfig, 'lastSyncBySource'>
  offersPerSync: number
}[] = [
  { key: 'trans_eu', label: 'Trans.eu', configKey: 'transEuEnabled', offersPerSync: 2 },
  { key: 'timocom', label: 'TimoCom', configKey: 'timocomEnabled', offersPerSync: 2 },
  { key: 'teleroute', label: 'Teleroute', configKey: 'telerouteEnabled', offersPerSync: 2 },
  { key: 'cargo123', label: '123cargo', configKey: 'cargo123Enabled', offersPerSync: 1 },
  { key: 'transporeon', label: 'Transporeon', configKey: 'transporeonEnabled', offersPerSync: 1 },
  { key: 'wtransnet', label: 'Wtransnet', configKey: 'wtransnetEnabled', offersPerSync: 2 },
  { key: 'b2pweb', label: 'B2PWeb', configKey: 'b2pwebEnabled', offersPerSync: 1 },
  { key: 'freightlink', label: 'Freightlink', configKey: 'freightlinkEnabled', offersPerSync: 1 },
]

const DEFAULT_CONNECTOR: FreightConnectorConfig = {
  transEuEnabled: true,
  timocomEnabled: true,
  telerouteEnabled: true,
  cargo123Enabled: true,
  transporeonEnabled: true,
  wtransnetEnabled: true,
  b2pwebEnabled: true,
  freightlinkEnabled: true,
  productionApiEnabled: false,
  transEuSandbox: true,
  lastSyncBySource: {},
}

const SOURCE_PREFIX: Record<ExternalFreightConnectorKey, string> = {
  trans_eu: 'TE',
  timocom: 'TC',
  teleroute: 'TL',
  cargo123: '123C',
  transporeon: 'TP',
  wtransnet: 'WT',
  b2pweb: 'B2P',
  freightlink: 'FL',
}

const SOURCE_SHIPPER: Record<ExternalFreightConnectorKey, string> = {
  trans_eu: 'Trans.eu Live Feed',
  timocom: 'TimoCom Live Feed',
  teleroute: 'Teleroute Marketplace',
  cargo123: '123cargo API',
  transporeon: 'Transporeon Shipper',
  wtransnet: 'Wtransnet PL',
  b2pweb: 'B2PWeb Exchange',
  freightlink: 'Freightlink EU',
}

export function loadFreightConnectorConfig(tenantId: string): FreightConnectorConfig {
  const raw = readTenantData<Partial<FreightConnectorConfig>>(tenantId, 'freight-connectors', {})
  return { ...DEFAULT_CONNECTOR, ...raw }
}

export function saveFreightConnectorConfig(tenantId: string, cfg: FreightConnectorConfig): void {
  writeTenantData(tenantId, 'freight-connectors', cfg)
}

function synthesizeConnectorOffers(
  tenantId: string,
  source: ExternalFreightConnectorKey,
  count: number,
): FreightOffer[] {
  const now = new Date().toISOString()
  const templates: Omit<FreightOffer, 'id' | 'tenantId' | 'postedAt' | 'reference' | 'source'>[] = [
    {
      loadCity: source === 'wtransnet' ? 'Wrocław' : 'Legnica',
      loadCountry: 'PL',
      unloadCity: source === 'cargo123' ? 'Poznań' : 'Drezno',
      unloadCountry: source === 'cargo123' ? 'PL' : 'DE',
      loadDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      bodyType: 'curtain',
      loadType: 'ftl',
      scope: 'international_eu',
      weightKg: 21500,
      ldm: 13.6,
      adr: false,
      liftRequired: false,
      freightPln: 0,
      freightEur: 1420,
      ratePerKmPln: 4.1,
      distanceKm: 350,
      paymentDays: 21,
      shipperRating: 4.3,
      cargoDescription: `Sync ${SOURCE_SHIPPER[source]} — palety przemysłowe`,
      shipperName: SOURCE_SHIPPER[source],
    },
    {
      loadCity: 'Łódź',
      loadCountry: 'PL',
      unloadCity: 'Berlin',
      unloadCountry: 'DE',
      loadDate: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
      bodyType: source === 'transporeon' ? 'box' : 'curtain',
      loadType: source === 'b2pweb' ? 'ltl' : 'ftl',
      scope: 'international_eu',
      weightKg: source === 'b2pweb' ? 7200 : 19800,
      ldm: source === 'b2pweb' ? 5 : 13.6,
      adr: false,
      liftRequired: source === 'freightlink',
      freightPln: source === 'wtransnet' ? 4800 : 0,
      freightEur: source === 'wtransnet' ? undefined : 890,
      ratePerKmPln: 3.9,
      distanceKm: 420,
      paymentDays: 30,
      shipperRating: 4.1,
      cargoDescription: `Sync ${SOURCE_SHIPPER[source]} — ${source === 'transporeon' ? 'retail FTL' : 'B2B'}`,
      shipperName: `${SOURCE_SHIPPER[source]} Partner`,
    },
  ]

  const suffix = Date.now().toString(36).slice(-4).toUpperCase()
  return templates.slice(0, count).map((t, i) => ({
    ...t,
    source,
    id: `fo-sync-${source}-${suffix}-${i}`,
    tenantId,
    reference: `${SOURCE_PREFIX[source]}-LIVE/${suffix}/${i + 1}`,
    postedAt: now,
  }))
}

export interface SyncResult {
  added: number
  sources: FreightSource[]
  syncedAt: string
}

/** Synchronizacja z connectorami (demo: syntetyczne oferty; prod: Edge + API keys) */
export function syncFreightConnectors(tenantId: string): SyncResult {
  seedDemoFreightOffers(tenantId)
  const cfg = loadFreightConnectorConfig(tenantId)
  const existing = loadAllFreightOffers(tenantId)
  const refs = new Set(existing.map((o) => o.reference))
  const toAdd: FreightOffer[] = []
  const sources: FreightSource[] = []

  for (const meta of FREIGHT_CONNECTOR_META) {
    if (!cfg[meta.configKey]) continue
    sources.push(meta.key)
    for (const o of synthesizeConnectorOffers(tenantId, meta.key, meta.offersPerSync)) {
      if (!refs.has(o.reference)) {
        toAdd.push(o)
        refs.add(o.reference)
      }
    }
    cfg.lastSyncBySource[meta.key] = new Date().toISOString()
  }

  if (toAdd.length > 0) {
    writeTenantData(tenantId, 'freight-offers', [...toAdd, ...existing])
  }

  saveFreightConnectorConfig(tenantId, cfg)
  const prefs = loadFreightPreferences(tenantId)
  saveFreightPreferences(tenantId, prefs)

  return { added: toAdd.length, sources, syncedAt: new Date().toISOString() }
}

/** Parser leadu e-mail → oferta na giełdę wewnętrzną */
export function parseEmailLeadToOffer(
  tenantId: string,
  raw: string,
): Omit<FreightOffer, 'id' | 'postedAt'> | null {
  const text = raw.trim()
  if (text.length < 10) return null

  const routeMatch = text.match(
    /([A-Za-zÀ-ž\s-]+)\s*(?:\(([A-Z]{2})\))?\s*[-–>→]\s*([A-Za-zÀ-ž\s-]+)\s*(?:\(([A-Z]{2})\))?/i,
  )
  const pricePln = text.match(/(\d[\d\s]*)\s*zł/i)
  const priceEur = text.match(/(\d[\d\s]*)\s*eur/i)
  const weight = text.match(/(\d[\d\s]*)\s*(?:kg|t)/i)

  const loadCity = routeMatch?.[1]?.trim() ?? 'Wrocław'
  const loadCountry = routeMatch?.[2] ?? 'PL'
  const unloadCity = routeMatch?.[3]?.trim() ?? 'Warszawa'
  const unloadCountry = routeMatch?.[4] ?? 'PL'

  return {
    tenantId,
    source: 'email_lead',
    reference: `MAIL/${new Date().getFullYear()}/${Date.now().toString(36).slice(-5).toUpperCase()}`,
    loadCity,
    loadCountry,
    unloadCity,
    unloadCountry,
    loadDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    bodyType: 'curtain',
    loadType: 'ftl',
    scope: loadCountry === unloadCountry ? 'domestic' : 'international_eu',
    weightKg: weight ? Number(weight[1].replace(/\s/g, '')) : 18000,
    adr: /adr/i.test(text),
    liftRequired: /winda|hds/i.test(text),
    freightPln: pricePln ? Number(pricePln[1].replace(/\s/g, '')) : 0,
    freightEur: priceEur ? Number(priceEur[1].replace(/\s/g, '')) : undefined,
    paymentDays: 30,
    shipperRating: 4,
    cargoDescription: text.slice(0, 120),
    shipperName: 'Lead e-mail (import ręczny)',
  }
}

export function importEmailLead(tenantId: string, raw: string): FreightOffer | null {
  const parsed = parseEmailLeadToOffer(tenantId, raw)
  if (!parsed) return null
  const offer: FreightOffer = {
    ...parsed,
    id: crypto.randomUUID(),
    postedAt: new Date().toISOString(),
  }
  const existing = loadAllFreightOffers(tenantId)
  writeTenantData(tenantId, 'freight-offers', [offer, ...existing])
  return offer
}
