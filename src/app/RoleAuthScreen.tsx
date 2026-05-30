import { Button } from '@/app/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/Card'
import { Input, Label } from '@/app/components/ui/Input'
import { TransportImageBg } from '@/app/components/transport/TransportImageBg'
import { DEMO_EMAIL_BY_ROLE, PORTAL_PANELS } from '@/lib/auth/portal-panels'
import { DEMO_PASSWORD } from '@/lib/auth/users'
import type { UserRole } from '@/lib/auth/session'
import { ROLE_LABELS } from '@/lib/auth/session'
import { getPanelTheme } from '@/lib/theme/transport-images'
import type { Tenant } from '@/lib/tenant/types'
import { cn } from '@/lib/utils'
import { ArrowLeft, Truck } from 'lucide-react'

interface RoleAuthScreenProps {
  role: UserRole
  tenant: Tenant
  displayName: string
  onDisplayNameChange: (name: string) => void
  email: string
  onEmailChange: (email: string) => void
  password: string
  onPasswordChange: (password: string) => void
  useEmailLogin: boolean
  onUseEmailLoginChange: (value: boolean) => void
  error: string
  onBack: () => void
  onSubmit: (e: React.FormEvent) => void
}

export function RoleAuthScreen({
  role,
  tenant,
  displayName,
  onDisplayNameChange,
  email,
  onEmailChange,
  password,
  onPasswordChange,
  useEmailLogin,
  onUseEmailLoginChange,
  error,
  onBack,
  onSubmit,
}: RoleAuthScreenProps) {
  const panel = PORTAL_PANELS.find((p) => p.role === role)!
  const theme = getPanelTheme(role)
  const Icon = panel.icon
  const needsName = (role === 'driver' || role === 'mechanic') && !useEmailLogin

  return (
    <div className="relative flex min-h-full w-full">
      <TransportImageBg
        src={theme.image}
        alt={theme.imageAlt}
        overlayClass="from-background via-background/95 to-background"
      />

      {/* Desktop: panel z grafiką */}
      <aside className="relative hidden w-[42%] max-w-xl overflow-hidden lg:flex lg:flex-col">
        <img src={theme.image} alt={theme.imageAlt} className="absolute inset-0 h-full w-full object-cover" />
        <div className={cn('absolute inset-0 bg-gradient-to-t', theme.overlayClass)} aria-hidden />
        <div className="relative flex flex-1 flex-col justify-between p-10">
          <div className="flex items-center gap-2 text-foreground/90">
            <Truck className="h-6 w-6 text-primary" />
            <span className="font-semibold">TransFlow</span>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-foreground/60">
              {theme.badge}
            </p>
            <h1 className="mt-2 text-3xl font-bold leading-tight text-foreground">{panel.title}</h1>
            <p className="mt-3 text-base leading-relaxed text-foreground/80">{theme.tagline}</p>
            <p className="mt-6 text-sm text-foreground/60">{tenant.name}</p>
          </div>
        </div>
      </aside>

      <div className="relative flex flex-1 items-center justify-center p-4 sm:p-8">
        <Card className="glass-card w-full max-w-md border-border/80 shadow-2xl">
          <CardHeader>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="-ml-2 mb-2 w-fit gap-1"
              onClick={onBack}
            >
              <ArrowLeft className="h-4 w-4" />
              Wybór panelu
            </Button>
            <div className="flex items-center gap-3 lg:hidden">
              <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl', panel.iconClass)}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>{panel.title}</CardTitle>
                <CardDescription>
                  {tenant.name} · {ROLE_LABELS[role]}
                </CardDescription>
              </div>
            </div>
            <div className="hidden lg:block">
              <CardTitle>Logowanie</CardTitle>
              <CardDescription>
                {ROLE_LABELS[role]} · {tenant.name}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              {needsName && (
                <div className="space-y-2">
                  <Label htmlFor="name">
                    {role === 'mechanic' ? 'Imię i nazwisko mechanika' : 'Imię i nazwisko kierowcy'}
                  </Label>
                  <Input
                    id="name"
                    value={displayName}
                    onChange={(e) => onDisplayNameChange(e.target.value)}
                    placeholder={role === 'mechanic' ? 'Tomasz Mechanik' : 'Jan Kowalski'}
                    className="bg-background/70"
                  />
                </div>
              )}

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={useEmailLogin}
                  onChange={(e) => {
                    onUseEmailLoginChange(e.target.checked)
                    if (e.target.checked) onEmailChange(DEMO_EMAIL_BY_ROLE[role])
                  }}
                  className="h-4 w-4 rounded border-border"
                />
                Logowanie emailem (demo: {DEMO_PASSWORD})
              </label>

              {useEmailLogin && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => onEmailChange(e.target.value)}
                      autoComplete="username"
                      className="bg-background/70"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Hasło</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => onPasswordChange(e.target.value)}
                      autoComplete="current-password"
                      className="bg-background/70"
                    />
                  </div>
                </>
              )}

              {error && <p className="text-sm text-danger">{error}</p>}

              <Button type="submit" className="w-full gap-2" size="lg">
                <Icon className="h-4 w-4" />
                Zaloguj i wejdź
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
