import {
  ITD_HOTSPOT_TYPE_LABELS,
  type ItdHotspot,
} from '@/lib/domain/itd-types'
import { cn } from '@/lib/utils'
import type { Map as LeafletMap } from 'leaflet'
import { RefreshCw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import 'leaflet/dist/leaflet.css'

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
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    void import('leaflet').then((L) => {
      if (cancelled || !containerRef.current || mapRef.current) return
      const map = L.map(containerRef.current, { scrollWheelZoom: false }).setView([51.9, 19.2], 6)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 18,
      }).addTo(map)
      mapRef.current = map
      setReady(true)
    })
    return () => {
      cancelled = true
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!ready || !mapRef.current) return
    void import('leaflet').then((L) => {
      const map = mapRef.current!
      map.eachLayer((layer) => {
        if ('getLatLng' in layer) map.removeLayer(layer)
      })
      if (hotspots.length === 0) return
      const bounds: [number, number][] = []
      for (const h of hotspots) {
        bounds.push([h.lat, h.lng])
        const color = h.type === 'reported_live' ? '#dc2626' : ACTIVITY_COLOR[h.activity]
        L.circleMarker([h.lat, h.lng], {
          radius: h.type === 'reported_live' ? 12 : 9,
          color: '#fff',
          weight: 2,
          fillColor: color,
          fillOpacity: 0.95,
        })
          .addTo(map)
          .bindPopup(
            `<strong>${h.name}</strong><br/>${ITD_HOTSPOT_TYPE_LABELS[h.type]}${h.road ? ` · ${h.road}` : ''}${h.notes ? `<br/><em>${h.notes}</em>` : ''}`,
          )
      }
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 10 })
    })
  }, [ready, hotspots])

  return (
    <div className={cn('relative', className)}>
      {onRefresh && (
        <button
          type="button"
          onClick={onRefresh}
          className="absolute right-2 top-2 z-[1000] flex items-center gap-1 rounded-lg border border-border bg-background/95 px-2 py-1 text-xs shadow-sm"
        >
          <RefreshCw className="h-3 w-3" />
          Odśwież
        </button>
      )}
      <div ref={containerRef} className="h-[280px] w-full rounded-xl border border-border" />
      <p className="mt-2 text-xs text-muted-foreground">
        Czerwone = zgłoszenia na żywo (4 h) · Pomarańczowe = średnia aktywność · Szare = niska
      </p>
    </div>
  )
}
