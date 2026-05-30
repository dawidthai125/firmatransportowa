/** Zdarzenia domenowe — trigger dla silnika automatyzacji */

export type AutomationEventType =
  | 'daily_report.saved'
  | 'daily_report.shift_ended'
  | 'course.saved'
  | 'course.international'
  | 'compliance.check'
  | 'schedule.weekly'
  | 'schedule.daily'
  | 'sync.completed'
  | 'file.imported'

export interface AutomationEvent {
  type: AutomationEventType
  tenantId: string
  at: string
  payload?: Record<string, unknown>
}

export function createAutomationEvent(
  type: AutomationEventType,
  tenantId: string,
  payload?: Record<string, unknown>,
): AutomationEvent {
  return {
    type,
    tenantId,
    at: new Date().toISOString(),
    payload,
  }
}
