import { PortalHome } from '@/app/PortalHome'
import { RoleAuthScreen } from '@/app/RoleAuthScreen'
import {
  clearSession,
  loadSession,
  roleToAppMode,
  saveSession,
  ROLE_LABELS,
  type UserRole,
} from '@/lib/auth/session'
import { DEMO_EMAIL_BY_ROLE } from '@/lib/auth/portal-panels'
import { isSupabaseConfigured } from '@/config/supabase'
import { signInWithEmail } from '@/lib/auth/supabase-auth'
import { supabaseSignOut } from '@/lib/auth/supabase-client'
import { findTenantBySlug, getDefaultTenant } from '@/lib/tenant/demo-data'
import { isCompanyDeployment, resolveDefaultTenantSlug } from '@/config/branding'
import { useTenant } from '@/lib/tenant/context'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { AppMode } from '@/lib/auth/session'

interface LoginScreenProps {
  onLogin: (mode: AppMode) => void
}

type PortalStep = 'home' | 'auth'

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const { tenants, setCurrentTenant } = useTenant()
  const [step, setStep] = useState<PortalStep>('home')
  const [companyCode, setCompanyCode] = useState(() => resolveDefaultTenantSlug())
  const [selectedRole, setSelectedRole] = useState<UserRole>('owner')
  const [displayName, setDisplayName] = useState('Jan Kowalski')
  const [email, setEmail] = useState(DEMO_EMAIL_BY_ROLE.owner)
  const [password, setPassword] = useState('')
  const [useEmailLogin, setUseEmailLogin] = useState(false)
  const [error, setError] = useState('')
  const [companyError, setCompanyError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [session, setSession] = useState(() => loadSession())

  const tenant = useMemo(() => {
    if (isCompanyDeployment()) {
      return getDefaultTenant(tenants) ?? null
    }
    return findTenantBySlug(tenants, companyCode) ?? null
  }, [tenants, companyCode])

  useEffect(() => {
    if (tenant) {
      setCurrentTenant(tenant)
      setCompanyError('')
    }
  }, [tenant, setCurrentTenant])

  useEffect(() => {
    if (isCompanyDeployment()) return
    if (!companyCode.trim()) {
      setCompanyError('')
      return
    }
    if (!tenant) {
      setCompanyError('Nie znaleziono firmy o podanym kodzie. Użyj DEMO-TRANS do testów.')
    } else if (tenant.status !== 'active') {
      setCompanyError('Konto firmy jest nieaktywne. Skontaktuj się z administratorem.')
    } else {
      setCompanyError('')
    }
  }, [companyCode, tenant])

  const enterPanel = useCallback(
    (role: UserRole) => {
      onLogin(roleToAppMode(role))
    },
    [onLogin],
  )

  function openPanel(role: UserRole) {
    if (!tenant || tenant.status !== 'active') return
    setSelectedRole(role)
    setEmail(DEMO_EMAIL_BY_ROLE[role])
    setPassword('')
    setError('')
    setUseEmailLogin(false)
    if (role === 'driver') setDisplayName('Jan Kowalski')
    if (role === 'mechanic') setDisplayName('Tomasz Mechanik')
    setStep('auth')
  }

  function handleContinue(role: UserRole) {
    if (!tenant) return
    const current = loadSession()
    if (current && current.user.role === role && current.tenantId === tenant.id) {
      setCurrentTenant(tenant)
      enterPanel(role)
      return
    }
    openPanel(role)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!tenant) {
      setError(isCompanyDeployment() ? 'Błąd konfiguracji firmy.' : 'Najpierw podaj prawidłowy kod firmy.')
      return
    }

    if (tenant.status !== 'active') {
      setError('Konto firmy jest nieaktywne.')
      return
    }

    setSubmitting(true)
    try {
      let built: ReturnType<typeof loadSession> = null

      if (useEmailLogin) {
        built = await signInWithEmail(
          tenant.id,
          email,
          password,
          selectedRole,
          isSupabaseConfigured(),
        )
      } else {
        built = buildDemoSession(tenant.id, selectedRole, displayName)
      }

      if (!built) {
        setError(
          useEmailLogin
            ? 'Nieprawidłowy email, hasło lub brak uprawnień do tego panelu.'
            : 'Błąd logowania',
        )
        return
      }

      saveSession(built)
      setSession(built)
      setCurrentTenant(tenant)
      enterPanel(built.user.role)
    } finally {
      setSubmitting(false)
    }
  }

  function buildDemoSession(tenantId: string, role: UserRole, name: string) {
    const mechanicId = role === 'mechanic' ? 'mechanic-demo-001' : undefined
    return {
      user: {
        id: `user-${role}-demo`,
        displayName: role === 'driver' || role === 'mechanic' ? name : ROLE_LABELS[role],
        role,
        tenantId,
        mechanicId,
      },
      tenantId,
      loggedInAt: new Date().toISOString(),
      authMethod: 'demo' as const,
    }
  }

  if (step === 'auth' && tenant) {
    return (
      <RoleAuthScreen
        role={selectedRole}
        tenant={tenant}
        displayName={displayName}
        onDisplayNameChange={setDisplayName}
        email={email}
        onEmailChange={setEmail}
        password={password}
        onPasswordChange={setPassword}
        useEmailLogin={useEmailLogin}
        onUseEmailLoginChange={setUseEmailLogin}
        error={error}
        onBack={() => {
          setStep('home')
          setError('')
        }}
        onSubmit={handleSubmit}
        submitting={submitting}
      />
    )
  }

  return (
    <PortalHome
      companyCode={companyCode}
      onCompanyCodeChange={setCompanyCode}
      tenant={tenant && tenant.status === 'active' ? tenant : null}
      companyError={companyError}
      session={session?.tenantId === tenant?.id ? session : null}
      onSelectPanel={openPanel}
      onContinueSession={handleContinue}
    />
  )
}

export function handleLogout(setMode: (mode: AppMode) => void) {
  void supabaseSignOut()
  clearSession()
  setMode('login')
}
