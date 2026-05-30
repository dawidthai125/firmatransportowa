import { Button } from '@/app/components/ui/Button'
import { Card, CardContent } from '@/app/components/ui/Card'
import { useDriverGpsShare } from '@/lib/gps/useDriverGpsShare'
import { cn } from '@/lib/utils'
import { MapPin, Radio } from 'lucide-react'

interface DriverLocationShareProps {
  tenantId: string
  driverName: string
  vehicleId?: string
  registration?: string
  courseRef?: string
}

export function DriverLocationShare({
  tenantId,
  driverName,
  vehicleId,
  registration,
  courseRef,
}: DriverLocationShareProps) {
  const { enabled, setEnabled, lastUpdate, error } = useDriverGpsShare({
    tenantId,
    driverName,
    vehicleId,
    registration,
    courseRef,
  })

  return (
    <Card className={cn(enabled && 'border-success/40 bg-success/5')}>
      <CardContent className="flex items-start gap-3 p-4">
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
            enabled ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground',
          )}
        >
          {enabled ? <Radio className="h-5 w-5" /> : <MapPin className="h-5 w-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium">Udostępnij lokalizację floty</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Biuro widzi Cię na mapie — bez pytania „gdzie jesteś?”. Działa w tle w PWA.
          </p>
          {enabled && lastUpdate && (
            <p className="mt-1 text-xs text-success">
              Ostatnia pozycja: {new Date(lastUpdate).toLocaleTimeString('pl-PL')}
            </p>
          )}
          {error && <p className="mt-1 text-xs text-danger">{error}</p>}
          <Button
            type="button"
            size="sm"
            variant={enabled ? 'secondary' : 'default'}
            className="mt-2 touch-target"
            onClick={() => setEnabled(!enabled)}
          >
            {enabled ? 'Wyłącz GPS' : 'Włącz GPS dla biura'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
