import { Button } from '@/app/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/Card'
import { Input } from '@/app/components/ui/Input'
import {
  APP_FEATURE_AREA_LABELS,
  APP_FEATURE_STATUS_LABELS,
  APP_FEATURES,
  APP_FEATURES_CATALOG_VERSION,
  liveFeatureCount,
  type AppFeature,
  type AppFeatureArea,
  type AppFeatureStatus,
} from '@/lib/catalog/app-features'
import type { AdminView } from '@/lib/navigation'
import type { TenantModules } from '@/lib/tenant/types'
import { cn } from '@/lib/utils'
import { ExternalLink, Layers, Search } from 'lucide-react'
import { useMemo, useState } from 'react'

interface FeaturesViewProps {
  modules: TenantModules
  onNavigate?: (view: AdminView) => void
}

const AREA_ORDER: AppFeatureArea[] = ['admin', 'driver', 'mechanic', 'platform', 'integration']

export function FeaturesView({ modules, onNavigate }: FeaturesViewProps) {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<AppFeatureStatus | 'all'>('all')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return APP_FEATURES.filter((f) => {
      if (statusFilter !== 'all' && f.status !== statusFilter) return false
      if (f.module && !modules[f.module]) return false
      if (!q) return true
      return (
        f.title.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q) ||
        f.id.toLowerCase().includes(q)
      )
    })
  }, [query, statusFilter, modules])

  const grouped = useMemo(() => {
    const out: Partial<Record<AppFeatureArea, AppFeature[]>> = {}
    for (const area of AREA_ORDER) {
      const items = filtered.filter((f) => f.area === area)
      if (items.length > 0) out[area] = items
    }
    return out
  }, [filtered])

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Funkcje systemu</h2>
          <p className="text-sm text-muted-foreground">
            Pełny katalog możliwości aplikacji zarządzania firmą transportową — {liveFeatureCount()} aktywnych
            modułów · katalog v{APP_FEATURES_CATALOG_VERSION}
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Szukaj funkcji…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {(['all', 'live', 'beta', 'planned'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-medium',
                  statusFilter === s
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground',
                )}
              >
                {s === 'all' ? 'Wszystkie' : APP_FEATURE_STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">Brak funkcji pasujących do filtrów.</p>
      ) : (
        AREA_ORDER.map((area) => {
          const items = grouped[area]
          if (!items?.length) return null
          return (
            <section key={area} className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                <Layers className="h-4 w-4" />
                {APP_FEATURE_AREA_LABELS[area]}
                <span className="font-normal normal-case">({items.length})</span>
              </h3>
              <div className="grid gap-3 md:grid-cols-2">
                {items.map((f) => (
                  <FeatureCard key={f.id} feature={f} onNavigate={onNavigate} moduleEnabled={!f.module || modules[f.module]} />
                ))}
              </div>
            </section>
          )
        })
      )}

      <p className="text-xs text-muted-foreground">
        Źródło prawdy dla agentów AI i developerów:{' '}
        <code className="rounded bg-muted px-1">src/lib/catalog/app-features.ts</code> · dokumentacja:{' '}
        <code className="rounded bg-muted px-1">docs/SYSTEM-OVERVIEW.md</code>
      </p>
    </div>
  )
}

function FeatureCard({
  feature,
  onNavigate,
  moduleEnabled,
}: {
  feature: AppFeature
  onNavigate?: (view: AdminView) => void
  moduleEnabled: boolean
}) {
  const canOpen = Boolean(feature.adminView && onNavigate && moduleEnabled)

  return (
    <Card className={cn(!moduleEnabled && 'opacity-60')}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-snug">{feature.title}</CardTitle>
          <StatusBadge status={feature.status} />
        </div>
        {feature.sinceVersion && (
          <CardDescription className="text-xs">od v{feature.sinceVersion}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{feature.description}</p>
        <div className="flex flex-wrap gap-1.5">
          {feature.roles.map((r) => (
            <span key={r} className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase">
              {r === 'owner' ? 'Właściciel' : r === 'dispatcher' ? 'Dyspozytor' : r === 'driver' ? 'Kierowca' : 'Mechanik'}
            </span>
          ))}
          {feature.module && !moduleEnabled && (
            <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-medium text-warning">
              Moduł wyłączony w planie
            </span>
          )}
        </div>
        {canOpen && (
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => onNavigate!(feature.adminView!)}>
            <ExternalLink className="h-3.5 w-3.5" />
            Otwórz moduł
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

function StatusBadge({ status }: { status: AppFeatureStatus }) {
  return (
    <span
      className={cn(
        'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase',
        status === 'live' && 'bg-success/15 text-success',
        status === 'beta' && 'bg-primary/15 text-primary',
        status === 'planned' && 'bg-muted text-muted-foreground',
      )}
    >
      {APP_FEATURE_STATUS_LABELS[status]}
    </span>
  )
}
