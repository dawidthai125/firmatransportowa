import { createAutomationEvent, type AutomationEventType } from '@/lib/automation/events'
import { emitAutomationEvent } from '@/lib/automation/engine'
import { loadTenantsRegistry } from '@/lib/tenant/storage'

export function fireAutomation(
  tenantId: string,
  type: AutomationEventType,
  payload?: Record<string, unknown>,
): void {
  const tenant = loadTenantsRegistry().find((t) => t.id === tenantId)
  void emitAutomationEvent({
    tenantId,
    tenantSlug: tenant?.slug ?? 'tenant',
    tenantName: tenant?.name ?? 'Firma',
    event: createAutomationEvent(type, tenantId, payload),
  })
}
