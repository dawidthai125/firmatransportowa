import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import {
  isSupabaseConfigured,
  supabaseAnonKey,
  supabaseUrl,
} from '@/config/supabase'

let client: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null
  if (!client) {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: localStorage,
      },
    })
  }
  return client
}

export async function getSupabaseAccessToken(): Promise<string | null> {
  const sb = getSupabaseClient()
  if (!sb) return null
  const { data } = await sb.auth.getSession()
  return data.session?.access_token ?? null
}

export async function supabaseSignOut(): Promise<void> {
  const sb = getSupabaseClient()
  if (sb) await sb.auth.signOut()
}
