export type FleetVehicleStatus = 'in_transit' | 'loading' | 'parked' | 'offline'

export type FleetPositionSource = 'demo' | 'driver-pwa'

export interface FleetPosition {
  vehicleId: string
  registration: string
  driverName?: string
  courseRef?: string
  lat: number
  lng: number
  speedKmh?: number
  heading?: number
  updatedAt: string
  status: FleetVehicleStatus
  source?: FleetPositionSource
}

export const FLEET_STATUS_LABELS: Record<FleetVehicleStatus, string> = {
  in_transit: 'W trasie',
  loading: 'Załadunek',
  parked: 'Postój',
  offline: 'Brak sygnału',
}
