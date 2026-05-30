import type { Course } from '@/lib/domain/course'
import type { FreightOffer } from '@/lib/domain/freight-offer'

/** Mapuje ofertę z giełdy na szkic kursu w systemie */
export function freightOfferToCourse(offer: FreightOffer): Course {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    tenantId: offer.tenantId,
    reference: offer.reference,
    status: 'planned',
    scope: offer.scope,
    shipper: offer.shipperName,
    consignee: offer.unloadCity,
    cargo: offer.cargoDescription,
    weightKg: offer.weightKg,
    adr: offer.adr,
    loadCity: offer.loadCity,
    unloadCity: offer.unloadCity,
    loadCountry: offer.loadCountry,
    unloadCountry: offer.unloadCountry,
    plannedKm: offer.distanceKm,
    freightPln: offer.freightPln,
    freightEur: offer.freightEur,
    loadAt: `${offer.loadDate}T08:00`,
    unloadAt: offer.unloadDate
      ? `${offer.unloadDate}T18:00`
      : `${offer.loadDate}T20:00`,
    notes: `Utworzono z giełdy (${offer.source}) · ${offer.reference}`,
    createdAt: now,
    updatedAt: now,
  }
}
