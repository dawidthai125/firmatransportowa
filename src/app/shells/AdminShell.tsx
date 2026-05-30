import { AdminMobileNav } from '@/app/components/AdminMobileNav'
import { SystemCredit } from '@/app/components/SystemCredit'
import { AutomationNotifications } from '@/app/components/AutomationNotifications'
import { CloudStatusBadge } from '@/app/components/CloudStatusBadge'
import { OfflineIndicator } from '@/app/components/pwa/OfflineIndicator'
import { HelpButton } from '@/app/components/help/HelpButton'
import { AppNav } from '@/app/components/AppNav'
import { PanelThemeBanner } from '@/app/components/transport/PanelThemeBanner'
import { Button } from '@/app/components/ui/Button'
import { TajskiTransHeaderBrand, TajskiTransMark } from '@/app/components/brand/TajskiTransLogo'
import { isCompanyDeployment } from '@/config/branding'
import type { AdminView } from '@/lib/navigation'
import { VIEW_TITLES, type NavItem } from '@/lib/navigation'
import type { Tenant } from '@/lib/tenant/types'
import type { UserRole } from '@/lib/auth/session'
import { ROLE_LABELS } from '@/lib/auth/session'
import { cn } from '@/lib/utils'
import { LogOut, Menu } from 'lucide-react'
import { useState, type ReactNode } from 'react'

interface AdminShellProps {
  tenant: Tenant
  role: UserRole
  view: AdminView
  onViewChange: (view: AdminView) => void
  navItems: NavItem<AdminView>[]
  onLogout: () => void
  children: ReactNode
}

export function AdminShell({
  tenant,
  role,
  view,
  onViewChange,
  navItems,
  onLogout,
  children,
}: AdminShellProps) {
  const adminRole = role === 'owner' || role === 'dispatcher' ? role : 'owner'
  const companyMode = isCompanyDeployment()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="app-shell bg-background">
      <OfflineIndicator />
      <header className="relative z-30 flex shrink-0 items-center justify-between gap-2 border-b border-border/80 bg-sidebar/95 px-3 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-md sm:px-4">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 md:hidden"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Otwórz menu panelu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          {companyMode ? (
            <TajskiTransHeaderBrand
              subtitle={`${VIEW_TITLES[view]} · ${ROLE_LABELS[role]}`}
              className="min-w-0 flex-1"
            />
          ) : (
            <>
              <TajskiTransMark />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{tenant.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {VIEW_TITLES[view]} · {ROLE_LABELS[role]}
                </p>
              </div>
            </>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <HelpButton />
          <CloudStatusBadge />
          <AutomationNotifications tenantId={tenant.id} onNavigate={onViewChange} />
          <Button variant="ghost" size="icon" onClick={onLogout} aria-label="Wyloguj">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {companyMode && (
        <p className="truncate border-b border-border/50 bg-muted/30 px-3 py-1 text-center text-[10px] text-muted-foreground md:hidden">
          {tenant.name}
        </p>
      )}

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <AppNav items={navItems} active={view} onChange={onViewChange} layout="sidebar" />
        <main className={cn('scroll-area flex-1 p-4 md:p-6')}>
          <PanelThemeBanner
            role={adminRole}
            title={VIEW_TITLES[view]}
            subtitle={`${tenant.name} · ${ROLE_LABELS[role]}`}
          />
          {children}
          <SystemCredit className="mt-8 border-t border-border/60 pt-4 pb-2" compact />
        </main>
      </div>

      <SystemCredit className="hidden shrink-0 border-t border-border/40 py-2 md:block" compact />

      <AdminMobileNav
        items={navItems}
        active={view}
        onChange={onViewChange}
        menuOpen={mobileMenuOpen}
        onMenuOpenChange={setMobileMenuOpen}
      />
    </div>
  )
}
