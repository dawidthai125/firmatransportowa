import { getPanelTheme } from '@/lib/theme/transport-images'
import type { UserRole } from '@/lib/auth/session'
import { cn } from '@/lib/utils'
import { Container, MapPin, Route, Shield } from 'lucide-react'

interface PanelThemeBannerProps {
  role: UserRole
  title: string
  subtitle?: string
  className?: string
}

const ROLE_ICONS = {
  owner: Shield,
  dispatcher: Route,
  driver: MapPin,
  mechanic: Container,
} as const

export function PanelThemeBanner({ role, title, subtitle, className }: PanelThemeBannerProps) {
  const theme = getPanelTheme(role)
  const Icon = ROLE_ICONS[role]

  return (
    <div
      className={cn(
        'relative mb-5 overflow-hidden rounded-xl border border-border/80 shadow-lg',
        className,
      )}
    >
      <img
        src={theme.image}
        alt={theme.imageAlt}
        className="absolute inset-0 h-full w-full object-cover"
        loading="lazy"
      />
      <div className={cn('absolute inset-0 bg-gradient-to-r', theme.overlayClass)} aria-hidden />
      <div className="relative flex flex-col gap-2 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-6">
        <div className="flex items-start gap-3 sm:items-center">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-background/20 backdrop-blur-sm ring-1 ring-white/10">
            <Icon className={cn('h-5 w-5', theme.accentClass)} />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-foreground/70">
              {theme.badge}
            </p>
            <h2 className="text-lg font-semibold text-foreground sm:text-xl">{title}</h2>
            {subtitle && <p className="text-sm text-foreground/75">{subtitle}</p>}
          </div>
        </div>
        <p className="hidden max-w-xs text-right text-xs leading-relaxed text-foreground/60 sm:block">
          {theme.tagline}
        </p>
      </div>
    </div>
  )
}
