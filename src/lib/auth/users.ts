/** Przygotowanie pod Supabase Auth — demo użytkownicy per tenant */
export interface TenantUserRecord {
  id: string
  tenantId: string
  email: string
  role: 'owner' | 'dispatcher' | 'driver' | 'mechanic'
  displayName: string
  mechanicId?: string
  pin?: string
}

const BASE_USERS: Omit<TenantUserRecord, 'email'>[] = [
  {
    id: 'user-owner-demo',
    tenantId: 'tenant-demo-001',
    role: 'owner',
    displayName: 'Jan Tajski',
  },
  {
    id: 'user-dispatcher-demo',
    tenantId: 'tenant-demo-001',
    role: 'dispatcher',
    displayName: 'Anna Dyspozytor',
  },
  {
    id: 'user-driver-demo',
    tenantId: 'tenant-demo-001',
    role: 'driver',
    displayName: 'Jan Kowalski',
    pin: '1234',
  },
  {
    id: 'user-mechanic-demo',
    tenantId: 'tenant-demo-001',
    role: 'mechanic',
    displayName: 'Tomasz Mechanik',
    mechanicId: 'mechanic-demo-001',
  },
]

function withEmails(domain: 'tajski-trans.pl' | 'demo-trans.pl'): TenantUserRecord[] {
  const map: Record<string, string> = {
    owner: `wlasciciel@${domain}`,
    dispatcher: `dyspozytor@${domain}`,
    driver: `jan.kowalski@${domain}`,
    mechanic: `mechanik@${domain}`,
  }
  return BASE_USERS.map((u) => ({ ...u, email: map[u.role] }))
}

export const DEMO_TENANT_USERS: TenantUserRecord[] = [
  ...withEmails('tajski-trans.pl'),
  ...withEmails('demo-trans.pl'),
]

export function findDemoUserByEmail(tenantId: string, email: string): TenantUserRecord | undefined {
  const normalized = email.trim().toLowerCase()
  return DEMO_TENANT_USERS.find(
    (u) => u.tenantId === tenantId && u.email.toLowerCase() === normalized,
  )
}

export const DEMO_PASSWORD = 'demo2026'

export function validateDemoCredentials(
  tenantId: string,
  email: string,
  password: string,
): TenantUserRecord | null {
  if (password !== DEMO_PASSWORD) return null
  return findDemoUserByEmail(tenantId, email) ?? null
}
