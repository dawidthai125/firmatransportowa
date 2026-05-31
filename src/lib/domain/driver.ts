import type { DatedDocument } from '@/lib/domain/compliance'

export interface Driver {
  id: string
  tenantId: string
  firstName: string
  lastName: string
  phone: string
  email?: string
  /** C / CE / C+E */
  licenseCategory: string
  adrCertified: boolean
  /** Przypisany pojazd */
  vehicleId?: string
  active: boolean
  documents: DatedDocument[]
  notes?: string
  createdAt: string
  updatedAt: string
  serverSavedAt?: string
}

export function driverDisplayName(d: Driver): string {
  return `${d.firstName} ${d.lastName}`.trim()
}

export function createEmptyDriver(tenantId: string): Omit<Driver, 'id' | 'createdAt' | 'updatedAt'> {
  const in90 = new Date()
  in90.setDate(in90.getDate() + 90)
  const in30 = new Date()
  in30.setDate(in30.getDate() + 30)
  const expired = new Date()
  expired.setDate(expired.getDate() - 5)

  return {
    tenantId,
    firstName: '',
    lastName: '',
    phone: '',
    licenseCategory: 'C+E',
    adrCertified: false,
    active: true,
    documents: [
      { label: 'Prawo jazdy', expiresAt: in90.toISOString().slice(0, 10) },
      { label: 'Kod 95', expiresAt: in30.toISOString().slice(0, 10) },
      { label: 'Badania lekarskie', expiresAt: in90.toISOString().slice(0, 10) },
    ],
  }
}

export const DEFAULT_DRIVER_DOCUMENTS = [
  'Prawo jazdy',
  'Kod 95',
  'CPC (szkolenie okresowe)',
  'Badania lekarskie',
  'Badania psychologiczne',
  'Certyfikat ADR',
]
