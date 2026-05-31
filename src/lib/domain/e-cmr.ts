/** e-CMR — elektroniczny list przewozowy (status i podpisy) */
export type ECmrStatus =
  | 'draft'
  | 'signed_shipper'
  | 'in_transit'
  | 'signed_driver'
  | 'signed_consignee'
  | 'completed'

export interface ECmrDocument {
  documentId: string
  status: ECmrStatus
  shipperSignedAt?: string
  shipperSignedBy?: string
  driverSignedAt?: string
  driverSignedBy?: string
  consigneeSignedAt?: string
  consigneeSignedBy?: string
  goodsReceivedOk?: boolean
  remarks?: string
  updatedAt: string
}

export const E_CMR_STATUS_LABELS: Record<ECmrStatus, string> = {
  draft: 'Szkic',
  signed_shipper: 'Podpis nadawcy',
  in_transit: 'W transporcie',
  signed_driver: 'Potwierdzenie kierowcy',
  signed_consignee: 'Podpis odbiorcy',
  completed: 'e-CMR zamknięty',
}

export function createEmptyECmr(): ECmrDocument {
  const now = new Date().toISOString()
  return {
    documentId: `ECMR-${Date.now().toString(36).toUpperCase()}`,
    status: 'draft',
    updatedAt: now,
  }
}

export function advanceECmr(doc: ECmrDocument, signerName: string, role: 'dispatcher' | 'driver'): ECmrDocument {
  const now = new Date().toISOString()
  switch (doc.status) {
    case 'draft':
      return {
        ...doc,
        status: 'signed_shipper',
        shipperSignedAt: now,
        shipperSignedBy: signerName,
        updatedAt: now,
      }
    case 'signed_shipper':
      return { ...doc, status: 'in_transit', updatedAt: now }
    case 'in_transit':
      return {
        ...doc,
        status: 'signed_driver',
        driverSignedAt: now,
        driverSignedBy: signerName,
        updatedAt: now,
      }
    case 'signed_driver':
      if (role === 'driver') return doc
      return {
        ...doc,
        status: 'completed',
        consigneeSignedAt: now,
        consigneeSignedBy: signerName,
        goodsReceivedOk: true,
        updatedAt: now,
      }
    default:
      return doc
  }
}

export function driverSignECmr(doc: ECmrDocument, driverName: string): ECmrDocument {
  if (doc.status !== 'in_transit' && doc.status !== 'signed_shipper') return doc
  const now = new Date().toISOString()
  return {
    ...doc,
    status: 'signed_driver',
    driverSignedAt: now,
    driverSignedBy: driverName,
    updatedAt: now,
  }
}
