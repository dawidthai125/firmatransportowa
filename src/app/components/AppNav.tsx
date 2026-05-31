import { cn } from '@/lib/utils'
import {
  Bot,
  Calculator,
  CalendarRange,
  FileText,
  FolderOpen,
  HardDrive,
  Home,
  LayoutDashboard,
  Layers,
  Receipt,
  Route,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Truck,
  User,
  Users,
  Wallet,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import type { NavItem } from '@/lib/navigation'

const ICONS: Record<string, LucideIcon> = {
  'layout-dashboard': LayoutDashboard,
  layers: Layers,
  route: Route,
  search: Search,
  calculator: Calculator,
  bot: Bot,
  'folder-open': FolderOpen,
  truck: Truck,
  wrench: Wrench,
  users: Users,
  'shield-check': ShieldCheck,
  'shield-alert': ShieldAlert,
  'hard-drive': HardDrive,
  settings: Settings,
  home: Home,
  'file-text': FileText,
  user: User,
  'calendar-range': CalendarRange,
  receipt: Receipt,
  wallet: Wallet,
}

interface AppNavProps<T extends string> {
  items: NavItem<T>[]
  active: T
  onChange: (id: T) => void
  layout: 'sidebar' | 'bottom'
  /** Dolna belka zawsze widoczna (panel kierowcy / mechanika — brak sidebara na desktop) */
  bottomAlwaysVisible?: boolean
  /** Sidebar widoczny mimo md (drawer mobile admin) */
  forceVisible?: boolean
  className?: string
}

export function AppNav<T extends string>({
  items,
  active,
  onChange,
  layout,
  bottomAlwaysVisible = false,
  forceVisible = false,
  className,
}: AppNavProps<T>) {
  if (layout === 'bottom') {
    return (
      <nav
        className={cn(
          'flex shrink-0 overflow-x-auto border-t border-border bg-sidebar px-1 pb-[env(safe-area-inset-bottom)] pt-1',
          !bottomAlwaysVisible && 'md:hidden',
          className,
        )}
      >
        {items.map((item) => {
          const Icon = ICONS[item.icon] ?? LayoutDashboard
          const isActive = active === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              className={cn(
                'flex min-w-[4.25rem] flex-col items-center gap-0.5 py-2 text-[10px] font-medium touch-target',
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
    <nav
      className={cn(
        'hidden w-56 shrink-0 flex-col gap-1 border-r border-border bg-sidebar p-3 md:flex',
        forceVisible && 'flex w-full border-r-0 md:hidden',
        className,
      )}
    >
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
