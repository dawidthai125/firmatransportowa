import { Button } from '@/app/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/Card'
import { Input, Label, Select } from '@/app/components/ui/Input'
import {
  clearSession,
  loadSession,
  roleToAppMode,
  saveSession,
  ROLE_LABELS,
  type UserRole,
} from '@/lib/auth/session'
import { DEMO_PASSWORD, findDemoUserByEmail, validateDemoCredentials } from '@/lib/auth/users'
import { findTenantBySlug } from '@/lib/tenant/demo-data'
import { useTenant } from '@/lib/tenant/context'
import { Truck } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { AppMode } from '@/lib/auth/session'

interface LoginScreenProps {
  onLogin: (mode: AppMode) => void
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const { tenants, setCurrentTenant } = useTenant()
  const [companyCode, setCompanyCode] = useState('DEMO-TRANS')
  const [role, setRole] = useState<UserRole>('owner')
  const [displayName, setDisplayName] = useState('Jan Kowalski')
  const [email, setEmail] = useState('wlasciciel@demo-trans.pl')
  const [password, setPassword] = useState('')
  const [useEmailLogin, setUseEmailLogin] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const existing = loadSession()
    if (existing) {
      const tenant = tenants.find((t) => t.id === existing.tenantId)
      if (tenant) {
        setCurrentTenant(tenant)
        onLogin(roleToAppMode(existing.user.role))
      }
    }
  }, [onLogin, setCurrentTenant, tenants])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const tenant = findTenantBySlug(tenants, companyCode)
    if (!tenant) {
      setError('Nie znaleziono firmy o podanym kodzie. Użyj DEMO-TRANS do testów.')
      return
    }

    if (tenant.status !== 'active') {
      setError('Konto firmy jest nieaktywne. Skontaktuj się z administratorem.')
      return
    }

    const session = useEmailLogin
      ? buildEmailSession(tenant.id, email, password, role)
      : buildDemoSession(tenant.id, role, displayName)

    if (!session) {
      setError(
        useEmailLogin
          ? 'Nieprawidłowy email lub hasło. Demo: hasło demo2026'
          : 'Błąd logowania',
      )
      return
    }

    saveSession(session)
    setCurrentTenant(tenant)
    onLogin(roleToAppMode(session.user.role))
  }

  function buildDemoSession(tenantId: string, role: UserRole, name: string) {
    return {
      user: {
        id: `user-${role}-demo`,
        displayName: role === 'driver' ? name : ROLE_LABELS[role],
        role,
        tenantId,
      },
      tenantId,
      loggedInAt: new Date().toISOString(),
      authMethod: 'demo' as const,
    }
  }

  function buildEmailSession(
    tenantId: string,
    userEmail: string,
    userPassword: string,
    selectedRole: UserRole,
  ) {
    const user = validateDemoCredentials(tenantId, userEmail, userPassword)
    if (!user) return null
    if (user.role !== selectedRole) {
      const match = findDemoUserByEmail(tenantId, userEmail)
      if (!match || match.role !== selectedRole) return null
    }
    return {
      user: {
        id: user.id,
        displayName: user.displayName,
        role: user.role,
        tenantId,
      },
      tenantId,
      loggedInAt: new Date().toISOString(),
      email: user.email,
      authMethod: 'demo' as const,
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Truck className="h-7 w-7" />
          </div>
          <CardTitle className="text-xl">TransFlow</CardTitle>
          <CardDescription>
            System zarządzania firmą transportową · multi-tenant SaaS
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company">Kod firmy</Label>
              <Input
                id="company"
                value={companyCode}
                onChange={(e) => setCompanyCode(e.target.value.toUpperCase())}
                placeholder="np. DEMO-TRANS"
                autoComplete="organization"
              />
              <p className="text-xs text-muted-foreground">
                Każda firma ma unikalny kod — dane są od siebie izolowane.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Rola</Label>
              <Select id="role" value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
                <option value="owner">Właściciel / Admin</option>
                <option value="dispatcher">Dyspozytor</option>
                <option value="driver">Kierowca</option>
              </Select>
            </div>

            {role === 'driver' && !useEmailLogin && (
              <div className="space-y-2">
                <Label htmlFor="name">Imię i nazwisko kierowcy</Label>
                <Input
                  id="name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Jan Kowalski"
                />
              </div>
            )}

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={useEmailLogin}
                onChange={(e) => {
                  setUseEmailLogin(e.target.checked)
                  if (e.target.checked) {
                    if (role === 'owner') setEmail('wlasciciel@demo-trans.pl')
                    else if (role === 'dispatcher') setEmail('dyspozytor@demo-trans.pl')
                    else setEmail('jan.kowalski@demo-trans.pl')
                  }
                }}
                className="h-4 w-4 rounded border-border"
              />
              Logowanie emailem (v0.7 — demo hasło: {DEMO_PASSWORD})
            </label>

            {useEmailLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Hasło</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                </div>
              </>
            )}

            {error && <p className="text-sm text-danger">{error}</p>}

            <Button type="submit" className="w-full" size="lg">
              Wejdź do systemu
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Wersja dev · dane w localStorage · docelowo Supabase + abonament
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export function handleLogout(setMode: (mode: AppMode) => void) {
  clearSession()
  setMode('login')
}
