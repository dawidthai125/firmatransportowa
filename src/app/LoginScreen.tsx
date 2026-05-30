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

    const session = {
      user: {
        id: `user-${role}-demo`,
        displayName: role === 'driver' ? displayName : ROLE_LABELS[role],
        role,
        tenantId: tenant.id,
      },
      tenantId: tenant.id,
      loggedInAt: new Date().toISOString(),
    }

    saveSession(session)
    setCurrentTenant(tenant)
    onLogin(roleToAppMode(role))
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

            {role === 'driver' && (
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
