import type { DatedDocument } from '@/lib/domain/compliance'

export type VehicleType = 'truck' | 'trailer' | 'set'

export interface Vehicle {
  id: string
  tenantId: string
  registration: string
  type: VehicleType
  brand?: string
  model?: string
  /** Rok produkcji */
  year?: number
  /** ADR — zezwolenie na przewóz */
  adrEnabled: boolean
  active: boolean
  documents: DatedDocument[]
  /** Ostatni znany przebieg km */
  odometerKm?: number
  notes?: string
  createdAt: string
  updatedAt: string
  serverSavedAt?: string
}

export const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
  truck: 'Ciągnik',
  trailer: 'Naczepa',
  set: 'Zestaw',
}

export function createEmptyVehicle(tenantId: string): Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'> {
  const in60 = new Date()
  in60.setDate(in60.getDate() + 60)
  const in14 = new Date()
  in14.setDate(in14.getDate() + 14)

  return {
    tenantId,
    registration: '',
    type: 'truck',
    adrEnabled: false,
    active: true,
    documents: [
      { label: 'Przegląd techniczny', expiresAt: in14.toISOString().slice(0, 10) },
      { label: 'Ubezpieczenie OC', expiresAt: in60.toISOString().slice(0, 10) },
      { label: 'Legalizacja tachografu', expiresAt: in60.toISOString().slice(0, 10) },
    ],
  }
}

export const DEFAULT_VEHICLE_DOCUMENTS = [
  'Przegląd techniczny',
  'Ubezpieczenie OC',
  'Ubezpieczenie AC',
  'Legalizacja tachografu',
  'Zezwolenie ADR (pojazd)',
]
