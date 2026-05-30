import { cn } from '@/lib/utils'

export type TajskiTransLogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero'

const SIZE_CLASS: Record<TajskiTransLogoSize, string> = {
  xs: 'h-8 w-8',
  sm: 'h-10 w-10',
  md: 'h-12 w-12',
  lg: 'h-16 w-16',
  xl: 'h-20 w-20',
  hero: 'h-24 w-24 sm:h-28 sm:w-28',
}

interface TajskiTransLogoProps {
  size?: TajskiTransLogoSize
  className?: string
  /** Tekst obok ikony (portal) */
  showWordmark?: boolean
  wordmarkClassName?: string
}

/** Logo Tajski-Trans — piorun na tle transportowym */
export function TajskiTransLogo({
  size = 'md',
  className,
  showWordmark = false,
  wordmarkClassName,
}: TajskiTransLogoProps) {
  const icon = (
    <div
      className={cn(
        'relative shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-[#131c33] to-[#1a1040] shadow-lg shadow-amber-500/20 ring-1 ring-blue-500/30',
        SIZE_CLASS[size],
        className,
      )}
      aria-hidden={showWordmark ? undefined : true}
      role={showWordmark ? undefined : 'img'}
      aria-label={showWordmark ? undefined : 'Tajski-Trans'}
    >
      <svg viewBox="0 0 512 512" className="h-full w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="logo-bolt" x1="256" y1="88" x2="256" y2="424" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fde68a" />
            <stop stopColor="#fbbf24" />
            <stop offset="0.55" stopColor="#f59e0b" />
            <stop offset="1" stopColor="#ea580c" />
          </linearGradient>
        </defs>
        <rect width="512" height="512" fill="#0c1222" />
        <path
          d="M292 96 188 272h72l-28 144 140-184h-68l48-136z"
          fill="url(#logo-bolt)"
        />
        <path
          d="M292 96 188 272h72l-28 144 140-184h-68l48-136z"
          fill="#fbbf24"
          opacity="0.2"
          transform="translate(8 10)"
        />
      </svg>
    </div>
  )

  if (!showWordmark) return icon

  return (
    <div className="flex items-center gap-3">
      {icon}
      <div className={cn('min-w-0', wordmarkClassName)}>
        <p className="text-lg font-bold leading-tight tracking-tight sm:text-xl">Tajski-Trans</p>
        <p className="text-xs text-muted-foreground">Transport · logistyka TSL</p>
      </div>
    </div>
  )
}

/** Ikona w nagłówku panelu — zaokrąglony kwadrat z piorunem */
export function TajskiTransMark({ className }: { className?: string }) {
  return (
    <TajskiTransLogo
      size="sm"
      className={cn('rounded-xl shadow-md shadow-amber-500/15 ring-1 ring-primary/25', className)}
    />
  )
}

/** Logo + nazwa firmy w nagłówku panelu (mobile i desktop) */
export function TajskiTransHeaderBrand({
  className,
  subtitle,
}: {
  className?: string
  subtitle?: string
}) {
  return (
    <div className={cn('flex min-w-0 items-center gap-2.5', className)}>
      <TajskiTransMark className="h-9 w-9 shrink-0 rounded-lg" />
      <div className="min-w-0 leading-tight">
        <p className="truncate text-sm font-bold tracking-tight text-foreground">Tajski-Trans</p>
        {subtitle ? (
          <p className="truncate text-[10px] text-muted-foreground">{subtitle}</p>
        ) : (
          <p className="truncate text-[10px] text-muted-foreground">Transport · TSL</p>
        )}
      </div>
    </div>
  )
}
