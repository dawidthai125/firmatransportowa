import { CardDescription, CardTitle } from '@/app/components/ui/Card'
import type { PortalPanel } from '@/lib/auth/portal-panels'
import { getPanelTheme } from '@/lib/theme/transport-images'
import { cn } from '@/lib/utils'
import { ArrowRight } from 'lucide-react'

interface PortalPanelTileProps {
  panel: PortalPanel
  disabled?: boolean
  isActiveSession?: boolean
  onClick: () => void
}

export function PortalPanelTile({
  panel,
  disabled,
  isActiveSession,
  onClick,
}: PortalPanelTileProps) {
  const theme = getPanelTheme(panel.role)
  const Icon = panel.icon

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'group relative flex min-h-[220px] w-full flex-col overflow-hidden rounded-2xl border-2 border-border/60 text-left transition-all duration-300',
        'hover:-translate-y-1 hover:border-border hover:shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        disabled && 'pointer-events-none opacity-45',
        !disabled && theme.glowClass,
      )}
    >
      <img
        src={theme.image}
        alt={theme.imageAlt}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        loading="lazy"
      />
      <div className={cn('absolute inset-0 bg-gradient-to-t', theme.overlayClass)} aria-hidden />

      <div className="relative flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-2">
          <div
            className={cn(
              'flex h-12 w-12 items-center justify-center rounded-xl bg-background/25 backdrop-blur-md ring-1 ring-white/15',
              panel.iconClass,
            )}
          >
            <Icon className="h-6 w-6" />
          </div>
          {isActiveSession && (
            <span className="rounded-full bg-success/90 px-2.5 py-1 text-xs font-semibold text-background shadow-sm">
              Zalogowany
            </span>
          )}
        </div>

        <div className="mt-auto space-y-1.5 pt-8">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-foreground/60">
            {theme.badge}
          </p>
          <CardTitle className="text-xl text-foreground">{panel.title}</CardTitle>
          <CardDescription className="text-sm leading-relaxed text-foreground/75">
            {panel.description}
          </CardDescription>
          <p className="text-xs font-medium text-foreground/55">{panel.benefit}</p>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
          <span className="text-sm font-semibold text-foreground group-hover:text-primary">
            {isActiveSession ? 'Kontynuuj sesję' : 'Wejdź do panelu'}
          </span>
          <ArrowRight className="h-4 w-4 text-foreground/70 transition-transform group-hover:translate-x-1 group-hover:text-primary" />
        </div>
      </div>
    </button>
  )
}
