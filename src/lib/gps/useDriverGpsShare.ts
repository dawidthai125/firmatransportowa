import { upsertDriverLivePosition, setDriverGpsSharingEnabled, isDriverGpsSharingEnabled } from '@/lib/gps/driver-gps'
import { useCallback, useEffect, useRef, useState } from 'react'

interface UseDriverGpsShareOptions {
  tenantId: string
  driverName: string
  vehicleId?: string
  registration?: string
  courseRef?: string
  /** Interwał w ms */
  intervalMs?: number
}

export function useDriverGpsShare({
  tenantId,
  driverName,
  vehicleId,
  registration,
  courseRef,
  intervalMs = 60_000,
}: UseDriverGpsShareOptions) {
  const [enabled, setEnabled] = useState(() => isDriverGpsSharingEnabled(tenantId, driverName))
  const [lastUpdate, setLastUpdate] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const watchId = useRef<number | null>(null)

  const pushPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Brak GPS w urządzeniu')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        upsertDriverLivePosition(tenantId, {
          driverName,
          vehicleId,
          registration,
          courseRef,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          speedKmh: pos.coords.speed != null ? pos.coords.speed * 3.6 : undefined,
        })
        setLastUpdate(new Date().toISOString())
        setError(null)
      },
      (err) => setError(err.message || 'Nie udało się pobrać lokalizacji'),
      { enableHighAccuracy: true, maximumAge: 30_000, timeout: 15_000 },
    )
  }, [tenantId, driverName, vehicleId, registration, courseRef])

  useEffect(() => {
    setDriverGpsSharingEnabled(tenantId, driverName, enabled)
    if (!enabled) {
      if (watchId.current != null) {
        navigator.geolocation.clearWatch(watchId.current)
        watchId.current = null
      }
      return
    }

    pushPosition()

    if (navigator.geolocation.watchPosition) {
      watchId.current = navigator.geolocation.watchPosition(
        (pos) => {
          upsertDriverLivePosition(tenantId, {
            driverName,
            vehicleId,
            registration,
            courseRef,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            speedKmh: pos.coords.speed != null ? pos.coords.speed * 3.6 : undefined,
          })
          setLastUpdate(new Date().toISOString())
          setError(null)
        },
        (err) => setError(err.message),
        { enableHighAccuracy: true, maximumAge: intervalMs, timeout: 20_000 },
      )
    }

    const timer = window.setInterval(pushPosition, intervalMs)
    return () => {
      window.clearInterval(timer)
      if (watchId.current != null) {
        navigator.geolocation.clearWatch(watchId.current)
        watchId.current = null
      }
    }
  }, [enabled, pushPosition, intervalMs, tenantId, driverName, vehicleId, registration, courseRef])

  return { enabled, setEnabled, lastUpdate, error, pushNow: pushPosition }
}
