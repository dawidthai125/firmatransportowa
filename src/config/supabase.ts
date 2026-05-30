/**
 * Konfiguracja Supabase — OSOBNY projekt (nie wgdom).
 * Lokalnie: .env | Produkcja: Vercel → Environment Variables
 */
const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
const functionSlug =
  (import.meta.env.VITE_SUPABASE_FUNCTION_SLUG as string | undefined) || 'transflow-api'

if (!projectId || !anonKey) {
  console.warn(
    '[TransFlow] Brak VITE_SUPABASE_PROJECT_ID lub VITE_SUPABASE_ANON_KEY. ' +
      'Dane tylko w localStorage. Zobacz SUPABASE-SETUP.md',
  )
}

export const supabaseProjectId = projectId ?? ''
export const supabaseAnonKey = anonKey ?? ''
export const supabaseFunctionSlug = functionSlug

export const supabaseFunctionsBase = projectId
  ? `https://${projectId}.supabase.co/functions/v1/${functionSlug}`
  : ''

export function isSupabaseConfigured(): boolean {
  return Boolean(projectId && anonKey)
}
