import { createAutomationEvent } from '@/lib/automation/events'
import { emitAutomationEvent } from '@/lib/automation/engine'
import { loadAutomationSettings, saveAutomationSettings } from '@/lib/automation/rules'

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function weekStartIso(): string {
  const d = new Date()
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d.toISOString().slice(0, 10)
}

/** Uruchamia harmonogram daily/weekly — max raz dziennie / raz w tygodniu per tenant */
export async function runScheduledAutomations(ctx: {
  tenantId: string
  tenantSlug: string
  tenantName: string
}): Promise<void> {
  const settings = loadAutomationSettings(ctx.tenantId)
  const today = todayIso()
  const weekStart = weekStartIso()

  if (settings.lastDailyRun !== today) {
    await emitAutomationEvent({
      ...ctx,
      event: createAutomationEvent('compliance.check', ctx.tenantId),
    })
    saveAutomationSettings(ctx.tenantId, { ...settings, lastDailyRun: today })
  }

  const isMonday = new Date().getDay() === 1
  if (isMonday && settings.lastWeeklyRun !== weekStart) {
    await emitAutomationEvent({
      ...ctx,
      event: createAutomationEvent('schedule.weekly', ctx.tenantId),
    })
    saveAutomationSettings(ctx.tenantId, {
      ...loadAutomationSettings(ctx.tenantId),
      lastWeeklyRun: weekStart,
    })
  }
}
