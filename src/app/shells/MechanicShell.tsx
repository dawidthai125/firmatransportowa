import { AppNav } from '@/app/components/AppNav'
import { PanelThemeBanner } from '@/app/components/transport/PanelThemeBanner'
import { Button } from '@/app/components/ui/Button'
import type { MechanicView } from '@/lib/navigation'
import { MECHANIC_NAV } from '@/lib/navigation'
import type { Tenant } from '@/lib/tenant/types'
import { cn } from '@/lib/utils'
import { LogOut, Wrench } from 'lucide-react'
import type { ReactNode } from 'react'

interface MechanicShellProps {
  tenant: Tenant
  mechanicName: string
  view: MechanicView
  onViewChange: (view: MechanicView) => void
  onLogout: () => void
  children: ReactNode
}

export function MechanicShell({
  tenant,
  mechanicName,
  view,
  onViewChange,
  onLogout,
  children,
}: MechanicShellProps) {
  return (
    <div className="app-shell bg-background">
      <header className="flex shrink-0 items-center justify-between border-b border-border/80 bg-sidebar/95 px-4 py-3 backdrop-blur-md">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-warning/30 to-warning/10 text-warning ring-1 ring-warning/25">
            <Wrench className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{mechanicName}</p>
            <p className="truncate text-xs text-muted-foreground">{tenant.name} · Warsztat</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onLogout} aria-label="Wyloguj">
          <LogOut className="h-4 w-4" />
        </Button>
      </header>

      <main className={cn('scroll-area flex-1 p-4')}>
        <PanelThemeBanner
          role="mechanic"
          title="Zlecenia napraw floty"
          subtitle={`${mechanicName} · ciężarówki i naczepy`}
        />
        {children}
      </main>
      <AppNav items={MECHANIC_NAV} active={view} onChange={onViewChange} layout="bottom" />
    </div>
  )
}
