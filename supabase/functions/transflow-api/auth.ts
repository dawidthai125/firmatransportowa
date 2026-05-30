import { createClient } from 'jsr:@supabase/supabase-js@2.49.8'

export interface TenantMember {
  tenant_id: string
  role: string
  email: string
}

export type RequestAuth =
  | { mode: 'anon' }
  | { mode: 'user'; userId: string; tenantIds: string[]; members: TenantMember[] }

function supabaseUrl(): string {
  return Deno.env.get('SUPABASE_URL') ?? ''
}

function anonKey(): string {
  return (
    Deno.env.get('SUPABASE_ANON_KEY') ??
    Deno.env.get('SUPABASE_PUBLISHABLE_KEY') ??
    ''
  )
}

function serviceRoleKey(): string {
  return (
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ??
    Deno.env.get('SUPABASE_SECRET_KEY') ??
    Deno.env.get('SUPABASE_SECRET_KEYS') ??
    ''
  )
}

export async function resolveRequestAuth(authHeader: string | undefined): Promise<RequestAuth> {
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : ''
  const anon = anonKey()

  if (!token || !supabaseUrl() || token === anon) {
    return { mode: 'anon' }
  }

  const userClient = createClient(supabaseUrl(), anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
  const { data: userData, error: userError } = await userClient.auth.getUser(token)
  if (userError || !userData.user) {
    return { mode: 'anon' }
  }

  const admin = createClient(supabaseUrl(), serviceRoleKey())
  const { data: members, error } = await admin
    .from('tenant_members')
    .select('tenant_id, role, email')
    .eq('user_id', userData.user.id)
    .eq('active', true)

  if (error || !members?.length) {
    return { mode: 'anon' }
  }

  return {
    mode: 'user',
    userId: userData.user.id,
    tenantIds: members.map((m) => m.tenant_id as string),
    members: members as TenantMember[],
  }
}

const REGISTRY_KEY = 'ft-tenants-registry'

export function canReadKey(auth: RequestAuth, key: string): boolean {
  if (auth.mode === 'anon') return true
  if (key === REGISTRY_KEY) return true
  return auth.tenantIds.some((tid) => key.startsWith(`ft-${tid}-`))
}

export function canWriteKey(auth: RequestAuth, key: string): boolean {
  if (auth.mode === 'anon') return true
  if (key === REGISTRY_KEY) {
    return auth.members.some((m) => m.role === 'owner' || m.role === 'dispatcher')
  }
  return auth.tenantIds.some((tid) => key.startsWith(`ft-${tid}-`))
}

export function filterReadableKeys(auth: RequestAuth, keys: string[]): string[] {
  return keys.filter((k) => canReadKey(auth, k))
}

export function filterWritableEntries(
  auth: RequestAuth,
  entries: { key: string; value: unknown }[],
): { key: string; value: unknown }[] {
  return entries.filter((e) => canWriteKey(auth, e.key))
}
