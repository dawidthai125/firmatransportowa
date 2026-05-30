export type RepairSeverity = 'minor' | 'major' | 'critical' | 'immobilized'

export type RepairReportStatus =
  | 'submitted'
  | 'rejected'
  | 'at_mechanic'
  | 'scheduled'
  | 'awaiting_driver'
  | 'in_repair'
  | 'completed'

export interface RepairPhoto {
  id: string
  filename: string
  mimeType: string
  dataBase64: string
}

export interface RepairReport {
  id: string
  tenantId: string
  reference: string
  status: RepairReportStatus
  severity: RepairSeverity
  driverId?: string
  driverName: string
  driverPhone?: string
  vehicleId?: string
  vehicleRegistration: string
  title: string
  description: string
  location?: string
  photos: RepairPhoto[]
  submittedAt: string
  verifiedBy?: string
  verifiedAt?: string
  verificationNote?: string
  rejectedReason?: string
  mechanicId?: string
  mechanicName?: string
  sentToMechanicAt?: string
  scheduledRepairAt?: string
  mechanicMessage?: string
  mechanicNotes?: string
  /** Diagnoza — co było zepsute (widoczne kierowca + admin + mechanik) */
  diagnosis?: string
  /** Lista wymienionych części */
  partsReplaced?: string
  /** Opis wykonanych prac po naprawie */
  repairSummary?: string
  /** Koszt naprawy PLN — tylko właściciel w UI */
  repairCostPln?: number
  completedAt?: string
  updatedAt: string
}

export const REPAIR_STATUS_LABELS: Record<RepairReportStatus, string> = {
  submitted: 'Oczekuje weryfikacji',
  rejected: 'Odrzucone',
  at_mechanic: 'U mechanika',
  scheduled: 'Termin ustalony',
  awaiting_driver: 'Kontakt z kierowcą',
  in_repair: 'W naprawie',
  completed: 'Zakończone',
}

export const REPAIR_STATUS_COLORS: Record<RepairReportStatus, string> = {
  submitted: 'bg-warning/15 text-warning',
  rejected: 'bg-danger/15 text-danger',
  at_mechanic: 'bg-primary/15 text-primary',
  scheduled: 'bg-accent text-accent-foreground',
  awaiting_driver: 'bg-warning/15 text-warning',
  in_repair: 'bg-primary/15 text-primary',
  completed: 'bg-success/15 text-success',
}

export const REPAIR_SEVERITY_LABELS: Record<RepairSeverity, string> = {
  minor: 'Drobna usterka',
  major: 'Poważna awaria',
  critical: 'Krytyczna — ograniczona jezdność',
  immobilized: 'Pojazd unieruchomiony',
}

export function createEmptyRepairReport(
  tenantId: string,
  driverName: string,
): Omit<RepairReport, 'id' | 'reference' | 'submittedAt' | 'updatedAt'> {
  return {
    tenantId,
    status: 'submitted',
    severity: 'major',
    driverName,
    vehicleRegistration: '',
    title: '',
    description: '',
    photos: [],
  }
}

export function nextRepairReference(existingCount: number): string {
  return `AW/${new Date().getFullYear()}/${String(existingCount + 1).padStart(3, '0')}`
}
