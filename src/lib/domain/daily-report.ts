export interface DailyReport {
  id: string
  tenantId: string
  /** Data raportu YYYY-MM-DD */
  date: string
  driverId?: string
  driverName: string
  courseId?: string
  courseReference?: string
  kmDriven: number
  fuelLiters?: number
  fuelCostPln?: number
  tollPln?: number
  tollEur?: number
  parkingPln?: number
  otherCostsPln?: number
  /** Minuty jazdy (deklaracja kierowcy) */
  drivingMinutes?: number
  /** Minuty postoju / załadunek / rozładunek */
  restMinutes?: number
  borderCrossings?: string
  notes?: string
  shiftEnded: boolean
  shiftEndedAt?: string
  createdAt: string
  updatedAt: string
}

export function dailyReportTotalCosts(r: DailyReport): number {
  return (r.fuelCostPln ?? 0) + (r.tollPln ?? 0) + (r.parkingPln ?? 0) + (r.otherCostsPln ?? 0)
}

export function createEmptyDailyReport(
  tenantId: string,
  driverName: string,
  driverId?: string,
): Omit<DailyReport, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    tenantId,
    date: new Date().toISOString().slice(0, 10),
    driverId,
    driverName,
    kmDriven: 0,
    shiftEnded: false,
  }
}
