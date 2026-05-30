import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Tenant } from './types'
import { loadTenantsRegistry, saveTenantsRegistry } from './storage'
import { seedDemoTenantIfEmpty } from './demo-data'

interface TenantContextValue {
  tenants: Tenant[]
  currentTenant: Tenant | null
  setCurrentTenant: (tenant: Tenant | null) => void
  refreshTenants: () => void
  registerTenant: (tenant: Tenant) => void
}

const TenantContext = createContext<TenantContextValue | null>(null)

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenants, setTenants] = useState<Tenant[]>(() => seedDemoTenantIfEmpty())
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null)

  const refreshTenants = useCallback(() => {
    setTenants(loadTenantsRegistry())
  }, [])

  const registerTenant = useCallback((tenant: Tenant) => {
    const existing = loadTenantsRegistry()
    const next = [...existing.filter((t) => t.id !== tenant.id), tenant]
    saveTenantsRegistry(next)
    setTenants(next)
  }, [])

  const value = useMemo(
    () => ({
      tenants,
      currentTenant,
      setCurrentTenant,
      refreshTenants,
      registerTenant,
    }),
    [tenants, currentTenant, refreshTenants, registerTenant],
  )

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>
}

export function useTenant() {
  const ctx = useContext(TenantContext)
  if (!ctx) throw new Error('useTenant must be used within TenantProvider')
  return ctx
}
