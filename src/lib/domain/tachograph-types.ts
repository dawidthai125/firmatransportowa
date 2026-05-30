/** Import pliku tachografu (format DDD) — metadane bez pełnego dekodowania binarnego. */
export type TachographSource = 'driver_card' | 'vehicle_unit' | 'unknown'

export interface TachographDownload {
  id: string
  tenantId: string
  filename: string
  source: TachographSource
  /** Kierowca przypisany ręcznie lub z nazwy pliku */
  driverId?: string
  driverName?: string
  vehicleRegistration?: string
  periodFrom?: string
  periodTo?: string
  sizeBytes: number
  importedAt: string
  /** ID pliku w bibliotece Pliki (jeśli zapisano) */
  fileId?: string
  notes?: string
}
