import {
  FLEET_STATUS_LABELS,
  type FleetPosition,
} from '@/lib/domain/fleet-position'
import { cn } from '@/lib/utils'
import type { Map as LeafletMap } from 'leaflet'
import { MapPin, RefreshCw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import 'leaflet/dist/leaflet.css'

interface FleetMapPanelProps {
  positions: FleetPosition[]
  onRefresh?: () => void
  className?: string
}

export function FleetMapPanel({ positions, onRefresh, className }: FleetMapPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    void import('leaflet').then((L) => {
      if (cancelled || !containerRef.current || mapRef.current) return

      const map = L.map(containerRef.current, {
        zoomControl: true,
        scrollWheelZoom: false,
      }).setView([51.1, 17.0], 8)

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

      if (positions.length === 0) return

      const bounds: [number, number][] = []
      for (const p of positions) {
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
          .addTo(map)
          .bindPopup(
            `<strong>${p.registration}</strong><br/>${FLEET_STATUS_LABELS[p.status]}${p.driverName ? `<br/>${p.driverName}` : ''}${p.speedKmh != null && p.status === 'in_transit' ? `<br/>${p.speedKmh} km/h` : ''}${p.courseRef ? `<br/>${p.courseRef}` : ''}`,
          )
      }

      if (bounds.length === 1) {
        map.setView(bounds[0], 10)
      } else if (bounds.length > 1) {
        map.fitBounds(bounds, { padding: [32, 32], maxZoom: 11 })
      }
    })
  }, [positions, ready])

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
      <div
        ref={containerRef}
        className="h-64 w-full overflow-hidden rounded-xl border border-border bg-muted/30 sm:h-80"
        aria-label="Mapa pozycji pojazdów floty"
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
