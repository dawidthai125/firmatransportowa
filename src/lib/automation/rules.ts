import { readTenantData, writeTenantData } from '@/lib/tenant/storage'
import type { AutomationEventType } from '@/lib/automation/events'

export type AutomationActionType =
  | 'push_notification'
  | 'save_weekly_csv_to_library'
  | 'flush_sync_now'
  | 'flag_missing_cmr'
  | 'flag_missing_rmpd'
  | 'alert_driving_time'

export interface AutomationRule {
  id: string
  name: string
  description: string
  enabled: boolean
  trigger: AutomationEventType
  actions: AutomationActionType[]
}

export interface AutomationSettings {
  rules: AutomationRule[]
  /** Ostatnie uruchomienie harmonogramów */
  lastDailyRun?: string
  lastWeeklyRun?: string
}

const DEFAULT_RULES: AutomationRule[] = [
  {
    id: 'rule-driving-time',
    name: 'Alert 561/2006 po raporcie',
    description: 'Powiadomienie gdy kierowca przekroczy lub zbliży się do limitu jazdy',
    enabled: true,
    trigger: 'daily_report.saved',
    actions: ['alert_driving_time', 'push_notification'],
  },
  {
    id: 'rule-shift-ended',
    name: 'Koniec zmiany kierowcy',
    description: 'Powiadom dyspozytora gdy kierowca kończy pracę',
    enabled: true,
    trigger: 'daily_report.shift_ended',
    actions: ['push_notification', 'flush_sync_now'],
  },
  {
    id: 'rule-intl-cmr',
    name: 'Brak CMR na kursie międzynarodowym',
    description: 'Flaga gdy kurs UE/poza UE bez numeru CMR',
    enabled: true,
    trigger: 'course.international',
    actions: ['flag_missing_cmr', 'push_notification'],
  },
  {
    id: 'rule-intl-rmpd',
    name: 'Brak RMPD poza UE',
    description: 'Przypomnienie rejestracji SENT/RMPD',
    enabled: true,
    trigger: 'course.international',
    actions: ['flag_missing_rmpd', 'push_notification'],
  },
  {
    id: 'rule-compliance-daily',
    name: 'Codzienny przegląd compliance',
    description: 'Alert o wygasających dokumentach przy starcie aplikacji',
    enabled: true,
    trigger: 'compliance.check',
    actions: ['push_notification'],
  },
  {
    id: 'rule-weekly-export',
    name: 'Cotygodniowy eksport raportów',
    description: 'W poniedziałek zapis CSV raportów do biblioteki Pliki',
    enabled: true,
    trigger: 'schedule.weekly',
    actions: ['save_weekly_csv_to_library', 'push_notification'],
  },
  {
    id: 'rule-repair-submitted',
    name: 'Nowe zgłoszenie awarii',
    description: 'Powiadomienie gdy kierowca zgłosi problem z pojazdem',
    enabled: true,
    trigger: 'repair.submitted',
    actions: ['push_notification'],
  },
  {
    id: 'rule-repair-to-mechanic',
    name: 'Awaria wysłana do mechanika',
    description: 'Powiadomienie po weryfikacji i przekazaniu do warsztatu',
    enabled: true,
    trigger: 'repair.sent_to_mechanic',
    actions: ['push_notification', 'flush_sync_now'],
  },
  {
    id: 'rule-repair-scheduled',
    name: 'Termin naprawy ustalony',
    description: 'Mechanik wyznaczył termin — właściciel i dyspozytor widzą w Awarie',
    enabled: true,
    trigger: 'repair.scheduled',
    actions: ['push_notification'],
  },
  {
    id: 'rule-repair-awaiting-driver',
    name: 'Mechanik prosi o kontakt z kierowcą',
    description: 'Alert gdy warsztat potrzebuje dogadania szczegółów',
    enabled: true,
    trigger: 'repair.awaiting_driver',
    actions: ['push_notification'],
  },
  {
    id: 'rule-sync-critical',
    name: 'Sync natychmiast po krytycznym zdarzeniu',
    description: 'Wysyłka danych do chmury bez czekania 2 s',
    enabled: true,
    trigger: 'daily_report.shift_ended',
    actions: ['flush_sync_now'],
  },
]

export function loadAutomationSettings(tenantId: string): AutomationSettings {
  const data = readTenantData<AutomationSettings>(tenantId, 'automation', { rules: [] })
  const base = data.rules.length === 0 ? DEFAULT_RULES.map((r) => ({ ...r })) : data.rules
  const merged = mergeMissingRules(base, DEFAULT_RULES)
  if (merged !== base) {
    saveAutomationSettings(tenantId, { ...data, rules: merged })
  }
  return { ...data, rules: merged }
}

/** Dodaje nowe domyślne reguły bez nadpisywania istniejących (np. po aktualizacji app) */
function mergeMissingRules(existing: AutomationRule[], defaults: AutomationRule[]): AutomationRule[] {
  const ids = new Set(existing.map((r) => r.id))
  const missing = defaults.filter((d) => !ids.has(d.id)).map((r) => ({ ...r }))
  return missing.length > 0 ? [...existing, ...missing] : existing
}

export function saveAutomationSettings(tenantId: string, settings: AutomationSettings): void {
  writeTenantData(tenantId, 'automation', settings)
}

export function toggleAutomationRule(tenantId: string, ruleId: string, enabled: boolean): AutomationSettings {
  const settings = loadAutomationSettings(tenantId)
  const next = {
    ...settings,
    rules: settings.rules.map((r) => (r.id === ruleId ? { ...r, enabled } : r)),
  }
  saveAutomationSettings(tenantId, next)
  return next
}

export function getRulesForTrigger(
  tenantId: string,
  trigger: AutomationEventType,
): AutomationRule[] {
  return loadAutomationSettings(tenantId).rules.filter((r) => r.enabled && r.trigger === trigger)
}
