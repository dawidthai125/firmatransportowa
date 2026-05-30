import type { Tenant } from './types'
import { createDefaultTenantSettings } from './types'

export const DEMO_TENANT: Tenant = {
  id: 'tenant-demo-001',
  slug: 'DEMO-TRANS',
  name: 'Demo Transport Sp. z o.o.',
  plan: 'trial',
  status: 'active',
  createdAt: '2026-05-30T00:00:00.000Z',
  taxId: '0000000000',
  settings: {
    ...createDefaultTenantSettings(),
    transportScope: 'both',
  },
}

export function seedDemoTenantIfEmpty(): Tenant[] {
  const key = 'ft-tenants-registry'
  const raw = localStorage.getItem(key)
  if (raw) {
    try {
      return JSON.parse(raw) as Tenant[]
    } catch {
      /* fall through */
    }
  }

  const tenants = [DEMO_TENANT]
  localStorage.setItem(key, JSON.stringify(tenants))
  return tenants
}

export function findTenantBySlug(tenants: Tenant[], slug: string): Tenant | undefined {
  const normalized = slug.trim().toUpperCase()
  return tenants.find((t) => t.slug.toUpperCase() === normalized)
}
