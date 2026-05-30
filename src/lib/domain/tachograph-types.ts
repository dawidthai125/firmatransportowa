/** Skąd trafił odczyt — ręczny upload, API partnera lub telematyka/FMS */
export type TachographImportSource = 'remote_api' | 'telematics' | 'manual_upload'

/** Typ rekordu tachografu (karta / VU) */
export type TachographRecordType = 'driver_card' | 'vehicle_unit' | 'unknown'

export interface TachographDownload {
  id: string
  tenantId: string
  filename: string
  /** Kanał importu */
  source: TachographImportSource
  /** Rodzaj odczytu DDD */
  recordType: TachographRecordType
  driverId?: string
  driverName?: string
  vehicleRegistration?: string
  periodFrom?: string
  periodTo?: string
  sizeBytes: number
  importedAt: string
  /** Ostatnia synchronizacja z API (remote/telematics) */
  lastSyncAt?: string
  /** Zdekodowane minuty jazdy / odpoczynku — gdy partner API dostarcza */
  drivingMinutes?: number
  restMinutes?: number
  fileId?: string
  notes?: string
  /** Identyfikator u dostawcy — deduplikacja przy sync */
  externalId?: string
}
