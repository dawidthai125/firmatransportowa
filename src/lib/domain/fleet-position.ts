export type FleetVehicleStatus = 'in_transit' | 'loading' | 'parked' | 'offline'

export type FleetPositionSource = 'demo' | 'driver-pwa' | 'telematics'

export type TelematicsProvider = 'webfleet' | 'transics' | 'generic'

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
  /** Id u dostawcy telematyki — deduplikacja webhook */
  externalId?: string
  telematicsProvider?: TelematicsProvider
}

export const FLEET_STATUS_LABELS: Record<FleetVehicleStatus, string> = {
  in_transit: 'W trasie',
  loading: 'Załadunek',
  parked: 'Postój',
  offline: 'Brak sygnału',
}

export const FLEET_POSITION_SOURCE_LABELS: Record<FleetPositionSource, string> = {
  demo: 'Demo GPS',
  'driver-pwa': 'Telefon kierowcy (PWA)',
  telematics: 'Telematyka w aucie',
}

export const TELEMATICS_PROVIDER_LABELS: Record<TelematicsProvider, string> = {
  webfleet: 'Webfleet',
  transics: 'Transics',
  generic: 'Inny dostawca',
}
