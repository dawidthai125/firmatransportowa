/** Scalanie zapisów w chmurze — czas serwera UTC, ochrona przed nadpisaniem nowszej wersji. */

type RecordRow = {
  id: string
  updatedAt?: string
  serverSavedAt?: string
  createdAt?: string
}

type SyncEnvelope = {
  v?: number
  updatedAt?: string
  payload?: unknown
  tombstones?: Record<string, string>
  saveBaselines?: Record<string, string>
}

function normalizeEnv(raw: unknown): SyncEnvelope {
  if (raw && typeof raw === 'object' && 'payload' in (raw as SyncEnvelope)) {
    return raw as SyncEnvelope
  }
  return { v: 1, updatedAt: '1970-01-01T00:00:00.000Z', payload: raw ?? null }
}

function authoritativeTs(row: RecordRow): number {
  const ts = row.serverSavedAt ?? row.updatedAt ?? row.createdAt
  if (!ts) return 0
  const n = Date.parse(ts)
  return Number.isNaN(n) ? 0 : n
}

function stampRow(row: RecordRow, serverAt: string): RecordRow {
  return { ...row, updatedAt: serverAt, serverSavedAt: serverAt }
}

function mergeTombstones(a?: Record<string, string>, b?: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = { ...(a ?? {}) }
  for (const [id, ts] of Object.entries(b ?? {})) {
    const prev = out[id]
    out[id] = !prev || Date.parse(ts) >= Date.parse(prev) ? ts : prev
  }
  return out
}

function applyBaselines(
  prev: RecordRow | undefined,
  inc: RecordRow,
  baselines: Record<string, string>,
  serverAt: string,
): RecordRow {
  if (!prev) return stampRow(inc, serverAt)

  const baseline = baselines[inc.id]
  if (baseline) {
    const prevAuth = prev.serverSavedAt ?? prev.updatedAt ?? prev.createdAt ?? ''
    if (Date.parse(prevAuth) > Date.parse(baseline)) {
      return prev
    }
  } else if (authoritativeTs(prev) > authoritativeTs(inc)) {
    return prev
  }

  return stampRow(inc, serverAt)
}

/** Ostateczny zapis do KV — saveBaselines nie trafia do bazy */
export function mergeSetWithServerAuthority(
  existingRaw: unknown,
  incomingRaw: unknown,
  serverAt: string,
): SyncEnvelope {
  const existing = normalizeEnv(existingRaw)
  const incoming = normalizeEnv(incomingRaw)
  const baselines = incoming.saveBaselines ?? {}
  const tombstones = mergeTombstones(existing.tombstones, incoming.tombstones)

  if (!Array.isArray(incoming.payload)) {
    const { saveBaselines: _b, ...rest } = incoming
    return { ...rest, updatedAt: serverAt, tombstones: Object.keys(tombstones).length ? tombstones : undefined }
  }

  const incomingRows = incoming.payload as RecordRow[]
  if (!Array.isArray(existing.payload)) {
    const payload = incomingRows.map((row) => applyBaselines(undefined, row, baselines, serverAt))
    return { v: 1, updatedAt: serverAt, payload, tombstones: Object.keys(tombstones).length ? tombstones : undefined }
  }

  const existingMap = new Map<string, RecordRow>()
  for (const row of existing.payload as RecordRow[]) {
    existingMap.set(row.id, row)
  }

  const incomingIds = new Set<string>()
  const payload: RecordRow[] = []

  for (const inc of incomingRows) {
    incomingIds.add(inc.id)
    const prev = existingMap.get(inc.id)
    payload.push(applyBaselines(prev, inc, baselines, serverAt))
    existingMap.delete(inc.id)
  }

  for (const row of existingMap.values()) {
    if (!incomingIds.has(row.id)) payload.push(row)
  }

  return {
    v: 1,
    updatedAt: serverAt,
    payload,
    tombstones: Object.keys(tombstones).length ? tombstones : undefined,
  }
}
