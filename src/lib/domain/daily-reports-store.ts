import { fireAutomation } from '@/lib/automation/bridge'
import type { DailyReport } from '@/lib/domain/daily-report'
import { tombstoneDeleteInTenantData } from '@/lib/sync/tombstone'
import {
  type GuardedSaveOptions,
  writeGuardedTenantArrayRecord,
} from '@/lib/sync/guarded-save'
import { readTenantData, writeTenantData } from '@/lib/tenant/storage'

export function loadDailyReports(tenantId: string): DailyReport[] {
  return readTenantData<DailyReport[]>(tenantId, 'daily-reports', [])
}

export function saveDailyReports(tenantId: string, reports: DailyReport[]): void {
  writeTenantData(tenantId, 'daily-reports', reports)
}

export function upsertDailyReport(tenantId: string, report: DailyReport): DailyReport[] {
  const reports = loadDailyReports(tenantId)
  const idx = reports.findIndex((r) => r.id === report.id)
  const next = [...reports]
  if (idx >= 0) next[idx] = report
  else next.unshift(report)
  saveDailyReports(tenantId, next)
  fireAutomation(tenantId, 'daily_report.saved', { report })
  if (report.shiftEnded) {
    fireAutomation(tenantId, 'daily_report.shift_ended', { report })
  }
  return next
}

export async function upsertDailyReportGuarded(
  tenantId: string,
  report: DailyReport,
  options?: GuardedSaveOptions,
): Promise<DailyReport[]> {
  const next = await writeGuardedTenantArrayRecord(
    tenantId,
    'daily-reports',
    report,
    loadDailyReports,
    saveDailyReports,
    options,
  )
  fireAutomation(tenantId, 'daily_report.saved', { report })
  if (report.shiftEnded) {
    fireAutomation(tenantId, 'daily_report.shift_ended', { report })
  }
  return next
}

export function deleteDailyReport(tenantId: string, reportId: string): DailyReport[] {
  tombstoneDeleteInTenantData(tenantId, 'daily-reports', reportId)
  return loadDailyReports(tenantId)
}

export function getTodayReportForDriver(
  tenantId: string,
  driverName: string,
): DailyReport | undefined {
  const today = new Date().toISOString().slice(0, 10)
  return loadDailyReports(tenantId).find(
    (r) => r.driverName === driverName && r.date === today,
  )
}

export function seedDemoDailyReports(tenantId: string): DailyReport[] {
  const existing = loadDailyReports(tenantId)
  if (existing.length > 0) return existing

  const now = new Date().toISOString()
  const today = now.slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

  const demo: DailyReport[] = [
    {
      id: 'report-demo-001',
      tenantId,
      date: yesterday,
      driverName: 'Jan Kowalski',
      courseId: 'course-demo-001',
      courseReference: 'K/2026/001',
      kmDriven: 420,
      fuelLiters: 118,
      fuelCostPln: 720,
      tollPln: 45,
      drivingMinutes: 555,
      restMinutes: 90,
      borderCrossings: 'Świecko → Forst',
      shiftEnded: true,
      shiftEndedAt: now,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'report-demo-002',
      tenantId,
      date: today,
      driverName: 'Piotr Nowak',
      courseId: 'course-demo-003',
      courseReference: 'K/2026/INT-01',
      kmDriven: 310,
      fuelLiters: 95,
      fuelCostPln: 580,
      tollEur: 42,
      drivingMinutes: 515,
      restMinutes: 60,
      notes: 'Trasa międzynarodowa PL→DE',
      shiftEnded: false,
      createdAt: now,
      updatedAt: now,
    },
  ]

  saveDailyReports(tenantId, demo)
  return demo
}
