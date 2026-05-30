import type { HelpScreenKey } from './types'

function seenKey(tenantId: string, userId: string, screen: HelpScreenKey): string {
  return `ft-help-seen:${tenantId}:${userId}:${screen}`
}

export function hasSeenHelp(tenantId: string, userId: string, screen: HelpScreenKey): boolean {
  try {
    return localStorage.getItem(seenKey(tenantId, userId, screen)) === '1'
  } catch {
    return false
  }
}

export function markHelpSeen(tenantId: string, userId: string, screen: HelpScreenKey): void {
  try {
    localStorage.setItem(seenKey(tenantId, userId, screen), '1')
  } catch {
    /* ignore */
  }
}

export function resetHelpSeen(tenantId: string, userId: string): void {
  try {
    const prefix = `ft-help-seen:${tenantId}:${userId}:`
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i)
      if (k?.startsWith(prefix)) localStorage.removeItem(k)
    }
  } catch {
    /* ignore */
  }
}
