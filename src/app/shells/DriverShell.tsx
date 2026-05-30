import { AppNav } from '@/app/components/AppNav'
import { HelpButton } from '@/app/components/help/HelpButton'
import { PanelThemeBanner } from '@/app/components/transport/PanelThemeBanner'
import { Button } from '@/app/components/ui/Button'
import type { DriverView } from '@/lib/navigation'
import { DRIVER_NAV } from '@/lib/navigation'
import type { Tenant } from '@/lib/tenant/types'
import { cn } from '@/lib/utils'
import { LogOut, Truck } from 'lucide-react'
import type { ReactNode } from 'react'

const DRIVER_VIEW_TITLES: Record<DriverView, string> = {
  home: 'Start kierowcy',
  issue: 'Zgłoszenie awarii',
  courses: 'Moje kursy',
  report: 'Raport dzienny',
  profile: 'Profil kierowcy',
}

interface DriverShellProps {
  tenant: Tenant
  driverName: string
  view: DriverView
  onViewChange: (view: DriverView) => void
  onLogout: () => void
  children: ReactNode
}

export function DriverShell({
  tenant,
  driverName,
  view,
  onViewChange,
  onLogout,
  children,
}: DriverShellProps) {
  return (
    <div className="app-shell bg-background">
      <header className="flex shrink-0 items-center justify-between border-b border-border/80 bg-sidebar/95 px-4 py-3 backdrop-blur-md">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-success/30 to-success/10 text-success ring-1 ring-success/25">
            <Truck className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{driverName}</p>
            <p className="truncate text-xs text-muted-foreground">{tenant.name} · Kierowca</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <HelpButton />
          <Button variant="ghost" size="icon" onClick={onLogout} aria-label="Wyloguj">
          <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className={cn('scroll-area flex-1 p-4')}>
        <PanelThemeBanner
          role="driver"
          title={DRIVER_VIEW_TITLES[view]}
          subtitle={`${driverName} · trasa · raporty`}
        />
        {children}
      </main>
      <AppNav items={DRIVER_NAV} active={view} onChange={onViewChange} layout="bottom" />
    </div>
  )
}
