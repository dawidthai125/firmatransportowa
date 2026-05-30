import { AppNav } from '@/app/components/AppNav'
import { Button } from '@/app/components/ui/Button'
import type { DriverView } from '@/lib/navigation'
import { DRIVER_NAV } from '@/lib/navigation'
import type { Tenant } from '@/lib/tenant/types'
import { cn } from '@/lib/utils'
import { LogOut, Truck } from 'lucide-react'
import type { ReactNode } from 'react'

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
      <header className="flex shrink-0 items-center justify-between border-b border-border bg-sidebar px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Truck className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{driverName}</p>
            <p className="truncate text-xs text-muted-foreground">{tenant.name}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onLogout} aria-label="Wyloguj">
          <LogOut className="h-4 w-4" />
        </Button>
      </header>

      <main className={cn('scroll-area flex-1 p-4')}>{children}</main>
      <AppNav items={DRIVER_NAV} active={view} onChange={onViewChange} layout="bottom" />
    </div>
  )
}
