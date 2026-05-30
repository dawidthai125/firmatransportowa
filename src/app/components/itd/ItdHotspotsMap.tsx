import { LeafletMapCanvas } from '@/app/components/maps/LeafletMapCanvas'
import {
  ITD_HOTSPOT_TYPE_LABELS,
  type ItdHotspot,
} from '@/lib/domain/itd-types'
import { cn } from '@/lib/utils'
import { RefreshCw } from 'lucide-react'
import { useMemo } from 'react'

interface ItdHotspotsMapProps {
  hotspots: ItdHotspot[]
  className?: string
  onRefresh?: () => void
}

const ACTIVITY_COLOR = {
  low: '#64748b',
  medium: '#f59e0b',
  high: '#ef4444',
}

export function ItdHotspotsMap({ hotspots, className, onRefresh }: ItdHotspotsMapProps) {
  const hotspotsKey = useMemo(
    () => hotspots.map((h) => `${h.id}:${h.lat}:${h.lng}:${h.moderation ?? ''}`).join('|'),
    [hotspots],
  )

  return (
    <div className={cn('relative', className)}>
      {onRefresh && (
        <button
          type="button"
          onClick={onRefresh}
          className="absolute right-2 top-2 z-10 flex items-center gap-1 rounded-lg border border-border bg-background/95 px-2 py-1 text-xs shadow-sm"
        >
          <RefreshCw className="h-3 w-3" />
          Odśwież
        </button>
      )}

      <LeafletMapCanvas
        heightClass="h-[280px] max-h-[280px]"
        updateDeps={[hotspotsKey]}
        onReady={() => {}}
        onUpdate={({ markers, L }) => {
          const bounds: [number, number][] = []
          for (const h of hotspots) {
            if (!Number.isFinite(h.lat) || !Number.isFinite(h.lng)) continue
            bounds.push([h.lat, h.lng])
            const color = h.type === 'reported_live' ? '#dc2626' : ACTIVITY_COLOR[h.activity]
            L.circleMarker([h.lat, h.lng], {
              radius: h.type === 'reported_live' ? 12 : 9,
              color: '#fff',
              weight: 2,
              fillColor: color,
              fillOpacity: 0.95,
            })
              .addTo(markers)
              .bindPopup(
                `<strong>${h.name}</strong><br/>${ITD_HOTSPOT_TYPE_LABELS[h.type]}${h.road ? ` · ${h.road}` : ''}${h.notes ? `<br/><em>${h.notes}</em>` : ''}`,
              )
          }
          return bounds.length > 0 ? bounds : null
        }}
      />

      <p className="mt-2 text-xs text-muted-foreground">
        Czerwone = zgłoszenia na żywo (4 h) · Pomarańczowe = średnia aktywność · Szare = niska
      </p>
    </div>
  )
}
