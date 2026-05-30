import type { TachographRecordType } from '@/lib/domain/tachograph-types'

export interface ParsedDddFilename {
  recordType: TachographRecordType
  driverHint?: string
  vehicleHint?: string
  periodFrom?: string
  periodTo?: string
}

/** Heurystyka nazwy pliku DDD — bez parsera binarnego (produkcja: SDK tachografu). */
export function parseDddFilename(filename: string): ParsedDddFilename {
  const base = filename.replace(/\.ddd$/i, '')
  const upper = base.toUpperCase()

  let recordType: TachographRecordType = 'unknown'
  if (/^C[_-]|CARD|KIER|DRIVER/.test(upper)) recordType = 'driver_card'
  else if (/^M[_-]|VU|VEHICLE|POJAZD/.test(upper)) recordType = 'vehicle_unit'

  const dates = base.match(/(20\d{6})/g)
  let periodFrom: string | undefined
  let periodTo: string | undefined
  if (dates && dates.length >= 1) {
    periodFrom = isoFromYyyymmdd(dates[0])
    if (dates.length >= 2) periodTo = isoFromYyyymmdd(dates[1])
  }

  const parts = base.split(/[_\-.]+/).filter(Boolean)
  const driverHint = parts.find((p) => /^[A-ZĄĆĘŁŃÓŚŹŻ]{2,}$/i.test(p) && !/^\d+$/.test(p) && p.length <= 24)

  const plateMatch = base.match(/[A-Z]{1,3}\s?[A-Z0-9]{4,6}/i)
  const vehicleHint = plateMatch?.[0]?.replace(/\s/g, '').toUpperCase()

  return { recordType, driverHint, vehicleHint, periodFrom, periodTo }
}

function isoFromYyyymmdd(raw: string): string {
  const y = raw.slice(0, 4)
  const m = raw.slice(4, 6)
  const d = raw.slice(6, 8)
  return `${y}-${m}-${d}`
}

export const TACHOGRAPH_RECORD_TYPE_LABELS: Record<TachographRecordType, string> = {
  driver_card: 'Karta kierowcy',
  vehicle_unit: 'Urządzenie pojazdu (VU)',
  unknown: 'Nie rozpoznano',
}

export const TACHOGRAPH_IMPORT_SOURCE_LABELS = {
  remote_api: 'API partnera (TachoScan / VDO)',
  telematics: 'Telematyka / FMS',
  manual_upload: 'Import ręczny (.ddd)',
} as const
