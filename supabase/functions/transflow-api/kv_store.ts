/** KV store — tabela kv_store_transflow (osobny projekt Supabase, NIE wgdom). */
import { createClient } from 'jsr:@supabase/supabase-js@2.49.8'

const client = () => {
  const url = Deno.env.get('SUPABASE_URL')!
  const key =
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ??
    Deno.env.get('SUPABASE_SECRET_KEY') ??
    Object.values(JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') ?? '{}'))[0]
  if (!key) throw new Error('Missing Supabase service/secret key in Edge Function env')
  return createClient(url, key as string)
}

const TABLE = 'kv_store_transflow'

export const set = async (key: string, value: unknown): Promise<void> => {
  const { error } = await client().from(TABLE).upsert({ key, value })
  if (error) throw new Error(error.message)
}

export const get = async (key: string): Promise<unknown> => {
  const { data, error } = await client().from(TABLE).select('value').eq('key', key).maybeSingle()
  if (error) throw new Error(error.message)
  return data?.value
}

export const mset = async (keys: string[], values: unknown[]): Promise<void> => {
  const { error } = await client()
    .from(TABLE)
    .upsert(keys.map((k, i) => ({ key: k, value: values[i] })))
  if (error) throw new Error(error.message)
}

export const mget = async (keys: string[]): Promise<unknown[]> => {
  if (keys.length === 0) return []
  const { data, error } = await client().from(TABLE).select('key, value').in('key', keys)
  if (error) throw new Error(error.message)
  const map = new Map(data?.map((d) => [d.key, d.value]))
  return keys.map((k) => map.get(k) ?? null)
}
