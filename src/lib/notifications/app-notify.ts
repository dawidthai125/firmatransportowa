import { ensureNotificationPermission } from '@/lib/notifications/web-notify'

export interface AppNotificationOptions {
  tag?: string
  data?: Record<string, string>
  requireInteraction?: boolean
}

/** Powiadomienie przez Service Worker (działa w tle PWA) lub fallback Notification API */
export async function showAppNotification(
  title: string,
  body: string,
  options?: AppNotificationOptions,
): Promise<void> {
  const payload = {
    title,
    body,
    icon: '/pwa-192x192.png',
    badge: '/pwa-64x64.png',
    tag: options?.tag ?? `ft-${title}`,
    data: options?.data,
    requireInteraction: options?.requireInteraction ?? false,
  }

  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready
      if (reg.showNotification) {
        const perm = await ensureNotificationPermission()
        if (perm === 'granted') {
          await reg.showNotification(title, payload)
          return
        }
      }
    } catch {
      /* fallback */
    }
  }

  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    new Notification(title, { body, tag: payload.tag, data: options?.data })
  }
}

const PUSH_SUB_KEY = 'ft-push-subscription'

/** Zapis subskrypcji push (prod: wysyłka z Edge + VAPID) */
export async function subscribeAppPush(): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false
  const perm = await ensureNotificationPermission()
  if (perm !== 'granted') return false

  try {
    const reg = await navigator.serviceWorker.ready
    const existing = localStorage.getItem(PUSH_SUB_KEY)
    if (existing) return true

    const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined
    if (vapidKey) {
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })
      localStorage.setItem(PUSH_SUB_KEY, JSON.stringify(sub.toJSON()))
    } else {
      localStorage.setItem(PUSH_SUB_KEY, JSON.stringify({ demo: true, at: new Date().toISOString() }))
    }
    return true
  } catch {
    return false
  }
}

export function isPushSubscribed(): boolean {
  return Boolean(localStorage.getItem(PUSH_SUB_KEY))
}

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const buffer = new ArrayBuffer(raw.length)
  const out = new Uint8Array(buffer)
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}
