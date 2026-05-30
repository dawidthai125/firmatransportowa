export type NotificationLevel = 'info' | 'warning' | 'success' | 'error'

export interface AutomationNotification {
  id: string
  tenantId: string
  title: string
  message: string
  level: NotificationLevel
  ruleId?: string
  createdAt: string
  read: boolean
  /** Opcjonalnie: otwórz plik / widok */
  actionView?: 'compliance' | 'settlements' | 'files' | 'courses' | 'reports' | 'repairs'
}

export function loadNotifications(tenantId: string): AutomationNotification[] {
  try {
    const raw = localStorage.getItem(`ft-${tenantId}-notifications`)
    if (!raw) return []
    return JSON.parse(raw) as AutomationNotification[]
  } catch {
    return []
  }
}

export function saveNotifications(tenantId: string, items: AutomationNotification[]): void {
  localStorage.setItem(`ft-${tenantId}-notifications`, JSON.stringify(items.slice(0, 50)))
}

export function pushNotification(
  tenantId: string,
  n: Omit<AutomationNotification, 'id' | 'createdAt' | 'read'>,
): AutomationNotification {
  const item: AutomationNotification = {
    ...n,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    read: false,
  }
  const existing = loadNotifications(tenantId)
  saveNotifications(tenantId, [item, ...existing])
  return item
}

export function markNotificationRead(tenantId: string, id: string): void {
  saveNotifications(
    tenantId,
    loadNotifications(tenantId).map((n) => (n.id === id ? { ...n, read: true } : n)),
  )
}

export function markAllNotificationsRead(tenantId: string): void {
  saveNotifications(
    tenantId,
    loadNotifications(tenantId).map((n) => ({ ...n, read: true })),
  )
}

export function unreadCount(tenantId: string): number {
  return loadNotifications(tenantId).filter((n) => !n.read).length
}
