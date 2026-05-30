import { AccessDenied, SessionBootSplash } from '@/app/components/AccessDenied'
import { LoginScreen, handleLogout } from '@/app/LoginScreen'
import { AdminShell } from '@/app/shells/AdminShell'
import { DriverShell } from '@/app/shells/DriverShell'
import { MechanicShell } from '@/app/shells/MechanicShell'
import { AutomationsView } from '@/app/views/AutomationsView'
import { ComplianceView } from '@/app/views/ComplianceView'
import { CoursesView } from '@/app/views/CoursesView'
import { DailyReportsView } from '@/app/views/DailyReportsView'
import { DashboardView } from '@/app/views/DashboardView'
import { DriverIssueView } from '@/app/views/DriverIssueView'
import {
  DriverHomeView,
  DriverProfileView,
  DriverReportView,
} from '@/app/views/DriverViews'
import { DriversView } from '@/app/views/DriversView'
import { DriverItdView } from '@/app/views/DriverItdView'
import { FreightBoardView } from '@/app/views/FreightBoardView'
import { ItdAdminView } from '@/app/views/ItdAdminView'
import { FilesView } from '@/app/views/FilesView'
import { FeaturesView } from '@/app/views/FeaturesView'
import { FleetView } from '@/app/views/FleetView'
import { MechanicHomeView } from '@/app/views/MechanicViews'
import { RepairsView } from '@/app/views/RepairsView'
import { SettlementsView } from '@/app/views/SettlementsView'
import { SettingsView } from '@/app/views/SettingsView'
import { TachographView } from '@/app/views/TachographView'
import type { AppMode } from '@/lib/auth/session'
import { loadSession, roleToAppMode, saveSession } from '@/lib/auth/session'
import { restoreSupabaseAppSessionFromJwt } from '@/lib/auth/supabase-auth'
import { isSupabaseConfigured } from '@/config/supabase'
import { getDefaultTenant } from '@/lib/tenant/demo-data'
import {
  DISPATCHER_NAV,
  DRIVER_NAV,
  OWNER_NAV,
  type AdminView,
  type DriverView,
  type MechanicView,
  type NavItem,
} from '@/lib/navigation'
import { runScheduledAutomations } from '@/lib/automation/scheduler'
import { HelpProvider } from '@/lib/help/help-context'
import { useTenant } from '@/lib/tenant/context'
import { usePwaBrandingEffect } from '@/lib/pwa/usePwaBrandingEffect'
import { useEffect, useMemo, useState } from 'react'

const OWNER_ONLY_ADMIN_VIEWS: AdminView[] = ['compliance', 'settings', 'tachograph']

/** Moduły tylko dla właściciela — poza menu dyspozytora */
const DISPATCHER_FORBIDDEN_VIEWS: AdminView[] = [
  ...OWNER_ONLY_ADMIN_VIEWS,
  'settlements',
  'files',
  'automations',
  'itd',
]

function filterNavByModules<T extends string>(
  items: NavItem<T>[],
  modules: import('@/lib/tenant/types').TenantModules,
): NavItem<T>[] {
  return items.filter((item) => !item.module || modules[item.module])
}

function canAccessAdminView(view: AdminView, mode: AppMode): boolean {
  if (mode === 'owner') return true
  if (mode === 'dispatcher') return !DISPATCHER_FORBIDDEN_VIEWS.includes(view)
  return true
}

export default function App() {
  const { currentTenant, tenants, setCurrentTenant } = useTenant()
  const session = loadSession()

  usePwaBrandingEffect(currentTenant?.id)

  useEffect(() => {
    if (!session || !currentTenant) return
    void runScheduledAutomations({
      tenantId: currentTenant.id,
      tenantSlug: currentTenant.slug,
      tenantName: currentTenant.name,
    })
  }, [session, currentTenant])

  useEffect(() => {
    if (!session || currentTenant) return
    const tenant = tenants.find((t) => t.id === session.tenantId)
    if (tenant) setCurrentTenant(tenant)
  }, [session, currentTenant, tenants, setCurrentTenant])

  const [mode, setMode] = useState<AppMode>(() =>
    session ? roleToAppMode(session.user.role) : 'login',
  )
  const [supabaseRestoring, setSupabaseRestoring] = useState(
    () => !loadSession() && isSupabaseConfigured(),
  )

  useEffect(() => {
    if (session || !isSupabaseConfigured()) {
      setSupabaseRestoring(false)
      return
    }

    let cancelled = false
    void (async () => {
      const tenant = getDefaultTenant(tenants)
      if (!tenant) {
        if (!cancelled) setSupabaseRestoring(false)
        return
      }
      const restored = await restoreSupabaseAppSessionFromJwt(tenant.id)
      if (cancelled) return
      if (restored) {
        saveSession(restored)
        setCurrentTenant(tenant)
        setMode(roleToAppMode(restored.user.role))
      }
      setSupabaseRestoring(false)
    })()

    return () => {
      cancelled = true
    }
  }, [session, tenants, setCurrentTenant])

  const [adminView, setAdminView] = useState<AdminView>('dashboard')
  const [driverView, setDriverView] = useState<DriverView>('home')
  const [mechanicView, setMechanicView] = useState<MechanicView>('home')

  const navItems = useMemo(() => {
    if (!currentTenant) return OWNER_NAV
    const filtered = filterNavByModules(OWNER_NAV, currentTenant.settings.modules)
    return mode === 'dispatcher'
      ? DISPATCHER_NAV.filter((i) => filtered.some((f) => f.id === i.id))
      : filtered
  }, [currentTenant, mode])

  const driverNavItems = useMemo(() => {
    if (!currentTenant) return DRIVER_NAV
    return filterNavByModules(DRIVER_NAV, currentTenant.settings.modules)
  }, [currentTenant])

  useEffect(() => {
    if (mode !== 'owner' && mode !== 'dispatcher') return
    if (!navItems.some((i) => i.id === adminView)) {
      setAdminView('dashboard')
    }
  }, [navItems, adminView, mode])

  useEffect(() => {
    if (mode !== 'owner' && mode !== 'dispatcher') return
    if (!canAccessAdminView(adminView, mode)) {
      setAdminView('dashboard')
    }
  }, [mode, adminView])

  useEffect(() => {
    if (mode !== 'driver') return
    if (!driverNavItems.some((i) => i.id === driverView)) {
      setDriverView('home')
    }
  }, [driverNavItems, driverView, mode])

  if (supabaseRestoring) {
    return <SessionBootSplash />
  }

  if (!session) {
    return <LoginScreen onLogin={setMode} />
  }

  if (!currentTenant) {
    return <SessionBootSplash />
  }

  const onLogout = () =>
    handleLogout(setMode, () => {
      setCurrentTenant(null)
    })

  const helpProps = {
    tenantId: currentTenant.id,
    userId: session.user.id,
  }

  if (mode === 'mechanic') {
    return (
      <HelpProvider mode={mode} viewId={mechanicView} {...helpProps}>
        <MechanicShell
          tenant={currentTenant}
          mechanicName={session.user.displayName}
          view={mechanicView}
          onViewChange={setMechanicView}
          onLogout={onLogout}
        >
          {mechanicView === 'home' && (
            <MechanicHomeView
              tenantId={currentTenant.id}
              mechanicId={session.user.mechanicId}
              mechanicName={session.user.displayName}
            />
          )}
        </MechanicShell>
      </HelpProvider>
    )
  }

  if (mode === 'driver') {
    return (
      <HelpProvider mode={mode} viewId={driverView} {...helpProps}>
        <DriverShell
          tenant={currentTenant}
          driverName={session.user.displayName}
          view={driverView}
          navItems={driverNavItems}
          onViewChange={setDriverView}
          onLogout={onLogout}
        >
          {driverView === 'home' && (
            <DriverHomeView
              tenantId={currentTenant.id}
              driverName={session.user.displayName}
              onOpenReport={() => setDriverView('report')}
              onOpenIssue={() => setDriverView('issue')}
              onOpenCourses={() => setDriverView('courses')}
            />
          )}
          {driverView === 'issue' && (
            <DriverIssueView tenantId={currentTenant.id} driverName={session.user.displayName} />
          )}
          {driverView === 'courses' && <CoursesView tenantId={currentTenant.id} readOnly />}
          {driverView === 'report' && (
            <DriverReportView tenantId={currentTenant.id} driverName={session.user.displayName} />
          )}
          {driverView === 'profile' && (
            <DriverProfileView tenantId={currentTenant.id} driverName={session.user.displayName} />
          )}
          {driverView === 'itd' && currentTenant.settings.modules.itd && (
            <DriverItdView tenantId={currentTenant.id} driverName={session.user.displayName} />
          )}
        </DriverShell>
      </HelpProvider>
    )
  }

  const adminAllowed = canAccessAdminView(adminView, mode)

  return (
    <HelpProvider mode={mode} viewId={adminView} {...helpProps}>
      <AdminShell
        tenant={currentTenant}
        role={session.user.role}
        view={adminView}
        onViewChange={setAdminView}
        navItems={navItems}
        onLogout={onLogout}
      >
        {!adminAllowed && (
          <AccessDenied title="Moduł tylko dla właściciela" />
        )}
        {adminAllowed && adminView === 'dashboard' && (
          <DashboardView tenant={currentTenant} onNavigate={setAdminView} />
        )}
        {adminAllowed && adminView === 'features' && (
          <FeaturesView
            modules={currentTenant.settings.modules}
            onNavigate={setAdminView}
          />
        )}
        {adminAllowed && adminView === 'courses' && <CoursesView tenantId={currentTenant.id} />}
        {adminAllowed && adminView === 'loads' && (
          <FreightBoardView
            tenantId={currentTenant.id}
            onNavigateToCourses={() => setAdminView('courses')}
          />
        )}
        {adminAllowed && adminView === 'reports' && <DailyReportsView tenantId={currentTenant.id} />}
        {adminAllowed && adminView === 'settlements' && (
          <SettlementsView
            tenantId={currentTenant.id}
            tenantSlug={currentTenant.slug}
            tenantName={currentTenant.name}
          />
        )}
        {adminAllowed && adminView === 'files' && <FilesView tenantId={currentTenant.id} />}
        {adminAllowed && adminView === 'automations' && (
          <AutomationsView
            tenantId={currentTenant.id}
            tenantSlug={currentTenant.slug}
            tenantName={currentTenant.name}
          />
        )}
        {adminAllowed && adminView === 'fleet' && (
          <FleetView tenantId={currentTenant.id} gpsEnabled={currentTenant.settings.modules.gps} />
        )}
        {adminAllowed && adminView === 'repairs' && (
          <RepairsView
            tenantId={currentTenant.id}
            userId={session.user.id}
            userRole={session.user.role}
          />
        )}
        {adminAllowed && adminView === 'itd' && (
          <ItdAdminView
            tenantId={currentTenant.id}
            userRole={session.user.role === 'owner' ? 'owner' : 'dispatcher'}
            userName={session.user.displayName}
          />
        )}
        {adminAllowed && adminView === 'drivers' && <DriversView tenantId={currentTenant.id} />}
        {adminAllowed && adminView === 'compliance' && mode === 'owner' && (
          <ComplianceView tenantId={currentTenant.id} tenantName={currentTenant.name} />
        )}
        {adminAllowed && adminView === 'tachograph' && mode === 'owner' && (
          <TachographView tenantId={currentTenant.id} />
        )}
        {adminAllowed && adminView === 'settings' && mode === 'owner' && (
          <SettingsView tenant={currentTenant} />
        )}
      </AdminShell>
    </HelpProvider>
  )
}
