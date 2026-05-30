export type UserRole = 'owner' | 'dispatcher' | 'driver'

export type AppMode = 'login' | 'owner' | 'dispatcher' | 'driver'

export interface SessionUser {
  id: string
  displayName: string
  role: UserRole
  tenantId: string
}

export interface AuthSession {
  user: SessionUser
  tenantId: string
  loggedInAt: string
}

const SESSION_KEY = 'ft-session'

export function loadSession(): AuthSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AuthSession
  } catch {
    return null
  }
}

export function saveSession(session: AuthSession): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function clearSession(): void {
  sessionStorage.removeItem(SESSION_KEY)
}

export function roleToAppMode(role: UserRole): AppMode {
  switch (role) {
    case 'owner':
      return 'owner'
    case 'dispatcher':
      return 'dispatcher'
    case 'driver':
      return 'driver'
  }
}

export const ROLE_LABELS: Record<UserRole, string> = {
  owner: 'Właściciel / Admin',
  dispatcher: 'Dyspozytor',
  driver: 'Kierowca',
}
