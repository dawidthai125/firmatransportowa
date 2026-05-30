let permissionRequested = false

export async function ensureNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof Notification === 'undefined') return 'unsupported'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'
  if (permissionRequested) return Notification.permission
  permissionRequested = true
  return Notification.requestPermission()
}

export async function showWebNotification(title: string, body: string): Promise<void> {
  if (typeof Notification === 'undefined') return
  if (Notification.permission !== 'granted') {
    const perm = await ensureNotificationPermission()
    if (perm !== 'granted') return
  }
  try {
    new Notification(title, { body, tag: `transflow-${title}` })
  } catch {
    /* ignore — iOS / brak uprawnień */
  }
}
