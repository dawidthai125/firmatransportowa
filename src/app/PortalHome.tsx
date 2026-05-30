import { Button } from '@/app/components/ui/Button'
import { Input, Label } from '@/app/components/ui/Input'
import { PortalPanelTile } from '@/app/components/transport/PortalPanelTile'
import { TransportImageBg } from '@/app/components/transport/TransportImageBg'
import type { AuthSession } from '@/lib/auth/session'
import { PORTAL_PANELS } from '@/lib/auth/portal-panels'
import {
  DRIVER_VALUE_PROPS,
  OWNER_VALUE_PROPS,
  PORTAL_SUBTITLE,
  PRODUCT_TAGLINE,
} from '@/lib/theme/transport-messaging'
import {
  TRANSPORT_HERO_IMAGE,
  TRANSPORT_PORT_IMAGE,
} from '@/lib/theme/transport-images'
import type { Tenant } from '@/lib/tenant/types'
import type { UserRole } from '@/lib/auth/session'
import {
  Building2,
  CheckCircle2,
  Container,
  Globe2,
  Route,
  ShieldCheck,
  Truck,
} from 'lucide-react'

interface PortalHomeProps {
  companyCode: string
  onCompanyCodeChange: (code: string) => void
  tenant: Tenant | null
  companyError: string
  session: AuthSession | null
  onSelectPanel: (role: UserRole) => void
  onContinueSession: (role: UserRole) => void
}

const HIGHLIGHTS = [
  { icon: Truck, label: 'Flota ciężarowa', desc: 'Ciągniki, naczepy, przeglądy' },
  { icon: Route, label: 'Kursy TSL', desc: 'Kraj i międzynarodówka · CMR' },
  { icon: Container, label: 'Logistyka', desc: 'Dyspozycja i rozliczenia' },
  { icon: ShieldCheck, label: 'Zgodność ITD', desc: 'Licencje, czas jazdy, RMPD' },
]

export function PortalHome({
  companyCode,
  onCompanyCodeChange,
  tenant,
  companyError,
  session,
  onSelectPanel,
  onContinueSession,
}: PortalHomeProps) {
  return (
    <div className="relative min-h-full pb-8">
      <TransportImageBg
        src={TRANSPORT_HERO_IMAGE}
        alt="Ciężarówki na autostradzie — logistyka drogowa"
        overlayClass="from-background via-background/92 to-background"
      />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/60">
        <TransportImageBg
          src={TRANSPORT_PORT_IMAGE}
          alt="Terminal portowy i logistyka kontenerowa"
          overlayClass="from-background/20 via-primary/30 to-background/95"
          position="absolute"
          className="opacity-60"
        />
        <div className="portal-grid-bg absolute inset-0 opacity-40" aria-hidden />

        <div className="relative mx-auto max-w-6xl px-4 pb-10 pt-10 sm:pb-14 sm:pt-14">
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary backdrop-blur-sm">
              <Globe2 className="h-3.5 w-3.5" />
              System dla polskich firm transportowych · TSL
            </div>
            <div className="flex flex-col items-center gap-4 lg:flex-row lg:items-center">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/60 shadow-lg shadow-primary/30">
                <Truck className="h-9 w-9 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                  Trans<span className="text-primary">Flow</span>
                </h1>
                <p className="mt-2 max-w-xl text-base font-medium text-foreground/90 sm:text-lg">
                  {PRODUCT_TAGLINE}
                </p>
                <p className="mt-1 max-w-xl text-sm text-muted-foreground">{PORTAL_SUBTITLE}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="glass-card rounded-xl p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">
                Dla właściciela firmy
              </p>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                {OWNER_VALUE_PROPS.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="text-primary">·</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="glass-card rounded-xl p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-success">
                Dla kierowcy ciężarówki
              </p>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                {DRIVER_VALUE_PROPS.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="text-success">·</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {HIGHLIGHTS.map(({ icon: Icon, label, desc }) => (
              <div
                key={label}
                className="glass-card flex flex-col gap-1.5 rounded-xl p-3 sm:p-4"
              >
                <Icon className="h-5 w-5 text-primary" />
                <p className="text-sm font-semibold">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <main className="relative mx-auto max-w-6xl px-4 py-8 sm:py-10">
        {/* Company code */}
        <section className="glass-card mb-8 rounded-2xl p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="portal-company" className="flex items-center gap-2 text-base">
                <Building2 className="h-4 w-4 text-primary" />
                Kod firmy transportowej
              </Label>
              <Input
                id="portal-company"
                value={companyCode}
                onChange={(e) => onCompanyCodeChange(e.target.value.toUpperCase())}
                placeholder="np. DEMO-TRANS"
                autoComplete="organization"
                className="h-11 border-primary/20 bg-background/60 text-base backdrop-blur-sm"
              />
              <p className="text-xs text-muted-foreground">
                Każda firma ma osobny tenant — dane kierowców, floty i kursów są izolowane.
              </p>
            </div>
            {tenant && (
              <div className="flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 px-4 py-3">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
                <div>
                  <p className="text-xs text-muted-foreground">Połączono z</p>
                  <p className="font-semibold text-success">{tenant.name}</p>
                </div>
              </div>
            )}
          </div>
          {companyError && <p className="mt-3 text-sm text-danger">{companyError}</p>}
        </section>

        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold sm:text-2xl">Wybierz panel</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Osobny interfejs dla właściciela, dyspozytora, kierowcy i mechanika
            </p>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {PORTAL_PANELS.map((panel) => (
            <PortalPanelTile
              key={panel.role}
              panel={panel}
              disabled={!tenant}
              isActiveSession={session?.user.role === panel.role}
              onClick={() =>
                session?.user.role === panel.role
                  ? onContinueSession(panel.role)
                  : onSelectPanel(panel.role)
              }
            />
          ))}
        </div>

        {session && (
          <div className="mt-8 flex justify-center">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onContinueSession(session.user.role)}
              className="gap-2"
            >
              <Truck className="h-4 w-4" />
              Szybki powrót jako {session.user.displayName}
            </Button>
          </div>
        )}
      </main>

      <footer className="relative border-t border-border/60 px-4 py-5 text-center">
        <p className="text-xs text-muted-foreground">
          TransFlow v0.8 · demo: <strong className="text-foreground/80">DEMO-TRANS</strong> · hasło:{' '}
          <strong className="text-foreground/80">demo2026</strong>
        </p>
        <p className="mt-1 text-[10px] text-muted-foreground/70">
          Zdjęcia: Unsplash · transport drogowy, logistyka, warsztat
        </p>
      </footer>
    </div>
  )
}
