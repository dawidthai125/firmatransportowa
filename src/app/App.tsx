import { LoginScreen, handleLogout } from '@/app/LoginScreen'
import { AdminShell } from '@/app/shells/AdminShell'
import { DriverShell } from '@/app/shells/DriverShell'
import { ComplianceView } from '@/app/views/ComplianceView'
import { CoursesView } from '@/app/views/CoursesView'
import { DailyReportsView } from '@/app/views/DailyReportsView'
import { DashboardView } from '@/app/views/DashboardView'
import {
  DriverHomeView,
  DriverProfileView,
  DriverReportView,
} from '@/app/views/DriverViews'
import { DriversView } from '@/app/views/DriversView'
import { FilesView } from '@/app/views/FilesView'
import { FleetView } from '@/app/views/FleetView'
import { SettlementsView } from '@/app/views/SettlementsView'
import { SettingsView } from '@/app/views/SettingsView'
import type { AppMode } from '@/lib/auth/session'
import { loadSession } from '@/lib/auth/session'
import {
  DISPATCHER_NAV,
  OWNER_NAV,
  type AdminView,
  type DriverView,
} from '@/lib/navigation'
import { useTenant } from '@/lib/tenant/context'
import { useEffect, useMemo, useState } from 'react'

function filterNavByModules(
  items: typeof OWNER_NAV,
  modules: import('@/lib/tenant/types').TenantModules,
) {
  return items.filter((item) => !item.module || modules[item.module])
}

export default function App() {
  const { currentTenant, tenants, setCurrentTenant } = useTenant()
  const session = loadSession()

  useEffect(() => {
    if (!session || currentTenant) return
    const tenant = tenants.find((t) => t.id === session.tenantId)
    if (tenant) setCurrentTenant(tenant)
  }, [session, currentTenant, tenants, setCurrentTenant])

  const [mode, setMode] = useState<AppMode>(() => {
    if (session && currentTenant) {
      return session.user.role === 'owner'
        ? 'owner'
        : session.user.role === 'dispatcher'
          ? 'dispatcher'
          : 'driver'
    }
    return 'login'
  })

  const [adminView, setAdminView] = useState<AdminView>('dashboard')
  const [driverView, setDriverView] = useState<DriverView>('home')

  const navItems = useMemo(() => {
    if (!currentTenant) return OWNER_NAV
    const filtered = filterNavByModules(OWNER_NAV, currentTenant.settings.modules)
    return mode === 'dispatcher' ? DISPATCHER_NAV.filter((i) => filtered.some((f) => f.id === i.id)) : filtered
  }, [currentTenant, mode])

  if (mode === 'login' || !currentTenant || !session) {
    return <LoginScreen onLogin={setMode} />
  }

  const onLogout = () => handleLogout(setMode)

  if (mode === 'driver') {
    return (
      <DriverShell
        tenant={currentTenant}
        driverName={session.user.displayName}
        view={driverView}
        onViewChange={setDriverView}
        onLogout={onLogout}
      >
        {driverView === 'home' && (
          <DriverHomeView
            tenantId={currentTenant.id}
            driverName={session.user.displayName}
            onOpenReport={() => setDriverView('report')}
          />
        )}
        {driverView === 'courses' && <CoursesView tenantId={currentTenant.id} readOnly />}
        {driverView === 'report' && (
          <DriverReportView tenantId={currentTenant.id} driverName={session.user.displayName} />
        )}
        {driverView === 'profile' && <DriverProfileView />}
      </DriverShell>
    )
  }

  return (
    <AdminShell
      tenant={currentTenant}
      role={session.user.role}
      view={adminView}
      onViewChange={setAdminView}
      navItems={navItems}
      onLogout={onLogout}
    >
      {adminView === 'dashboard' && <DashboardView tenant={currentTenant} />}
      {adminView === 'courses' && <CoursesView tenantId={currentTenant.id} />}
      {adminView === 'reports' && <DailyReportsView tenantId={currentTenant.id} />}
      {adminView === 'settlements' && (
        <SettlementsView
          tenantId={currentTenant.id}
          tenantSlug={currentTenant.slug}
          tenantName={currentTenant.name}
        />
      )}
      {adminView === 'files' && <FilesView tenantId={currentTenant.id} />}
      {adminView === 'fleet' && <FleetView tenantId={currentTenant.id} />}
      {adminView === 'drivers' && <DriversView tenantId={currentTenant.id} />}
      {adminView === 'compliance' && (
        <ComplianceView tenantId={currentTenant.id} tenantName={currentTenant.name} />
      )}
      {adminView === 'settings' && mode === 'owner' && <SettingsView tenant={currentTenant} />}
      {adminView === 'settings' && mode === 'dispatcher' && <DashboardView tenant={currentTenant} />}
    </AdminShell>
  )
}
