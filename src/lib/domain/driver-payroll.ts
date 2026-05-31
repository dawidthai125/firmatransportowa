import type { Course } from '@/lib/domain/course'
import type { DailyReport } from '@/lib/domain/daily-report'
import { dailyReportTotalCosts } from '@/lib/domain/daily-report'
import { readTenantData, writeTenantData } from '@/lib/tenant/storage'

export type DriverPayrollRateType = 'per_km' | 'daily' | 'percent_freight'

export interface DriverPayrollRate {
  id: string
  driverId: string
  rateType: DriverPayrollRateType
  rateValue: number
  updatedAt: string
}

export const PAYROLL_RATE_LABELS: Record<DriverPayrollRateType, string> = {
  per_km: 'Stawka za km (zł)',
  daily: 'Stawka dzienna (zł)',
  percent_freight: 'Procent frachtu (%)',
}

export function loadDriverPayrollRates(tenantId: string): DriverPayrollRate[] {
  return readTenantData<DriverPayrollRate[]>(tenantId, 'driver-payroll-rates', [])
}

export function saveDriverPayrollRates(tenantId: string, rates: DriverPayrollRate[]): void {
  writeTenantData(tenantId, 'driver-payroll-rates', rates)
}

export function upsertDriverPayrollRate(tenantId: string, rate: DriverPayrollRate): DriverPayrollRate[] {
  const rates = loadDriverPayrollRates(tenantId)
  const idx = rates.findIndex((r) => r.driverId === rate.driverId)
  const next = [...rates]
  if (idx >= 0) next[idx] = rate
  else next.push(rate)
  saveDriverPayrollRates(tenantId, next)
  return next
}

export interface DriverPayrollSummary {
  driverId: string
  driverName: string
  totalKm: number
  totalDays: number
  totalFreightPln: number
  totalCostsPln: number
  grossPayPln: number
  rateType: DriverPayrollRateType
  rateValue: number
}

export function buildDriverPayrollSummaries(
  tenantId: string,
  drivers: { id: string; firstName: string; lastName: string }[],
  courses: Course[],
  reports: DailyReport[],
  fromDate: string,
  toDate: string,
): DriverPayrollSummary[] {
  const rates = loadDriverPayrollRates(tenantId)
  const rateByDriver = new Map(rates.map((r) => [r.driverId, r]))

  return drivers.map((d) => {
    const name = `${d.firstName} ${d.lastName}`.trim()
    const driverReports = reports.filter(
      (r) => r.driverName === name && r.date >= fromDate && r.date <= toDate,
    )
    const driverCourses = courses.filter(
      (c) =>
        c.driverId === d.id &&
        (c.status === 'delivered' || c.status === 'completed' || c.status === 'in_transit'),
    )
    const totalKm = driverReports.reduce((s, r) => s + (r.kmDriven ?? 0), 0)
    const totalDays = new Set(driverReports.map((r) => r.date)).size
    const totalFreightPln = driverCourses.reduce((s, c) => s + c.freightPln, 0)
    const totalCostsPln = driverReports.reduce((s, r) => s + dailyReportTotalCosts(r), 0)

    const rate = rateByDriver.get(d.id) ?? {
      id: '',
      driverId: d.id,
      rateType: 'per_km' as const,
      rateValue: 0.45,
      updatedAt: '',
    }

    let grossPayPln = 0
    if (rate.rateType === 'per_km') grossPayPln = totalKm * rate.rateValue
    else if (rate.rateType === 'daily') grossPayPln = totalDays * rate.rateValue
    else grossPayPln = (totalFreightPln * rate.rateValue) / 100

    return {
      driverId: d.id,
      driverName: name,
      totalKm,
      totalDays,
      totalFreightPln,
      totalCostsPln,
      grossPayPln,
      rateType: rate.rateType,
      rateValue: rate.rateValue,
    }
  })
}
