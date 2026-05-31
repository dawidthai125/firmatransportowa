/** Źródło oferty — agregacja z wielu kanałów pozyskiwania frachtu */
export type FreightSource =
  | 'trans_eu'
  | 'timocom'
  | 'teleroute'
  | 'cargo123'
  | 'transporeon'
  | 'wtransnet'
  | 'b2pweb'
  | 'freightlink'
  | 'email_lead'
  | 'ocr_rate_con'
  | 'partner_network'
  | 'internal_board'

export type FreightBodyType =
  | 'curtain'
  | 'box'
  | 'frigo'
  | 'platform'
  | 'tank'
  | 'mega'
  | 'container'
  | 'tipper'

export type FreightLoadType = 'ftl' | 'ltl'

export type FreightScope = 'domestic' | 'international_eu' | 'international_third'

export interface FreightOffer {
  id: string
  tenantId: string
  source: FreightSource
  reference: string
  /** Miasto / kod załadunku */
  loadCity: string
  loadCountry: string
  unloadCity: string
  unloadCountry: string
  loadDate: string
  unloadDate?: string
  bodyType: FreightBodyType
  loadType: FreightLoadType
  scope: FreightScope
  weightKg: number
  /** Metry ładowne */
  ldm?: number
  palletCount?: number
  adr: boolean
  liftRequired: boolean
  /** Cena frachtu PLN (0 = tylko EUR) */
  freightPln: number
  freightEur?: number
  /** Stawka za km — do szybkiej oceny opłacalności */
  ratePerKmPln?: number
  distanceKm?: number
  /** Dni płatności — 0 = przedpłata */
  paymentDays: number
  /** Ocena zleceniodawcy 1–5 (jeśli znana) */
  shipperRating?: number
  /** Kabotaż w kraju docelowym */
  isCabotage?: boolean
  cargoDescription: string
  shipperName: string
  /** Czy wymaga certyfikatu ADR klasy */
  adrClass?: string
  postedAt: string
}

export const FREIGHT_SOURCE_LABELS: Record<FreightSource, string> = {
  trans_eu: 'Trans.eu',
  timocom: 'TimoCom',
  teleroute: 'Teleroute',
  cargo123: '123cargo',
  transporeon: 'Transporeon',
  wtransnet: 'Wtransnet',
  b2pweb: 'B2PWeb',
  freightlink: 'Freightlink',
  email_lead: 'Lead e-mail',
  ocr_rate_con: 'OCR rate con',
  partner_network: 'Sieć partnerska',
  internal_board: 'Giełda wewnętrzna',
}

export const FREIGHT_BODY_LABELS: Record<FreightBodyType, string> = {
  curtain: 'Plandeka',
  box: 'Furgon / box',
  frigo: 'Chłodnia',
  platform: 'Platforma',
  tank: 'Cysterna',
  mega: 'Mega / jumbo',
  container: 'Kontener',
  tipper: 'Wywrotka',
}

export function freightPriceDisplay(o: FreightOffer): string {
  if (o.freightPln > 0) return `${o.freightPln.toLocaleString('pl-PL')} zł`
  if (o.freightEur && o.freightEur > 0) return `${o.freightEur.toLocaleString('pl-PL')} EUR`
  return 'Do negocjacji'
}

export function freightRouteLabel(o: FreightOffer): string {
  return `${o.loadCity} (${o.loadCountry}) → ${o.unloadCity} (${o.unloadCountry})`
}
