import { Card, CardContent } from '@/app/components/ui/Card'
import { cn } from '@/lib/utils'

interface CloudSyncPlaceholderProps {
  /** Krótki opis — domyślnie ładowanie z chmury */
  message?: string
  /** Szkielet KPI (4 kafelki) zamiast jednej karty */
  variant?: 'card' | 'kpi-grid'
  className?: string
}

export function CloudSyncPlaceholder({
  message = 'Ładowanie danych z chmury…',
  variant = 'card',
  className,
}: CloudSyncPlaceholderProps) {
  if (variant === 'kpi-grid') {
    return (
      <div className={cn('space-y-6', className)} role="status" aria-live="polite">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="h-8 w-8 shrink-0 animate-pulse rounded-lg bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-7 w-16 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-24 animate-pulse rounded bg-muted/80" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">{message}</CardContent>
        </Card>
      </div>
    )
  }

  return (
    <Card className={className} role="status" aria-live="polite">
      <CardContent className="p-6 text-center text-sm text-muted-foreground">{message}</CardContent>
    </Card>
  )
}
