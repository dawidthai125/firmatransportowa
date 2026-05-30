import {
  FLEET_STATUS_LABELS,
  type FleetPosition,
} from '@/lib/domain/fleet-position'
import { LeafletMapCanvas } from '@/app/components/maps/LeafletMapCanvas'
import { cn } from '@/lib/utils'
import { MapPin, RefreshCw } from 'lucide-react'
import { useMemo } from 'react'

interface FleetMapPanelProps {
  positions: FleetPosition[]
  onRefresh?: () => void
  className?: string
}

export function FleetMapPanel({ positions, onRefresh, className }: FleetMapPanelProps) {
  const positionsKey = useMemo(
    () =>
      positions
        .map((p) => `${p.vehicleId}:${p.lat.toFixed(4)}:${p.lng.toFixed(4)}:${p.status}`)
        .join('|'),
    [positions],
  )

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-sm font-medium">
          <MapPin className="h-4 w-4 text-primary" />
          Mapa floty · {positions.length} pojazdów
        </p>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Odśwież
          </button>
        )}
      </div>

      <LeafletMapCanvas
        heightClass="h-64 max-h-64 sm:h-72 sm:max-h-72"
        updateDeps={[positionsKey]}
        onReady={() => {}}
        onUpdate={({ markers, L }) => {
          const bounds: [number, number][] = []
          for (const p of positions) {
            if (!Number.isFinite(p.lat) || !Number.isFinite(p.lng)) continue
            bounds.push([p.lat, p.lng])
            const color =
              p.status === 'in_transit'
                ? '#22c55e'
                : p.status === 'loading'
                  ? '#f59e0b'
                  : p.status === 'parked'
                    ? '#64748b'
                    : '#ef4444'

            L.circleMarker([p.lat, p.lng], {
              radius: 10,
              color: '#fff',
              weight: 2,
              fillColor: color,
              fillOpacity: 0.95,
            })
              .addTo(markers)
              .bindPopup(
                `<strong>${p.registration}</strong><br/>${FLEET_STATUS_LABELS[p.status]}${p.driverName ? `<br/>${p.driverName}` : ''}${p.speedKmh != null && p.status === 'in_transit' ? `<br/>${p.speedKmh} km/h` : ''}${p.courseRef ? `<br/>${p.courseRef}` : ''}`,
              )
          }
          return bounds.length > 0 ? bounds : null
        }}
      />

      <ul className="grid gap-2 sm:grid-cols-2">
        {positions.map((p) => (
          <li
            key={`${p.vehicleId}-${p.registration}`}
            className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs"
          >
            <span className="font-semibold">{p.registration}</span>
            <span className="text-muted-foreground"> · {FLEET_STATUS_LABELS[p.status]}</span>
            {p.driverName && <span className="block text-muted-foreground">{p.driverName}</span>}
          </li>
        ))}
      </ul>
      <p className="text-[10px] text-muted-foreground">
        Demo GPS · docelowo telemetria z tachografu / aplikacji kierowcy (PWA)
      </p>
    </div>
  )
}
