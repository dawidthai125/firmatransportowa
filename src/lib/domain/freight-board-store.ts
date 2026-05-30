import type { FreightOffer } from '@/lib/domain/freight-offer'
import {
  loadFreightPreferences,
  type FreightSearchPreferences,
} from '@/lib/domain/freight-preferences'
import { readTenantData, writeTenantData } from '@/lib/tenant/storage'

const CACHE_KEY = 'freight-offers' as const

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const CITY_COORDS: Record<string, [number, number]> = {
  wrocław: [51.1, 17.03],
  warszawa: [52.23, 21.01],
  poznań: [52.41, 16.93],
  gdańsk: [54.35, 18.65],
  kraków: [50.06, 19.94],
  berlin: [52.52, 13.4],
  praga: [50.08, 14.44],
  hamburg: [53.55, 9.99],
  rotterdam: [51.92, 4.48],
  wiedeń: [48.21, 16.37],
  budapeszt: [47.5, 19.04],
  łódź: [51.76, 19.46],
  katowice: [50.26, 19.02],
}

function cityCoords(name: string): [number, number] | undefined {
  return CITY_COORDS[name.trim().toLowerCase()]
}

export function seedDemoFreightOffers(tenantId: string): FreightOffer[] {
  const existing = readTenantData<FreightOffer[]>(tenantId, CACHE_KEY, [])
  if (existing.length > 0) return existing

  const now = new Date().toISOString()
  const demo: FreightOffer[] = [
    {
      id: 'fo-001',
      tenantId,
      source: 'trans_eu',
      reference: 'TE/88421',
      loadCity: 'Wrocław',
      loadCountry: 'PL',
      unloadCity: 'Hamburg',
      unloadCountry: 'DE',
      loadDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      bodyType: 'curtain',
      loadType: 'ftl',
      scope: 'international_eu',
      weightKg: 22000,
      ldm: 13.6,
      adr: false,
      liftRequired: false,
      freightPln: 0,
      freightEur: 1680,
      ratePerKmPln: 4.2,
      distanceKm: 580,
      paymentDays: 30,
      shipperRating: 4.6,
      cargoDescription: 'Części automotive — 33 palety',
      shipperName: 'AutoParts Wrocław Sp. z o.o.',
      postedAt: now,
    },
    {
      id: 'fo-002',
      tenantId,
      source: 'timocom',
      reference: 'TC-99201',
      loadCity: 'Poznań',
      loadCountry: 'PL',
      unloadCity: 'Rotterdam',
      unloadCountry: 'NL',
      loadDate: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
      bodyType: 'curtain',
      loadType: 'ftl',
      scope: 'international_eu',
      weightKg: 24000,
      ldm: 13.6,
      adr: false,
      liftRequired: true,
      freightPln: 0,
      freightEur: 2100,
      ratePerKmPln: 3.8,
      distanceKm: 920,
      paymentDays: 45,
      shipperRating: 4.2,
      cargoDescription: 'Meble — winda załadunkowa',
      shipperName: 'NordLog BV',
      postedAt: now,
    },
    {
      id: 'fo-003',
      tenantId,
      source: 'teleroute',
      reference: 'TL-44102',
      loadCity: 'Gdańsk',
      loadCountry: 'PL',
      unloadCity: 'Warszawa',
      unloadCountry: 'PL',
      loadDate: new Date().toISOString().slice(0, 10),
      bodyType: 'frigo',
      loadType: 'ftl',
      scope: 'domestic',
      weightKg: 18000,
      ldm: 12,
      adr: false,
      liftRequired: false,
      freightPln: 3200,
      ratePerKmPln: 5.1,
      distanceKm: 340,
      paymentDays: 14,
      shipperRating: 4.8,
      cargoDescription: 'Ładunek chłodniczy +2°C — mleko UHT',
      shipperName: 'Mlekovita Logistics',
      postedAt: now,
    },
    {
      id: 'fo-004',
      tenantId,
      source: 'cargo123',
      reference: '123C-7781',
      loadCity: 'Katowice',
      loadCountry: 'PL',
      unloadCity: 'Berlin',
      unloadCountry: 'DE',
      loadDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      bodyType: 'curtain',
      loadType: 'ltl',
      scope: 'international_eu',
      weightKg: 8500,
      ldm: 6,
      palletCount: 12,
      adr: false,
      liftRequired: false,
      freightPln: 0,
      freightEur: 620,
      ratePerKmPln: 3.5,
      distanceKm: 480,
      paymentDays: 21,
      shipperRating: 3.9,
      isCabotage: false,
      cargoDescription: 'LTL — elektronika B2B',
      shipperName: 'SpedTrans Katowice',
      postedAt: now,
    },
    {
      id: 'fo-005',
      tenantId,
      source: 'email_lead',
      reference: 'MAIL/2026/044',
      loadCity: 'Kraków',
      loadCountry: 'PL',
      unloadCity: 'Wiedeń',
      unloadCountry: 'AT',
      loadDate: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10),
      bodyType: 'curtain',
      loadType: 'ftl',
      scope: 'international_eu',
      weightKg: 21000,
      adr: true,
      adrClass: '3',
      liftRequired: false,
      freightPln: 0,
      freightEur: 1950,
      ratePerKmPln: 4.0,
      distanceKm: 520,
      paymentDays: 60,
      shipperRating: 3.5,
      cargoDescription: 'Chemia ADR kl. 3 — pełna dokumentacja',
      shipperName: 'ChemSped Kraków (lead e-mail)',
      postedAt: now,
    },
    {
      id: 'fo-006',
      tenantId,
      source: 'partner_network',
      reference: 'PART/882',
      loadCity: 'Wrocław',
      loadCountry: 'PL',
      unloadCity: 'Poznań',
      unloadCountry: 'PL',
      loadDate: new Date().toISOString().slice(0, 10),
      bodyType: 'curtain',
      loadType: 'ftl',
      scope: 'domestic',
      weightKg: 15000,
      ldm: 13.6,
      adr: false,
      liftRequired: false,
      freightPln: 2800,
      ratePerKmPln: 6.2,
      distanceKm: 180,
      paymentDays: 7,
      shipperRating: 5,
      cargoDescription: 'Stały kontrahent — profile aluminiowe',
      shipperName: 'AluProf (sieć partnerska)',
      postedAt: now,
    },
    {
      id: 'fo-007',
      tenantId,
      source: 'transporeon',
      reference: 'TPN-220991',
      loadCity: 'Łódź',
      loadCountry: 'PL',
      unloadCity: 'Praga',
      unloadCountry: 'CZ',
      loadDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      bodyType: 'mega',
      loadType: 'ftl',
      scope: 'international_eu',
      weightKg: 20000,
      ldm: 15.6,
      adr: false,
      liftRequired: false,
      freightPln: 0,
      freightEur: 890,
      ratePerKmPln: 2.9,
      distanceKm: 420,
      paymentDays: 45,
      shipperRating: 4.0,
      cargoDescription: 'Mega — opakowania FMCG',
      shipperName: 'Retail Chain CZ',
      postedAt: now,
    },
    {
      id: 'fo-008',
      tenantId,
      source: 'internal_board',
      reference: 'INT/2026/12',
      loadCity: 'Wrocław',
      loadCountry: 'PL',
      unloadCity: 'Gdańsk',
      unloadCountry: 'PL',
      loadDate: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
      bodyType: 'platform',
      loadType: 'ftl',
      scope: 'domestic',
      weightKg: 12000,
      adr: false,
      liftRequired: false,
      freightPln: 4500,
      ratePerKmPln: 5.5,
      distanceKm: 450,
      paymentDays: 0,
      shipperRating: 5,
      cargoDescription: 'Maszyny na platformie — mocowanie po stronie załadowcy',
      shipperName: 'Wewnętrzna giełda Tajski-Trans',
      postedAt: now,
    },
    {
      id: 'fo-009',
      tenantId,
      source: 'trans_eu',
      reference: 'TE/99102',
      loadCity: 'Berlin',
      loadCountry: 'DE',
      unloadCity: 'Wrocław',
      unloadCountry: 'PL',
      loadDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      bodyType: 'curtain',
      loadType: 'ftl',
      scope: 'international_eu',
      weightKg: 22000,
      adr: false,
      liftRequired: false,
      freightPln: 0,
      freightEur: 980,
      ratePerKmPln: 3.2,
      distanceKm: 580,
      paymentDays: 30,
      shipperRating: 4.4,
      isCabotage: true,
      cargoDescription: 'Powrót DE→PL — kabotaż po rozładunku',
      shipperName: 'DE Spedition GmbH',
      postedAt: now,
    },
    {
      id: 'fo-010',
      tenantId,
      source: 'timocom',
      reference: 'TC-11002',
      loadCity: 'Wrocław',
      loadCountry: 'PL',
      unloadCity: 'Budapeszt',
      unloadCountry: 'HU',
      loadDate: new Date(Date.now() + 86400000 * 4).toISOString().slice(0, 10),
      bodyType: 'box',
      loadType: 'ftl',
      scope: 'international_eu',
      weightKg: 19000,
      adr: false,
      liftRequired: false,
      freightPln: 0,
      freightEur: 1750,
      ratePerKmPln: 3.6,
      distanceKm: 680,
      paymentDays: 30,
      shipperRating: 4.1,
      cargoDescription: 'Towary sucharne — furgon',
      shipperName: 'HU Food Logistics',
      postedAt: now,
    },
  ]

  writeTenantData(tenantId, CACHE_KEY, demo)
  return demo
}

export function loadAllFreightOffers(tenantId: string): FreightOffer[] {
  return seedDemoFreightOffers(tenantId)
}

export function filterFreightOffers(
  offers: FreightOffer[],
  prefs: FreightSearchPreferences,
  query?: string,
): FreightOffer[] {
  const q = query?.trim().toLowerCase() ?? ''
  const baseCoords = prefs.homeBaseRadiusKm > 0 ? cityCoords(prefs.homeBaseCity) : undefined

  return offers.filter((o) => {
    if (!prefs.sources.includes(o.source)) return false
    if (!prefs.scopes.includes(o.scope)) return false
    if (!prefs.bodyTypes.includes(o.bodyType)) return false
    if (!prefs.loadTypes.includes(o.loadType)) return false
    if (prefs.excludeAdr && o.adr) return false
    if (prefs.requireLift && !o.liftRequired) return false
    if (prefs.excludeCabotage && o.isCabotage) return false
    if (o.weightKg > prefs.maxWeightKg) return false
    if (prefs.minLdm > 0 && (o.ldm ?? 0) < prefs.minLdm) return false
    if (prefs.minRatePerKmPln > 0 && (o.ratePerKmPln ?? 0) < prefs.minRatePerKmPln) return false
    if (prefs.minFreightPln > 0 && o.freightPln > 0 && o.freightPln < prefs.minFreightPln) return false
    if (prefs.minShipperRating > 0 && (o.shipperRating ?? 0) < prefs.minShipperRating) return false
    if (prefs.maxPaymentDays >= 0 && o.paymentDays > prefs.maxPaymentDays) return false

    if (
      prefs.preferredLoadCountries.length > 0 &&
      !prefs.preferredLoadCountries.includes(o.loadCountry)
    ) {
      return false
    }
    if (
      prefs.preferredUnloadCountries.length > 0 &&
      !prefs.preferredUnloadCountries.includes(o.unloadCountry)
    ) {
      return false
    }

    if (baseCoords) {
      const load = cityCoords(o.loadCity)
      if (
        load &&
        haversineKm(baseCoords[0], baseCoords[1], load[0], load[1]) > prefs.homeBaseRadiusKm
      ) {
        return false
      }
    }

    if (prefs.corridorEnabled && prefs.corridorFromCity && prefs.corridorToCity) {
      const from = prefs.corridorFromCity.toLowerCase()
      const to = prefs.corridorToCity.toLowerCase()
      const loadMatch =
        o.loadCity.toLowerCase().includes(from) ||
        o.unloadCity.toLowerCase().includes(to) ||
        o.loadCity.toLowerCase().includes(to) ||
        o.unloadCity.toLowerCase().includes(from)
      if (!loadMatch) return false
    }

    if (q) {
      const hay = [o.reference, o.loadCity, o.unloadCity, o.cargoDescription, o.shipperName]
        .join(' ')
        .toLowerCase()
      if (!hay.includes(q)) return false
    }

    return true
  })
}

export function searchFreightOffers(
  tenantId: string,
  query?: string,
): { offers: FreightOffer[]; prefs: FreightSearchPreferences } {
  const prefs = loadFreightPreferences(tenantId)
  const all = loadAllFreightOffers(tenantId)
  const offers = filterFreightOffers(all, prefs, query)
  return { offers, prefs }
}
