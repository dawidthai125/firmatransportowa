import type { DailyReport } from '@/lib/domain/daily-report'
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
  return next
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
