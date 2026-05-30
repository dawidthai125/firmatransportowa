import { fireAutomation } from '@/lib/automation/bridge'
import type { RepairReport } from '@/lib/domain/repair-report'
import { nextRepairReference } from '@/lib/domain/repair-report'
import { readTenantData, writeTenantData } from '@/lib/tenant/storage'

export function loadRepairReports(tenantId: string): RepairReport[] {
  return readTenantData<RepairReport[]>(tenantId, 'repair-reports', [])
}

export function saveRepairReports(tenantId: string, reports: RepairReport[]): void {
  writeTenantData(tenantId, 'repair-reports', reports)
}

export function upsertRepairReport(tenantId: string, report: RepairReport): RepairReport[] {
  const reports = loadRepairReports(tenantId)
  const idx = reports.findIndex((r) => r.id === report.id)
  const next = [...reports]
  if (idx >= 0) next[idx] = report
  else next.unshift(report)
  saveRepairReports(tenantId, next)
  return next
}

export function submitRepairReport(tenantId: string, report: RepairReport): RepairReport[] {
  const saved = {
    ...report,
    status: 'submitted' as const,
    updatedAt: new Date().toISOString(),
  }
  const next = upsertRepairReport(tenantId, saved)
  fireAutomation(tenantId, 'repair.submitted', { report: saved })
  return next
}

export function seedDemoRepairReports(tenantId: string): RepairReport[] {
  const existing = loadRepairReports(tenantId)
  if (existing.length > 0) return existing

  const now = new Date().toISOString()
  const demo: RepairReport[] = [
    {
      id: 'repair-demo-001',
      tenantId,
      reference: 'AW/2026/001',
      status: 'submitted',
      severity: 'immobilized',
      driverName: 'Piotr Nowak',
      driverPhone: '+48 600 300 400',
      vehicleId: 'vehicle-demo-001',
      vehicleRegistration: 'DW 12345',
      title: 'Awaria skrzyni biegów',
      description: 'Trzaski przy redukcji, kontrolka skrzyni. Pojazd stoi na MOP A4 km 180.',
      location: 'A4, MOP Brzoza k. Wrocławia',
      photos: [],
      submittedAt: now,
      updatedAt: now,
    },
  ]
  saveRepairReports(tenantId, demo)
  return demo
}

export function sendReportToMechanic(
  tenantId: string,
  reportId: string,
  mechanic: { id: string; name: string },
  verifiedBy: string,
  note?: string,
): RepairReport[] {
  const reports = loadRepairReports(tenantId)
  const report = reports.find((r) => r.id === reportId)
  if (!report) return reports

  const now = new Date().toISOString()
  const updated: RepairReport = {
    ...report,
    status: 'at_mechanic',
    mechanicId: mechanic.id,
    mechanicName: mechanic.name,
    verifiedBy,
    verifiedAt: now,
    verificationNote: note,
    sentToMechanicAt: now,
    updatedAt: now,
  }
  const next = upsertRepairReport(tenantId, updated)
  fireAutomation(tenantId, 'repair.sent_to_mechanic', { report: updated })
  return next
}

export function rejectRepairReport(
  tenantId: string,
  reportId: string,
  verifiedBy: string,
  reason: string,
): RepairReport[] {
  const reports = loadRepairReports(tenantId)
  const report = reports.find((r) => r.id === reportId)
  if (!report) return reports

  const updated: RepairReport = {
    ...report,
    status: 'rejected',
    verifiedBy,
    verifiedAt: new Date().toISOString(),
    rejectedReason: reason,
    updatedAt: new Date().toISOString(),
  }
  return upsertRepairReport(tenantId, updated)
}

export function mechanicScheduleRepair(
  tenantId: string,
  reportId: string,
  scheduledAt: string,
  notes?: string,
): RepairReport[] {
  const report = loadRepairReports(tenantId).find((r) => r.id === reportId)
  if (!report) return loadRepairReports(tenantId)

  const updated: RepairReport = {
    ...report,
    status: 'scheduled',
    scheduledRepairAt: scheduledAt,
    mechanicNotes: notes ?? report.mechanicNotes,
    updatedAt: new Date().toISOString(),
  }
  const next = upsertRepairReport(tenantId, updated)
  fireAutomation(tenantId, 'repair.scheduled', { report: updated })
  return next
}

export function mechanicRequestDriverContact(
  tenantId: string,
  reportId: string,
  message: string,
): RepairReport[] {
  const report = loadRepairReports(tenantId).find((r) => r.id === reportId)
  if (!report) return loadRepairReports(tenantId)

  const updated: RepairReport = {
    ...report,
    status: 'awaiting_driver',
    mechanicMessage: message,
    updatedAt: new Date().toISOString(),
  }
  return upsertRepairReport(tenantId, updated)
}

export function mechanicMarkInRepair(tenantId: string, reportId: string): RepairReport[] {
  const report = loadRepairReports(tenantId).find((r) => r.id === reportId)
  if (!report) return loadRepairReports(tenantId)
  return upsertRepairReport(tenantId, {
    ...report,
    status: 'in_repair',
    updatedAt: new Date().toISOString(),
  })
}

export function mechanicCompleteRepair(tenantId: string, reportId: string): RepairReport[] {
  const report = loadRepairReports(tenantId).find((r) => r.id === reportId)
  if (!report) return loadRepairReports(tenantId)
  const now = new Date().toISOString()
  return upsertRepairReport(tenantId, {
    ...report,
    status: 'completed',
    completedAt: now,
    updatedAt: now,
  })
}

export function createNewRepairReport(
  tenantId: string,
  partial: Omit<RepairReport, 'id' | 'reference' | 'submittedAt' | 'updatedAt' | 'status'>,
): RepairReport {
  const now = new Date().toISOString()
  const count = loadRepairReports(tenantId).length
  return {
    ...partial,
    id: crypto.randomUUID(),
    reference: nextRepairReference(count),
    status: 'submitted',
    submittedAt: now,
    updatedAt: now,
  }
}
