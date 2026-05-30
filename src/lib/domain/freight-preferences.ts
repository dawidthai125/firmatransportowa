import type { FreightBodyType, FreightLoadType, FreightScope, FreightSource } from '@/lib/domain/freight-offer'
import { readTenantData, writeTenantData } from '@/lib/tenant/storage'

/** Preferencje wyszukiwania frachtu — typowe kryteria firm TSL (Trans.eu, TimoCom, branża) */
export interface FreightSearchPreferences {
  /** Aktywne źródła ofert */
  sources: FreightSource[]
  /** Zakres geograficzny firmy */
  scopes: FreightScope[]
  bodyTypes: FreightBodyType[]
  loadTypes: FreightLoadType[]
  /** Min. stawka PLN/km (0 = bez limitu) */
  minRatePerKmPln: number
  /** Min. cena całkowita PLN */
  minFreightPln: number
  /** Max waga pojedynczego ładunku (kg) — zgodnie z flotą */
  maxWeightKg: number
  /** Min. LDM jeśli firma jeździ LTL */
  minLdm: number
  /** Tylko ładunki bez ADR */
  excludeAdr: boolean
  /** Wymagana winda / HDS po stronie załadunku */
  requireLift: boolean
  /** Wyklucz kabotaż */
  excludeCabotage: boolean
  /** Min. ocena zleceniodawcy (0 = bez filtra) */
  minShipperRating: number
  /** Max dni płatności (0 = tylko przedpłata / natychmiast) */
  maxPaymentDays: number
  /** Preferowane kraje załadunku (puste = wszystkie) */
  preferredLoadCountries: string[]
  /** Preferowane kraje rozładunku */
  preferredUnloadCountries: string[]
  /** Miasto bazowe — promień poszukiwań (km, 0 = bez filtra) */
  homeBaseCity: string
  homeBaseRadiusKm: number
  /** Koretarz powrotny — szukaj ładunków wzdłuż trasy */
  corridorEnabled: boolean
  corridorFromCity: string
  corridorToCity: string
  /** Zapisane ID ofert */
  savedOfferIds: string[]
  updatedAt: string
}

export const DEFAULT_FREIGHT_PREFERENCES: Omit<FreightSearchPreferences, 'updatedAt'> = {
  sources: ['trans_eu', 'timocom', 'teleroute', 'cargo123', 'email_lead', 'partner_network'],
  scopes: ['domestic', 'international_eu'],
  bodyTypes: ['curtain', 'box'],
  loadTypes: ['ftl', 'ltl'],
  minRatePerKmPln: 0,
  minFreightPln: 0,
  maxWeightKg: 24000,
  minLdm: 0,
  excludeAdr: false,
  requireLift: false,
  excludeCabotage: true,
  minShipperRating: 0,
  maxPaymentDays: 45,
  preferredLoadCountries: ['PL'],
  preferredUnloadCountries: [],
  homeBaseCity: 'Wrocław',
  homeBaseRadiusKm: 0,
  corridorEnabled: false,
  corridorFromCity: '',
  corridorToCity: '',
  savedOfferIds: [],
}

export function loadFreightPreferences(tenantId: string): FreightSearchPreferences {
  const raw = readTenantData<Partial<FreightSearchPreferences>>(tenantId, 'freight-board', {})
  return {
    ...DEFAULT_FREIGHT_PREFERENCES,
    ...raw,
    updatedAt: raw.updatedAt ?? new Date().toISOString(),
  }
}

export function saveFreightPreferences(
  tenantId: string,
  prefs: FreightSearchPreferences,
): void {
  writeTenantData(tenantId, 'freight-board', { ...prefs, updatedAt: new Date().toISOString() })
}

export function toggleSavedOffer(tenantId: string, offerId: string): FreightSearchPreferences {
  const prefs = loadFreightPreferences(tenantId)
  const set = new Set(prefs.savedOfferIds)
  if (set.has(offerId)) set.delete(offerId)
  else set.add(offerId)
  const next = { ...prefs, savedOfferIds: [...set] }
  saveFreightPreferences(tenantId, next)
  return next
}
