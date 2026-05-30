import type { FreightOffer, FreightSource } from '@/lib/domain/freight-offer'
import { loadAllFreightOffers, seedDemoFreightOffers } from '@/lib/domain/freight-board-store'
import { loadFreightPreferences, saveFreightPreferences } from '@/lib/domain/freight-preferences'
import { readTenantData, writeTenantData } from '@/lib/tenant/storage'

export interface FreightConnectorConfig {
  /** Symulacja API — produkcja: klucze w Supabase Edge */
  transEuEnabled: boolean
  timocomEnabled: boolean
  /** Ostatnia synchronizacja per źródło */
  lastSyncBySource: Partial<Record<FreightSource, string>>
}

const DEFAULT_CONNECTOR: FreightConnectorConfig = {
  transEuEnabled: true,
  timocomEnabled: true,
  lastSyncBySource: {},
}

export function loadFreightConnectorConfig(tenantId: string): FreightConnectorConfig {
  const raw = readTenantData<Partial<FreightConnectorConfig>>(tenantId, 'freight-connectors', {})
  return { ...DEFAULT_CONNECTOR, ...raw }
}

export function saveFreightConnectorConfig(tenantId: string, cfg: FreightConnectorConfig): void {
  writeTenantData(tenantId, 'freight-connectors', cfg)
}

/** Generuje świeże oferty symulując pull z API giełdy */
function synthesizeConnectorOffers(
  tenantId: string,
  source: FreightSource,
  count: number,
): FreightOffer[] {
  const now = new Date().toISOString()
  const templates: Omit<FreightOffer, 'id' | 'tenantId' | 'postedAt' | 'reference'>[] = [
    {
      source,
      loadCity: 'Wrocław',
      loadCountry: 'PL',
      unloadCity: 'Drezno',
      unloadCountry: 'DE',
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
      cargoDescription: 'Sync API — palety przemysłowe',
      shipperName: source === 'trans_eu' ? 'Trans.eu Live Feed' : 'TimoCom Live Feed',
    },
    {
      source,
      loadCity: 'Legnica',
      loadCountry: 'PL',
      unloadCity: 'Lipsk',
      unloadCountry: 'DE',
      loadDate: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
      bodyType: 'curtain',
      loadType: 'ltl',
      scope: 'international_eu',
      weightKg: 7200,
      ldm: 5,
      adr: false,
      liftRequired: false,
      freightPln: 0,
      freightEur: 480,
      ratePerKmPln: 3.7,
      distanceKm: 280,
      paymentDays: 30,
      shipperRating: 4.0,
      cargoDescription: 'Sync API — LTL B2B',
      shipperName: source === 'trans_eu' ? 'Trans.eu Partner' : 'TimoCom Partner',
    },
  ]

  const suffix = Date.now().toString(36).slice(-4).toUpperCase()
  return templates.slice(0, count).map((t, i) => ({
    ...t,
    id: `fo-sync-${source}-${suffix}-${i}`,
    tenantId,
    reference: `${source === 'trans_eu' ? 'TE' : 'TC'}-LIVE/${suffix}/${i + 1}`,
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

  if (cfg.transEuEnabled) {
    sources.push('trans_eu')
    for (const o of synthesizeConnectorOffers(tenantId, 'trans_eu', 2)) {
      if (!refs.has(o.reference)) {
        toAdd.push(o)
        refs.add(o.reference)
      }
    }
    cfg.lastSyncBySource.trans_eu = new Date().toISOString()
  }

  if (cfg.timocomEnabled) {
    sources.push('timocom')
    for (const o of synthesizeConnectorOffers(tenantId, 'timocom', 1)) {
      if (!refs.has(o.reference)) {
        toAdd.push(o)
        refs.add(o.reference)
      }
    }
    cfg.lastSyncBySource.timocom = new Date().toISOString()
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
