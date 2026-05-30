import type { AutomationEvent } from '@/lib/automation/events'
import { getRulesForTrigger } from '@/lib/automation/rules'
import {
  notifyRepairSubmitted,
  notifyShiftEnded,
  runAutomationAction,
  runComplianceCheckNotifications,
  type ActionContext,
} from '@/lib/automation/actions'

export interface AutomationRunResult {
  event: AutomationEvent
  rulesMatched: number
  actionsRun: number
}

let listeners: ((result: AutomationRunResult) => void)[] = []

export function onAutomationRun(cb: (result: AutomationRunResult) => void): () => void {
  listeners.push(cb)
  return () => {
    listeners = listeners.filter((x) => x !== cb)
  }
}

export async function emitAutomationEvent(ctx: ActionContext): Promise<AutomationRunResult> {
  const fullCtx = ctx
  const event = ctx.event
  const rules = getRulesForTrigger(ctx.tenantId, event.type)
  let actionsRun = 0

  if (event.type === 'compliance.check') {
    runComplianceCheckNotifications(fullCtx)
  }

  if (event.type === 'daily_report.shift_ended' && event.payload?.report) {
    notifyShiftEnded(fullCtx, event.payload.report as import('@/lib/domain/daily-report').DailyReport)
  }

  if (event.type === 'repair.submitted') {
    notifyRepairSubmitted(fullCtx)
  }

  for (const rule of rules) {
    for (const action of rule.actions) {
      if (action === 'push_notification') continue
      await runAutomationAction(action, fullCtx)
      actionsRun++
    }
  }

  const result: AutomationRunResult = { event, rulesMatched: rules.length, actionsRun }
  listeners.forEach((cb) => cb(result))
  return result
}
