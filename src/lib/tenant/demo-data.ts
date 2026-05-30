import { COMPANY_BRANDING, isCompanyDeployment, LEGACY_TENANT_SLUGS } from '@/config/branding'
import type { Tenant } from './types'
import { createDefaultTenantSettings } from './types'

function buildDemoTenant(): Tenant {
  const company = isCompanyDeployment()
  return {
    id: 'tenant-demo-001',
    slug: company ? COMPANY_BRANDING.slug : 'DEMO-TRANS',
    name: company ? COMPANY_BRANDING.name : 'Demo Transport Sp. z o.o.',
    plan: 'trial',
    status: 'active',
    createdAt: '2026-05-30T00:00:00.000Z',
    taxId: company ? '8940000000' : '0000000000',
    settings: {
      ...createDefaultTenantSettings(),
      transportScope: 'both',
    },
  }
}

export const DEMO_TENANT: Tenant = buildDemoTenant()

function normalizeTenantRecord(t: Tenant): Tenant {
  const demo = buildDemoTenant()
  const merged = {
    ...demo,
    ...t,
    slug: (t.slug ?? demo.slug).trim() || demo.slug,
    name: (t.name ?? demo.name).trim() || demo.name,
    settings: {
      ...demo.settings,
      ...(t.settings ?? {}),
      modules: {
        ...demo.settings.modules,
        ...(t.settings?.modules ?? {}),
      },
    },
  }
  if (isCompanyDeployment() && merged.id === 'tenant-demo-001') {
    return {
      ...merged,
      name: COMPANY_BRANDING.name,
      slug: COMPANY_BRANDING.slug,
    }
  }
  return merged
}

function patchRegistryTenants(tenants: Tenant[]): Tenant[] {
  const demo = buildDemoTenant()
  const hasDemo = tenants.some((t) => t.id === demo.id)
  const next = hasDemo
    ? tenants.map((t) =>
        t.id === demo.id
          ? normalizeTenantRecord({
              ...t,
              ...demo,
              settings: {
                ...(t.settings ?? demo.settings),
                modules: {
                  ...(t.settings?.modules ?? demo.settings.modules),
                  gps: true,
                  loadBoard: true,
                  itd: true,
                  tachographImport: true,
                },
              },
            })
          : normalizeTenantRecord(t),
      )
    : [...tenants.map(normalizeTenantRecord), demo]
  return next
}

export function seedDemoTenantIfEmpty(): Tenant[] {
  const key = 'ft-tenants-registry'
  const raw = localStorage.getItem(key)
  let tenants: Tenant[]

  if (raw) {
    try {
      tenants = patchRegistryTenants(JSON.parse(raw) as Tenant[])
    } catch {
      tenants = [buildDemoTenant()]
    }
  } else {
    tenants = [buildDemoTenant()]
  }

  localStorage.setItem(key, JSON.stringify(tenants))
  return tenants
}

export function findTenantBySlug(tenants: Tenant[], slug: string): Tenant | undefined {
  const normalized = (slug ?? '').trim().toUpperCase()
  if (!normalized && isCompanyDeployment()) {
    return getDefaultTenant(tenants)
  }
  const found = tenants.find((t) => (t.slug ?? '').toUpperCase() === normalized)
  if (found) return found

  /** W trybie company jeden tenant — każdy wpis trafia do firmy */
  if (isCompanyDeployment()) {
    const demo = tenants.find((t) => t.id === 'tenant-demo-001')
    if (demo && (LEGACY_TENANT_SLUGS as readonly string[]).includes(normalized)) {
      return demo
    }
    if (demo && !slug.trim()) return demo
  }

  return undefined
}

export function getDefaultTenant(tenants: Tenant[]): Tenant | undefined {
  const slug = isCompanyDeployment() ? COMPANY_BRANDING.slug : 'DEMO-TRANS'
  return findTenantBySlug(tenants, slug) ?? tenants.find((t) => t.id === 'tenant-demo-001')
}

/** Napraw brakujące slug/name po merge z chmury */
export function sanitizeTenantsRegistry(tenants: Tenant[]): Tenant[] {
  return patchRegistryTenants(tenants)
}
