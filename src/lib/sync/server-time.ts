import { isSupabaseConfigured, supabaseAnonKey, supabaseFunctionsBase } from '@/config/supabase'

let cachedServerTime: { at: number; iso: string } | null = null
const CACHE_MS = 30_000

/** Czas serwera w UTC (ISO) — nie zegar telefonu / strefa kierowcy za granicą. */
export async function fetchServerTimeUtc(): Promise<string> {
  const now = Date.now()
  if (cachedServerTime && now - cachedServerTime.at < CACHE_MS) {
    return cachedServerTime.iso
  }

  if (!isSupabaseConfigured()) {
    return new Date().toISOString()
  }

  try {
    const res = await fetch(`${supabaseFunctionsBase}/health`, {
      headers: { Authorization: `Bearer ${supabaseAnonKey}`, apikey: supabaseAnonKey },
    })
    if (res.ok) {
      const json = (await res.json()) as { serverTime?: string }
      if (json.serverTime) {
        cachedServerTime = { at: now, iso: json.serverTime }
        return json.serverTime
      }
    }
  } catch {
    /* fallback */
  }

  return new Date().toISOString()
}
