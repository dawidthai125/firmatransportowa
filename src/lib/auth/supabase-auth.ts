import type { AuthSession, UserRole } from '@/lib/auth/session'
import { validateDemoCredentials } from '@/lib/auth/users'
import { getSupabaseClient } from '@/lib/auth/supabase-client'

export interface TenantMemberRow {
  id: string
  user_id: string | null
  tenant_id: string
  email: string
  role: UserRole
  display_name: string
  mechanic_id: string | null
  active: boolean
}

function memberToSession(member: TenantMemberRow, email: string): AuthSession {
  return {
    user: {
      id: member.user_id ?? member.id,
      displayName: member.display_name,
      role: member.role,
      tenantId: member.tenant_id,
      mechanicId: member.mechanic_id ?? undefined,
    },
    tenantId: member.tenant_id,
    loggedInAt: new Date().toISOString(),
    email,
    authMethod: 'supabase',
  }
}

/** Logowanie Supabase Auth + weryfikacja roli w tenant_members */
export async function signInWithSupabase(
  tenantId: string,
  email: string,
  password: string,
  expectedRole: UserRole,
): Promise<AuthSession | null> {
  const sb = getSupabaseClient()
  if (!sb) return null

  const normalizedEmail = email.trim().toLowerCase()

  let session = (await sb.auth.signInWithPassword({ email: normalizedEmail, password })).data
    .session

  if (!session) return null

  const { data: members, error } = await sb.rpc('get_my_memberships')
  if (error || !members?.length) {
    await sb.auth.signOut()
    return null
  }

  const member = (members as TenantMemberRow[]).find(
    (m) => m.tenant_id === tenantId && m.role === expectedRole && m.active,
  )
  if (!member) {
    await sb.auth.signOut()
    return null
  }

  return memberToSession(member, normalizedEmail)
}

/** Przywróć sesję aplikacji z aktywnego JWT — dowolna aktywna rola w tenantcie */
export async function restoreSupabaseAppSessionFromJwt(
  tenantId: string,
): Promise<AuthSession | null> {
  const sb = getSupabaseClient()
  if (!sb) return null

  const { data } = await sb.auth.getSession()
  if (!data.session?.user.email) return null

  const { data: members, error } = await sb.rpc('get_my_memberships')
  if (error || !members?.length) return null

  const member = (members as TenantMemberRow[]).find(
    (m) => m.tenant_id === tenantId && m.active,
  )
  if (!member) return null

  return memberToSession(member, data.session.user.email)
}

/** Demo fallback gdy Supabase Auth niedostępny lub użytkownik nie istnieje w Auth */
export function signInWithDemoFallback(
  tenantId: string,
  email: string,
  password: string,
  expectedRole: UserRole,
): AuthSession | null {
  const user = validateDemoCredentials(tenantId, email, password)
  if (!user || user.role !== expectedRole) return null
  return {
    user: {
      id: user.id,
      displayName: user.displayName,
      role: user.role,
      tenantId,
      mechanicId: user.mechanicId,
    },
    tenantId,
    loggedInAt: new Date().toISOString(),
    email: user.email,
    authMethod: 'demo',
  }
}

export async function signInWithEmail(
  tenantId: string,
  email: string,
  password: string,
  expectedRole: UserRole,
  preferSupabase: boolean,
): Promise<AuthSession | null> {
  if (preferSupabase && getSupabaseClient()) {
    const supabaseSession = await signInWithSupabase(tenantId, email, password, expectedRole)
    if (supabaseSession) return supabaseSession
  }
  return signInWithDemoFallback(tenantId, email, password, expectedRole)
}
