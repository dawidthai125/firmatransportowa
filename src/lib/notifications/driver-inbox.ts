export type DriverNotificationLevel = 'info' | 'warning' | 'success'

export interface DriverNotification {
  id: string
  title: string
  message: string
  level: DriverNotificationLevel
  createdAt: string
  read: boolean
  actionView?: 'home' | 'report' | 'issue' | 'courses' | 'profile'
}

function storageKey(tenantId: string, driverName: string): string {
  return `ft-driver-inbox:${tenantId}:${driverName.trim().toLowerCase()}`
}

export function loadDriverNotifications(tenantId: string, driverName: string): DriverNotification[] {
  try {
    const raw = localStorage.getItem(storageKey(tenantId, driverName))
    if (!raw) return []
    return JSON.parse(raw) as DriverNotification[]
  } catch {
    return []
  }
}

export function saveDriverNotifications(
  tenantId: string,
  driverName: string,
  items: DriverNotification[],
): void {
  localStorage.setItem(storageKey(tenantId, driverName), JSON.stringify(items.slice(0, 30)))
}

export function pushDriverNotification(
  tenantId: string,
  driverName: string,
  n: Omit<DriverNotification, 'id' | 'createdAt' | 'read'>,
): DriverNotification {
  const item: DriverNotification = {
    ...n,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    read: false,
  }
  const existing = loadDriverNotifications(tenantId, driverName)
  saveDriverNotifications(tenantId, driverName, [item, ...existing])
  return item
}

export function markDriverNotificationRead(
  tenantId: string,
  driverName: string,
  id: string,
): void {
  saveDriverNotifications(
    tenantId,
    driverName,
    loadDriverNotifications(tenantId, driverName).map((n) =>
      n.id === id ? { ...n, read: true } : n,
    ),
  )
}

export function driverUnreadCount(tenantId: string, driverName: string): number {
  return loadDriverNotifications(tenantId, driverName).filter((n) => !n.read).length
}
