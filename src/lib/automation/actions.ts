import type { Course } from '@/lib/domain/course'
import { checkDailyDrivingLimit } from '@/lib/domain/driving-time'
import type { DailyReport } from '@/lib/domain/daily-report'
import { loadDailyReports } from '@/lib/domain/daily-reports-store'
import { loadDrivers, seedDemoDrivers } from '@/lib/domain/drivers-store'
import { seedDemoCourses } from '@/lib/domain/courses-store'
import {
  buildCompanyComplianceAlerts,
  buildComplianceAlerts,
} from '@/lib/domain/compliance'
import { seedDemoCompanyDocuments, loadTenantSettingsData } from '@/lib/domain/tenant-settings'
import { loadVehicles, seedDemoVehicles } from '@/lib/domain/vehicles-store'
import { buildDailyReportsCsvFile } from '@/lib/export/documents'
import { storePreviewableFile } from '@/lib/files/files-store'
import type { AutomationActionType } from '@/lib/automation/rules'
import type { AutomationEvent } from '@/lib/automation/events'
import { pushNotification } from '@/lib/automation/notifications-store'
import { pushKeyNow } from '@/lib/cloud-sync'
import { tenantStorageKey } from '@/lib/tenant/types'

export interface ActionContext {
  tenantId: string
  tenantSlug: string
  tenantName: string
  event: AutomationEvent
}

export async function runAutomationAction(
  action: AutomationActionType,
  ctx: ActionContext,
): Promise<void> {
  switch (action) {
    case 'push_notification':
      return
    case 'alert_driving_time':
      await actionAlertDrivingTime(ctx)
      break
    case 'flag_missing_cmr':
      actionFlagMissingCmr(ctx)
      break
    case 'flag_missing_rmpd':
      actionFlagMissingRmpd(ctx)
      break
    case 'save_weekly_csv_to_library':
      await actionSaveWeeklyCsv(ctx)
      break
    case 'flush_sync_now':
      await actionFlushSync(ctx)
      break
  }
}

async function actionAlertDrivingTime(ctx: ActionContext): Promise<void> {
  const report = ctx.event.payload?.report as DailyReport | undefined
  if (!report?.drivingMinutes) return
  const check = checkDailyDrivingLimit(report.drivingMinutes)
  if (check.status === 'ok' && !check.continuousRisk) return

  pushNotification(ctx.tenantId, {
    tenantId: ctx.tenantId,
    title: 'Czas jazdy — 561/2006',
    message:
      check.status === 'exceeded'
        ? `${report.driverName}: przekroczono limit dziennej jazdy (${report.drivingMinutes} min)`
        : `${report.driverName}: zbliża się do limitu jazdy (pozostało ${check.remainingMinutes} min)`,
    level: check.status === 'exceeded' ? 'error' : 'warning',
    ruleId: 'rule-driving-time',
    actionView: 'settlements',
  })
}

function actionFlagMissingCmr(ctx: ActionContext): void {
  const course = ctx.event.payload?.course as Course | undefined
  if (!course || course.scope === 'domestic' || course.cmrNumber?.trim()) return

  pushNotification(ctx.tenantId, {
    tenantId: ctx.tenantId,
    title: 'Brak numeru CMR',
    message: `Kurs ${course.reference} (${course.loadCountry}→${course.unloadCountry}) — uzupełnij CMR przed wyjazdem`,
    level: 'warning',
    ruleId: 'rule-intl-cmr',
    actionView: 'courses',
  })
}

function actionFlagMissingRmpd(ctx: ActionContext): void {
  const course = ctx.event.payload?.course as Course | undefined
  if (!course || course.scope !== 'international_third' || course.rmpdRegistered) return

  pushNotification(ctx.tenantId, {
    tenantId: ctx.tenantId,
    title: 'RMPD / SENT',
    message: `Kurs ${course.reference} poza UE — zarejestruj przewóz w PUESC (RMPD100)`,
    level: 'warning',
    ruleId: 'rule-intl-rmpd',
    actionView: 'courses',
  })
}

async function actionSaveWeeklyCsv(ctx: ActionContext): Promise<void> {
  seedDemoCourses(ctx.tenantId)
  seedDemoDrivers(ctx.tenantId)
  const reports = loadDailyReports(ctx.tenantId)
  const file = buildDailyReportsCsvFile(reports, ctx.tenantSlug)
  file.label = `Auto: raporty tygodniowe ${new Date().toISOString().slice(0, 10)}`
  await storePreviewableFile(ctx.tenantId, file, ['automation', 'weekly'])
  pushNotification(ctx.tenantId, {
    tenantId: ctx.tenantId,
    title: 'Cotygodniowy eksport',
    message: 'CSV raportów zapisany automatycznie w bibliotece Pliki',
    level: 'success',
    ruleId: 'rule-weekly-export',
    actionView: 'files',
  })
}

async function actionFlushSync(ctx: ActionContext): Promise<void> {
  const keys = ['daily-reports', 'courses', 'files'] as const
  for (const k of keys) {
    await pushKeyNow(tenantStorageKey(ctx.tenantId, k))
  }
}

export function runComplianceCheckNotifications(ctx: ActionContext): void {
  seedDemoDrivers(ctx.tenantId)
  seedDemoVehicles(ctx.tenantId)
  seedDemoCompanyDocuments(ctx.tenantId)

  const drivers = loadDrivers(ctx.tenantId)
  const vehicles = loadVehicles(ctx.tenantId)
  const companyDocs = loadTenantSettingsData(ctx.tenantId).companyDocuments

  const alerts =
    buildComplianceAlerts(ctx.tenantId, drivers, vehicles).length +
    buildCompanyComplianceAlerts(ctx.tenantId, ctx.tenantName, companyDocs).length

  if (alerts === 0) return

  pushNotification(ctx.tenantId, {
    tenantId: ctx.tenantId,
    title: 'Compliance — wymaga uwagi',
    message: `${alerts} dokumentów wygasa lub wygasło — sprawdź moduł Zgodność`,
    level: 'warning',
    ruleId: 'rule-compliance-daily',
    actionView: 'compliance',
  })
}

export function notifyRepairSubmitted(ctx: ActionContext): void {
  const report = ctx.event.payload?.report as import('@/lib/domain/repair-report').RepairReport | undefined
  if (!report) return
  pushNotification(ctx.tenantId, {
    tenantId: ctx.tenantId,
    title: 'Nowa awaria pojazdu',
    message: `${report.reference}: ${report.vehicleRegistration} — ${report.title}`,
    level: report.severity === 'immobilized' ? 'error' : 'warning',
    ruleId: 'rule-repair-submitted',
    actionView: 'repairs',
  })
}

export function notifyShiftEnded(ctx: ActionContext, report: DailyReport): void {
  pushNotification(ctx.tenantId, {
    tenantId: ctx.tenantId,
    title: 'Koniec zmiany',
    message: `${report.driverName} zakończył pracę · ${report.kmDriven} km`,
    level: 'info',
    ruleId: 'rule-shift-ended',
    actionView: 'reports',
  })
}
