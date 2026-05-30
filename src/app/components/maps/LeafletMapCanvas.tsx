import { cn } from '@/lib/utils'
import type { LayerGroup, Map as LeafletMap } from 'leaflet'
import { useEffect, useRef, useState } from 'react'

import 'leaflet/dist/leaflet.css'

const DEFAULT_CENTER: [number, number] = [51.9, 19.2]
const DEFAULT_ZOOM = 6

export interface LeafletMapHandle {
  map: LeafletMap
  markers: LayerGroup
  L: typeof import('leaflet')
}

interface LeafletMapCanvasProps {
  className?: string
  heightClass?: string
  onReady: (handle: LeafletMapHandle) => void
  onUpdate: (handle: LeafletMapHandle) => [number, number][] | null
  updateDeps: readonly unknown[]
}

function clearLeafletContainer(el: HTMLElement | null) {
  if (!el) return
  const internal = el as HTMLElement & { _leaflet_id?: number }
  if (internal._leaflet_id != null) {
    delete internal._leaflet_id
  }
}

/** Wspólny canvas Leaflet — stała wysokość, jedna warstwa markerów */
export function LeafletMapCanvas({
  className,
  heightClass = 'h-64 max-h-64',
  onReady,
  onUpdate,
  updateDeps,
}: LeafletMapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const markersRef = useRef<LayerGroup | null>(null)
  const leafletRef = useRef<typeof import('leaflet') | null>(null)
  const didFitRef = useRef(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    const container = containerRef.current
    if (!container) return

    void import('leaflet').then((L) => {
      if (cancelled || !containerRef.current || mapRef.current) return

      clearLeafletContainer(containerRef.current)

      const map = L.map(containerRef.current, {
        zoomControl: true,
        scrollWheelZoom: false,
        attributionControl: true,
      }).setView(DEFAULT_CENTER, DEFAULT_ZOOM)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 18,
      }).addTo(map)

      const markers = L.layerGroup().addTo(map)

      mapRef.current = map
      markersRef.current = markers
      leafletRef.current = L

      requestAnimationFrame(() => {
        if (!cancelled && mapRef.current) {
          mapRef.current.invalidateSize()
        }
      })

      onReady({ map, markers, L })
      setReady(true)
    })

    return () => {
      cancelled = true
      didFitRef.current = false
      mapRef.current?.remove()
      mapRef.current = null
      markersRef.current = null
      leafletRef.current = null
      clearLeafletContainer(containerRef.current)
      setReady(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init once
  }, [])

  useEffect(() => {
    if (!ready || !mapRef.current || !markersRef.current || !leafletRef.current) return

    const handle: LeafletMapHandle = {
      map: mapRef.current,
      markers: markersRef.current,
      L: leafletRef.current,
    }

    markersRef.current.clearLayers()
    const bounds = onUpdate(handle)

    if (bounds && bounds.length > 0 && !didFitRef.current) {
      const map = mapRef.current
      if (bounds.length === 1) {
        map.setView(bounds[0], 10)
      } else {
        map.fitBounds(bounds, { padding: [32, 32], maxZoom: 11 })
      }
      didFitRef.current = true
    }

    requestAnimationFrame(() => mapRef.current?.invalidateSize())
    // eslint-disable-next-line react-hooks/exhaustive-deps -- controlled by updateDeps
  }, [ready, ...updateDeps])

  return (
    <div
      className={cn(
        'map-panel-root relative isolate w-full shrink-0 overflow-hidden rounded-xl border border-border bg-muted/30',
        heightClass,
        className,
      )}
    >
      <div ref={containerRef} className="absolute inset-0 z-0" aria-hidden />
    </div>
  )
}
