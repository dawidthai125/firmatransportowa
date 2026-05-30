import { LeafletMapCanvas } from '@/app/components/maps/LeafletMapCanvas'
import type { FleetPosition } from '@/lib/domain/fleet-position'
import { isGpsStale } from '@/lib/domain/fleet-enrichment'
import { cn } from '@/lib/utils'
import { useMemo } from 'react'

interface VehicleMiniMapProps {
  position: FleetPosition
  className?: string
}

export function VehicleMiniMap({ position, className }: VehicleMiniMapProps) {
  const stale = isGpsStale(position.updatedAt)
  const mapKey = useMemo(
    () => `${position.lat.toFixed(5)}:${position.lng.toFixed(5)}:${position.updatedAt}`,
    [position.lat, position.lng, position.updatedAt],
  )

  if (!Number.isFinite(position.lat) || !Number.isFinite(position.lng)) {
    return (
      <div className={cn('rounded-lg border border-dashed border-border bg-muted/30 p-4 text-xs text-muted-foreground', className)}>
        Brak współrzędnych GPS
      </div>
    )
  }

  return (
    <LeafletMapCanvas
      className={cn('overflow-hidden rounded-lg border border-border', className)}
      heightClass="h-40 max-h-40"
      updateDeps={[mapKey, stale]}
      onReady={() => {}}
      onUpdate={({ markers, L, map }) => {
        map.setView([position.lat, position.lng], 11)
        const color = stale ? '#ef4444' : position.status === 'in_transit' ? '#22c55e' : '#64748b'
        L.circleMarker([position.lat, position.lng], {
          radius: 9,
          color: '#fff',
          weight: 2,
          fillColor: color,
          fillOpacity: 0.95,
        })
          .addTo(markers)
          .bindPopup(`<strong>${position.registration}</strong>`)
        return [[position.lat, position.lng]]
      }}
    />
  )
}
