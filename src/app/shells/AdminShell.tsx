import { AppNav } from '@/app/components/AppNav'
import { Button } from '@/app/components/ui/Button'
import type { AdminView } from '@/lib/navigation'
import { VIEW_TITLES, type NavItem } from '@/lib/navigation'
import type { Tenant } from '@/lib/tenant/types'
import type { UserRole } from '@/lib/auth/session'
import { ROLE_LABELS } from '@/lib/auth/session'
import { cn } from '@/lib/utils'
import { LogOut, Truck } from 'lucide-react'
import type { ReactNode } from 'react'

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
  return (
    <div className="app-shell bg-background">
      <header className="flex shrink-0 items-center justify-between border-b border-border bg-sidebar px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Truck className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{tenant.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {VIEW_TITLES[view]} · {ROLE_LABELS[role]}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onLogout} aria-label="Wyloguj">
          <LogOut className="h-4 w-4" />
        </Button>
      </header>

      <div className="flex min-h-0 flex-1">
        <AppNav items={navItems} active={view} onChange={onViewChange} layout="sidebar" />
        <main className={cn('scroll-area flex-1 p-4 md:p-6')}>{children}</main>
      </div>

      <AppNav items={navItems} active={view} onChange={onViewChange} layout="bottom" />
    </div>
  )
}
