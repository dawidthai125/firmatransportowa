/** Status ważności dokumentu — wspólny dla kierowców i pojazdów. */
export type ExpiryStatus = 'ok' | 'warning' | 'expired'

export interface DatedDocument {
  label: string
  expiresAt: string
}

export function daysUntil(dateIso: string): number {
  const target = new Date(dateIso)
  const now = new Date()
  target.setHours(0, 0, 0, 0)
  now.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - now.getTime()) / 86400000)
}

export function expiryStatus(expiresAt: string, warningDays = 30): ExpiryStatus {
  const days = daysUntil(expiresAt)
  if (days < 0) return 'expired'
  if (days <= warningDays) return 'warning'
  return 'ok'
}

export const EXPIRY_STATUS_LABELS: Record<ExpiryStatus, string> = {
  ok: 'Ważny',
  warning: 'Wygasa wkrótce',
  expired: 'Wygasł',
}

export const EXPIRY_STATUS_COLORS: Record<ExpiryStatus, string> = {
  ok: 'bg-success/15 text-success',
  warning: 'bg-warning/15 text-warning',
  expired: 'bg-danger/15 text-danger',
}

export interface ComplianceAlert {
  id: string
  tenantId: string
  entityType: 'driver' | 'vehicle' | 'company'
  entityId: string
  entityName: string
  documentLabel: string
  expiresAt: string
  status: ExpiryStatus
  daysLeft: number
}

export function buildCompanyComplianceAlerts(
  tenantId: string,
  companyName: string,
  documents: DatedDocument[],
): ComplianceAlert[] {
  const alerts: ComplianceAlert[] = []
  for (const doc of documents) {
    const status = expiryStatus(doc.expiresAt)
    if (status === 'ok') continue
    alerts.push({
      id: `alert-company-${doc.label}`,
      tenantId,
      entityType: 'company',
      entityId: 'company',
      entityName: companyName,
      documentLabel: doc.label,
      expiresAt: doc.expiresAt,
      status,
      daysLeft: daysUntil(doc.expiresAt),
    })
  }
  return alerts
}

export function buildComplianceAlerts(
  tenantId: string,
  drivers: { id: string; firstName: string; lastName: string; documents: DatedDocument[] }[],
  vehicles: { id: string; registration: string; documents: DatedDocument[] }[],
): ComplianceAlert[] {
  const alerts: ComplianceAlert[] = []

  for (const driver of drivers) {
    for (const doc of driver.documents) {
      const status = expiryStatus(doc.expiresAt)
      if (status === 'ok') continue
      alerts.push({
        id: `alert-driver-${driver.id}-${doc.label}`,
        tenantId,
        entityType: 'driver',
        entityId: driver.id,
        entityName: `${driver.firstName} ${driver.lastName}`,
        documentLabel: doc.label,
        expiresAt: doc.expiresAt,
        status,
        daysLeft: daysUntil(doc.expiresAt),
      })
    }
  }

  for (const vehicle of vehicles) {
    for (const doc of vehicle.documents) {
      const status = expiryStatus(doc.expiresAt)
      if (status === 'ok') continue
      alerts.push({
        id: `alert-vehicle-${vehicle.id}-${doc.label}`,
        tenantId,
        entityType: 'vehicle',
        entityId: vehicle.id,
        entityName: vehicle.registration,
        documentLabel: doc.label,
        expiresAt: doc.expiresAt,
        status,
        daysLeft: daysUntil(doc.expiresAt),
      })
    }
  }

  return alerts.sort((a, b) => a.daysLeft - b.daysLeft)
}

export function formatExpiryDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pl-PL')
}
