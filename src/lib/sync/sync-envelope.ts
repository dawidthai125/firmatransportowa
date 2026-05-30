/** Wersjonowany blob w localStorage / KV — umożliwia LWW i merge bez utraty danych */

export const SYNC_ENVELOPE_VERSION = 1 as const

export interface SyncEnvelope<T = unknown> {
  v: typeof SYNC_ENVELOPE_VERSION
  /** ISO — czas ostatniego zapisu na tym kliencie (po merge) */
  updatedAt: string
  payload: T
}

export function isSyncEnvelope(raw: unknown): raw is SyncEnvelope {
  return (
    typeof raw === 'object' &&
    raw !== null &&
    (raw as SyncEnvelope).v === SYNC_ENVELOPE_VERSION &&
    'payload' in raw &&
    typeof (raw as SyncEnvelope).updatedAt === 'string'
  )
}

export function wrapForSync<T>(payload: T, updatedAt = new Date().toISOString()): SyncEnvelope<T> {
  return { v: SYNC_ENVELOPE_VERSION, updatedAt, payload }
}

/** Odczyt z localStorage — obsługa legacy (surowa tablica/obiekt sprzed v0.8.2) */
export function unwrapFromSync<T>(raw: unknown, fallback: T): T {
  if (raw == null) return fallback
  if (isSyncEnvelope(raw)) return raw.payload as T
  return raw as T
}

export function normalizeToEnvelope<T>(raw: unknown, fallback: T): SyncEnvelope<T> {
  if (isSyncEnvelope(raw)) return raw as SyncEnvelope<T>
  return {
    v: SYNC_ENVELOPE_VERSION,
    updatedAt: '1970-01-01T00:00:00.000Z',
    payload: (raw ?? fallback) as T,
  }
}

export function maxIso(a?: string, b?: string): string {
  if (!a) return b ?? new Date().toISOString()
  if (!b) return a
  return Date.parse(a) >= Date.parse(b) ? a : b
}

export function recordTimestamp(item: {
  updatedAt?: string
  importedAt?: string
  createdAt?: string
}): number {
  const ts = item.updatedAt ?? item.importedAt ?? item.createdAt
  if (!ts) return 0
  const n = Date.parse(ts)
  return Number.isNaN(n) ? 0 : n
}
