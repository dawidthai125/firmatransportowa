/** Przygotowanie pod Supabase Auth — demo użytkownicy per tenant */
export interface TenantUserRecord {
  id: string
  tenantId: string
  email: string
  role: 'owner' | 'dispatcher' | 'driver'
  displayName: string
  /** PIN kierowcy (dev) — docelowo hash w Supabase */
  pin?: string
}

export const DEMO_TENANT_USERS: TenantUserRecord[] = [
  {
    id: 'user-owner-demo',
    tenantId: 'tenant-demo-001',
    email: 'wlasciciel@demo-trans.pl',
    role: 'owner',
    displayName: 'Właściciel Demo',
  },
  {
    id: 'user-dispatcher-demo',
    tenantId: 'tenant-demo-001',
    email: 'dyspozytor@demo-trans.pl',
    role: 'dispatcher',
    displayName: 'Dyspozytor Demo',
  },
  {
    id: 'user-driver-demo',
    tenantId: 'tenant-demo-001',
    email: 'jan.kowalski@demo-trans.pl',
    role: 'driver',
    displayName: 'Jan Kowalski',
    pin: '1234',
  },
]

export function findDemoUserByEmail(tenantId: string, email: string): TenantUserRecord | undefined {
  const normalized = email.trim().toLowerCase()
  return DEMO_TENANT_USERS.find(
    (u) => u.tenantId === tenantId && u.email.toLowerCase() === normalized,
  )
}

/** Dev: hasło demo dla wszystkich kont testowych */
export const DEMO_PASSWORD = 'demo2026'

export function validateDemoCredentials(
  tenantId: string,
  email: string,
  password: string,
): TenantUserRecord | null {
  if (password !== DEMO_PASSWORD) return null
  return findDemoUserByEmail(tenantId, email) ?? null
}
