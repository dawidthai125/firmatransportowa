import { AppNav } from '@/app/components/AppNav'
import { Button } from '@/app/components/ui/Button'
import type { NavItem } from '@/lib/navigation'
import { cn } from '@/lib/utils'
import {
  Bot,
  Calculator,
  FileText,
  FolderOpen,
  HardDrive,
  Home,
  LayoutDashboard,
  Layers,
  Menu,
  Route,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Truck,
  User,
  Users,
  Wrench,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useEffect } from 'react'

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
}

const MOBILE_QUICK_COUNT = 4

interface AdminMobileNavProps<T extends string> {
  items: NavItem<T>[]
  active: T
  onChange: (id: T) => void
  menuOpen: boolean
  onMenuOpenChange: (open: boolean) => void
}

/** Dolna belka (skróty) + pełne menu w panelu — tylko mobile admina */
export function AdminMobileNav<T extends string>({
  items,
  active,
  onChange,
  menuOpen,
  onMenuOpenChange,
}: AdminMobileNavProps<T>) {
  const quickItems = items.slice(0, MOBILE_QUICK_COUNT)
  const activeInQuick = quickItems.some((i) => i.id === active)

  useEffect(() => {
    if (!menuOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [menuOpen])

  function pick(id: T) {
    onChange(id)
    onMenuOpenChange(false)
  }

  return (
    <>
      <div
        className="relative z-40 flex shrink-0 items-stretch border-t border-border bg-sidebar/98 shadow-[0_-6px_20px_rgba(0,0,0,0.18)] backdrop-blur-md md:hidden"
        role="navigation"
        aria-label="Nawigacja panelu admina"
      >
        <div className="flex flex-1 overflow-x-auto px-1 pb-[env(safe-area-inset-bottom)] pt-1">
          {quickItems.map((item) => {
            const Icon = ICONS[item.icon] ?? LayoutDashboard
            const isActive = active === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onChange(item.id)}
                className={cn(
                  'flex min-w-[4.25rem] flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium touch-target',
                  isActive ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </button>
            )
          })}
        </div>
        <button
          type="button"
          onClick={() => onMenuOpenChange(true)}
          className={cn(
            'flex min-w-[4.5rem] flex-col items-center justify-center gap-0.5 border-l border-border/60 px-1 py-2 pb-[env(safe-area-inset-bottom)] text-[10px] font-semibold touch-target',
            menuOpen || !activeInQuick ? 'text-primary' : 'text-muted-foreground',
          )}
          aria-label="Pełne menu panelu"
          aria-expanded={menuOpen}
        >
          <Menu className="h-5 w-5" />
          Menu
        </button>
      </div>

      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Menu panelu">
          <button
            type="button"
            className="absolute inset-0 bg-background/70 backdrop-blur-sm"
            aria-label="Zamknij menu"
            onClick={() => onMenuOpenChange(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[min(85dvh,640px)] overflow-hidden rounded-t-2xl border border-border bg-sidebar shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <LayoutDashboard className="h-5 w-5 text-primary" />
                <p className="font-semibold">Menu panelu</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onMenuOpenChange(false)}
                aria-label="Zamknij"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="scroll-area max-h-[calc(min(85dvh,640px)-3.5rem)] p-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <AppNav items={items} active={active} onChange={pick} layout="sidebar" forceVisible />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
