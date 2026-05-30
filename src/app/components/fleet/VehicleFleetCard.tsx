import { DocumentBadges, EntityActions } from '@/app/components/EntityForm'
import { VehicleMiniMap } from '@/app/components/fleet/VehicleMiniMap'
import { Card, CardContent } from '@/app/components/ui/Card'
import {
  FLEET_POSITION_SOURCE_LABELS,
  FLEET_STATUS_LABELS,
  TELEMATICS_PROVIDER_LABELS,
} from '@/lib/domain/fleet-position'
import type { FleetVehicleSnapshot } from '@/lib/domain/fleet-enrichment'
import { formatLastSignal } from '@/lib/domain/fleet-enrichment'
import { VEHICLE_TYPE_LABELS } from '@/lib/domain/vehicle'
import { cn } from '@/lib/utils'
import { AlertTriangle, Gauge, MapPin, Navigation, Route, Truck, User } from 'lucide-react'

interface VehicleFleetCardProps {
  snapshot: FleetVehicleSnapshot
  readOnly?: boolean
  onEdit?: () => void
  onDelete?: () => void
}

export function VehicleFleetCard({ snapshot, readOnly, onEdit, onDelete }: VehicleFleetCardProps) {
  const { vehicle, position, driverName, courseRef, speedKmh, lastSignalAt, gpsFreshness, displayStatus } =
    snapshot

  const stale = gpsFreshness === 'stale'
  const noSignal = gpsFreshness === 'none'

  const sourceLabel =
    position?.source &&
    FLEET_POSITION_SOURCE_LABELS[position.source] +
      (position.telematicsProvider
        ? ` · ${TELEMATICS_PROVIDER_LABELS[position.telematicsProvider]}`
        : '')

  return (
    <Card
      className={cn(
        stale && 'border-warning/40 bg-warning/5',
        noSignal && vehicle.active && 'border-muted',
      )}
    >
      <CardContent className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Truck className="h-4 w-4 text-primary" />
              <span className="font-semibold">{vehicle.registration}</span>
              <span className="text-xs text-muted-foreground">{VEHICLE_TYPE_LABELS[vehicle.type]}</span>
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-xs font-medium',
                  displayStatus === 'in_transit' && 'bg-success/15 text-success',
                  displayStatus === 'loading' && 'bg-warning/15 text-warning',
                  displayStatus === 'parked' && 'bg-muted text-muted-foreground',
                  displayStatus === 'offline' && 'bg-danger/10 text-danger',
                )}
              >
                {FLEET_STATUS_LABELS[displayStatus]}
              </span>
              {vehicle.adrEnabled && (
                <span className="flex items-center gap-1 rounded-full bg-danger/15 px-2 py-0.5 text-xs font-medium text-danger">
                  <AlertTriangle className="h-3 w-3" />
                  ADR
                </span>
              )}
              {stale && (
                <span className="flex items-center gap-1 text-xs font-medium text-warning">
                  <MapPin className="h-3 w-3" />
                  GPS nieaktualny &gt; 3 h
                </span>
              )}
            </div>

            {sourceLabel && (
              <p className="text-xs text-muted-foreground">Źródło pozycji: {sourceLabel}</p>
            )}

            {(vehicle.brand || vehicle.model) && (
              <p className="text-sm text-muted-foreground">
                {[vehicle.brand, vehicle.model, vehicle.year].filter(Boolean).join(' ')}
              </p>
            )}

            <div className="grid gap-1.5 text-sm sm:grid-cols-2">
              <p className="flex items-center gap-1.5 text-muted-foreground">
                <User className="h-3.5 w-3.5 shrink-0" />
                <span>
                  Kierowca:{' '}
                  <span className="text-foreground">{driverName ?? '— nie przypisano —'}</span>
                </span>
              </p>
              <p className="flex items-center gap-1.5 text-muted-foreground">
                <Route className="h-3.5 w-3.5 shrink-0" />
                <span>
                  Kurs: <span className="text-foreground">{courseRef ?? '—'}</span>
                </span>
              </p>
              <p className="flex items-center gap-1.5 text-muted-foreground">
                <Navigation className="h-3.5 w-3.5 shrink-0" />
                <span>
                  Prędkość:{' '}
                  <span className="text-foreground">
                    {speedKmh != null ? `${speedKmh} km/h` : '—'}
                  </span>
                </span>
              </p>
              <p className="flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span>
                  Ostatni sygnał:{' '}
                  <span className={cn('text-foreground', stale && 'text-warning')}>
                    {formatLastSignal(lastSignalAt)}
                  </span>
                </span>
              </p>
            </div>

            {vehicle.odometerKm != null && (
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <Gauge className="h-3.5 w-3.5" />
                {vehicle.odometerKm.toLocaleString('pl-PL')} km
              </p>
            )}

            <DocumentBadges documents={vehicle.documents} />
          </div>

          <EntityActions
            readOnly={readOnly}
            onEdit={onEdit ?? (() => {})}
            onDelete={onDelete ?? (() => {})}
          />
        </div>

        {position && (
          <div className="mt-4">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Mapa — ostatnia pozycja</p>
            <VehicleMiniMap position={position} />
          </div>
        )}

        {!position && vehicle.active && (
          <div className="mt-4 rounded-lg border border-dashed border-border bg-muted/20 p-4 text-center text-xs text-muted-foreground">
            Brak pozycji GPS — włącz telematykę w aucie lub GPS w aplikacji kierowcy
          </div>
        )}
      </CardContent>
    </Card>
  )
}
