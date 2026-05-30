import { cn } from '@/lib/utils'
import {
  FileText,
  Home,
  LayoutDashboard,
  Route,
  Settings,
  ShieldCheck,
  Truck,
  User,
  Users,
  type LucideIcon,
} from 'lucide-react'
import type { NavItem } from '@/lib/navigation'

const ICONS: Record<string, LucideIcon> = {
  'layout-dashboard': LayoutDashboard,
  route: Route,
  truck: Truck,
  users: Users,
  'shield-check': ShieldCheck,
  settings: Settings,
  home: Home,
  'file-text': FileText,
  user: User,
}

interface AppNavProps<T extends string> {
  items: NavItem<T>[]
  active: T
  onChange: (id: T) => void
  layout: 'sidebar' | 'bottom'
}

export function AppNav<T extends string>({ items, active, onChange, layout }: AppNavProps<T>) {
  if (layout === 'bottom') {
    return (
      <nav className="flex shrink-0 border-t border-border bg-sidebar px-1 pb-[env(safe-area-inset-bottom)] pt-1 md:hidden">
        {items.map((item) => {
          const Icon = ICONS[item.icon] ?? LayoutDashboard
          const isActive = active === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              className={cn(
                'flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium touch-target',
                isActive ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </button>
          )
        })}
      </nav>
    )
  }

  return (
    <nav className="hidden w-56 shrink-0 flex-col gap-1 border-r border-border bg-sidebar p-3 md:flex">
      {items.map((item) => {
        const Icon = ICONS[item.icon] ?? LayoutDashboard
        const isActive = active === item.id
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors touch-target',
              isActive
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {item.label}
          </button>
        )
      })}
    </nav>
  )
}
