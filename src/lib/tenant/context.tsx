import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { SYNC_MERGED_EVENT } from '@/lib/cloud-sync'
import type { Tenant } from './types'
import { tenantsRegistryKey } from './types'
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
    const stamped: Tenant = { ...tenant, updatedAt: new Date().toISOString() }
    const existing = loadTenantsRegistry()
    const next = [...existing.filter((t) => t.id !== stamped.id), stamped]
    saveTenantsRegistry(next)
    setTenants(next)
    setCurrentTenant((prev) => (prev?.id === stamped.id ? stamped : prev))
  }, [])

  /** Po merge z chmury — odśwież bieżącego tenanta (plan, moduły) bez przeładowania strony */
  useEffect(() => {
    const handler = (e: Event) => {
      const keys = (e as CustomEvent<{ keys: string[] }>).detail?.keys ?? []
      if (!keys.includes(tenantsRegistryKey())) return
      const next = loadTenantsRegistry()
      setTenants(next)
      setCurrentTenant((prev) => {
        if (!prev) return prev
        return next.find((t) => t.id === prev.id) ?? prev
      })
    }
    window.addEventListener(SYNC_MERGED_EVENT, handler)
    return () => window.removeEventListener(SYNC_MERGED_EVENT, handler)
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
