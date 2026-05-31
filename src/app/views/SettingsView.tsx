import { Button } from '@/app/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/Card'
import { Input, Label, Select } from '@/app/components/ui/Input'
import {
  COMPANY_DOC_LABELS,
  loadTenantSettingsData,
  saveTenantSettingsData,
  seedDemoCompanyDocuments,
  type CompanyDocument,
  type CompanyDocumentType,
} from '@/lib/domain/tenant-settings'
import { EXPIRY_STATUS_COLORS, expiryStatus, formatExpiryDate } from '@/lib/domain/compliance'
import { COMPANY_BRANDING, isCompanyDeployment } from '@/config/branding'
import type { Tenant } from '@/lib/tenant/types'
import type { SubscriptionPlan } from '@/lib/tenant/types'
import {
  modulesForPlan,
  PLAN_DESCRIPTIONS,
  PLAN_LABELS,
} from '@/lib/tenant/plan-presets'
import { IntegrationsHubCard } from '@/app/components/integrations/IntegrationsHubCard'
import type { AdminView } from '@/lib/navigation'
import { cn } from '@/lib/utils'
import { Plus, Settings, Trash2, Smartphone, ToggleLeft } from 'lucide-react'
import {
  applyPwaBrandingToDocument,
  DEFAULT_PWA_BRANDING,
  loadPwaBranding,
  savePwaBranding,
} from '@/lib/pwa/pwa-branding'
import { useTenant } from '@/lib/tenant/context'
import { useCloudSyncRefreshKeys } from '@/lib/sync/useCloudSyncRefresh'
import { MODULE_DESCRIPTIONS, MODULE_LABELS } from '@/lib/tenant/module-labels'
import { DEFAULT_MODULES, type TenantModules } from '@/lib/tenant/types'
import { useCallback, useEffect, useState } from 'react'

interface SettingsViewProps {
  tenant: Tenant
  onNavigate?: (view: AdminView) => void
}

export function SettingsView({ tenant, onNavigate }: SettingsViewProps) {
  const { registerTenant, setCurrentTenant } = useTenant()
  const { settings } = tenant
  const [documents, setDocuments] = useState<CompanyDocument[]>([])
  const [mechanics, setMechanics] = useState(loadTenantSettingsData(tenant.id).mechanics)
  const [verifierIds, setVerifierIds] = useState(
    loadTenantSettingsData(tenant.id).repairWorkflow.verifierUserIds.join(', '),
  )
  const [pwaAppName, setPwaAppName] = useState(DEFAULT_PWA_BRANDING.appName)
  const [pwaShortName, setPwaShortName] = useState(DEFAULT_PWA_BRANDING.shortName)

  const refresh = useCallback(() => {
    seedDemoCompanyDocuments(tenant.id)
    const data = loadTenantSettingsData(tenant.id)
    setDocuments(data.companyDocuments)
    setMechanics(data.mechanics)
    setVerifierIds(data.repairWorkflow.verifierUserIds.join(', '))
    const pwa = loadPwaBranding(tenant.id)
    setPwaAppName(pwa.appName)
    setPwaShortName(pwa.shortName)
  }, [tenant.id])

  useEffect(() => {
    refresh()
  }, [refresh])

  useCloudSyncRefreshKeys(tenant.id, ['settings', 'freight-connectors', 'tachograph-connectors', 'fleet-telematics-connectors', 'invoicing-config', 'ocr-config'], refresh)

  function persist(next: CompanyDocument[]) {
    setDocuments(next)
    const data = loadTenantSettingsData(tenant.id)
    saveTenantSettingsData(tenant.id, { ...data, companyDocuments: next })
  }

  function persistMechanics(next: typeof mechanics) {
    setMechanics(next)
    const data = loadTenantSettingsData(tenant.id)
    saveTenantSettingsData(tenant.id, { ...data, mechanics: next })
  }

  function updateMechanic(index: number, patch: Partial<(typeof mechanics)[0]>) {
    const next = [...mechanics]
    next[index] = { ...next[index], ...patch, updatedAt: new Date().toISOString() }
    persistMechanics(next)
  }

  function saveVerifiers() {
    const ids = verifierIds
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    const data = loadTenantSettingsData(tenant.id)
    saveTenantSettingsData(tenant.id, {
      ...data,
      repairWorkflow: { ...data.repairWorkflow, verifierUserIds: ids },
    })
  }

  function savePwaBrandingSettings() {
    const next = savePwaBranding(tenant.id, {
      appName: pwaAppName.trim(),
      shortName: pwaShortName.trim(),
    })
    setPwaAppName(next.appName)
    setPwaShortName(next.shortName)
    void applyPwaBrandingToDocument(next)
  }

  function addDocument() {
    persist([
      ...documents,
      {
        type: 'licencja_krajowa',
        label: COMPANY_DOC_LABELS.licencja_krajowa,
        expiresAt: new Date(Date.now() + 86400000 * 365).toISOString().slice(0, 10),
      },
    ])
  }

  function updateDocument(index: number, patch: Partial<CompanyDocument>) {
    const next = documents.map((d, i) => (i === index ? { ...d, ...patch } : d))
    persist(next)
  }

  function removeDocument(index: number) {
    persist(documents.filter((_, i) => i !== index))
  }

  function applyPlan(plan: SubscriptionPlan) {
    const updated: Tenant = {
      ...tenant,
      plan,
      settings: {
        ...tenant.settings,
        modules: modulesForPlan(plan),
      },
    }
    registerTenant(updated)
    setCurrentTenant(updated)
  }

  function toggleModule(key: keyof TenantModules, enabled: boolean) {
    const merged: TenantModules = { ...DEFAULT_MODULES, ...settings.modules, [key]: enabled }
    const updated: Tenant = {
      ...tenant,
      settings: { ...tenant.settings, modules: merged },
      updatedAt: new Date().toISOString(),
    }
    registerTenant(updated)
    setCurrentTenant(updated)
  }

  const scopeLabel =
    settings.transportScope === 'both'
      ? 'Kraj + międzynarodowy'
      : settings.transportScope === 'international'
        ? 'Międzynarodowy'
        : 'Krajowy'

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Ustawienia firmy</h1>
        <p className="text-sm text-muted-foreground">
          Licencje, CKZ i dokumenty wymagane przy kontroli ITD / za granicą
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            {tenant.name}
          </CardTitle>
          <CardDescription>
            {isCompanyDeployment() ? COMPANY_BRANDING.region : `Kod firmy: ${tenant.slug}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid gap-2 sm:grid-cols-2">
            {!isCompanyDeployment() && (
              <>
                <InfoRow label="Plan" value={tenant.plan} />
                <InfoRow label="Status" value={tenant.status} />
              </>
            )}
            <InfoRow label="Zakres transportu" value={scopeLabel} />
            <InfoRow label="Waluta" value={settings.currency} />
            <InfoRow label="Strefa czasowa" value={settings.timezone} />
            {!isCompanyDeployment() && <InfoRow label="Tenant ID" value={tenant.id} />}
          </div>

          {!isCompanyDeployment() && (
            <div className="space-y-3 border-t border-border pt-3">
              <p className="font-medium text-foreground">Plan abonamentowy</p>
              <p className="text-xs text-muted-foreground">{PLAN_DESCRIPTIONS[tenant.plan]}</p>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(PLAN_LABELS) as SubscriptionPlan[]).map((plan) => (
                  <Button
                    key={plan}
                    size="sm"
                    variant={tenant.plan === plan ? 'default' : 'secondary'}
                    onClick={() => applyPlan(plan)}
                  >
                    {PLAN_LABELS[plan]}
                  </Button>
                ))}
              </div>
              <div className="pt-1">
                <p className="mb-2 text-xs font-medium text-muted-foreground">Moduły w planie</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(settings.modules).map(([key, enabled]) => (
                    <span
                      key={key}
                      className={cn(
                        'rounded-full px-2.5 py-0.5 text-xs font-medium',
                        enabled ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {key}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {isCompanyDeployment() && (
            <div className="pt-2">
              <p className="mb-2 font-medium text-foreground">Aktywne moduły</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(settings.modules).map(([key, enabled]) => (
                  <span
                    key={key}
                    className={cn(
                      'rounded-full px-2.5 py-0.5 text-xs font-medium',
                      enabled ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {key}
                  </span>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ToggleLeft className="h-4 w-4 text-primary" />
            Moduły i integracje
          </CardTitle>
          <CardDescription>
            Włącz lub wyłącz funkcje niezależnie od planu — np. fakturowanie tylko gdy masz konto u dostawcy
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {(Object.keys(MODULE_LABELS) as (keyof TenantModules)[]).map((key) => {
            const enabled = { ...DEFAULT_MODULES, ...settings.modules }[key]
            return (
              <div
                key={key}
                className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-border p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{MODULE_LABELS[key]}</p>
                  {MODULE_DESCRIPTIONS[key] && (
                    <p className="text-xs text-muted-foreground">{MODULE_DESCRIPTIONS[key]}</p>
                  )}
                </div>
                <label className="flex shrink-0 items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => toggleModule(key, e.target.checked)}
                  />
                  {enabled ? 'Włączony' : 'Wyłączony'}
                </label>
              </div>
            )
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base">Dokumenty firmy</CardTitle>
            <CardDescription>
              Licencja wspólnotowa, CKZ, zezwolenie przewoźnika — alerty w module Zgodność
            </CardDescription>
          </div>
          <Button size="sm" className="gap-1" onClick={addDocument}>
            <Plus className="h-4 w-4" />
            Dodaj
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">Brak dokumentów — dodaj licencję i CKZ.</p>
          ) : (
            documents.map((doc, index) => {
              const status = expiryStatus(doc.expiresAt)
              return (
                <div
                  key={`${doc.type}-${index}`}
                  className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-[1fr_1fr_auto_auto]"
                >
                  <div className="space-y-1">
                    <Label>Typ</Label>
                    <Select
                      value={doc.type}
                      onChange={(e) => {
                        const type = e.target.value as CompanyDocumentType
                        updateDocument(index, {
                          type,
                          label: COMPANY_DOC_LABELS[type],
                        })
                      }}
                    >
                      {Object.entries(COMPANY_DOC_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Opis</Label>
                    <Input
                      value={doc.label}
                      onChange={(e) => updateDocument(index, { label: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Ważny do</Label>
                    <Input
                      type="date"
                      value={doc.expiresAt.slice(0, 10)}
                      onChange={(e) => updateDocument(index, { expiresAt: e.target.value })}
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <span
                      className={cn(
                        'rounded-full px-2 py-1 text-xs font-medium',
                        EXPIRY_STATUS_COLORS[status],
                      )}
                    >
                      {formatExpiryDate(doc.expiresAt)}
                    </span>
                    <Button variant="ghost" size="icon" onClick={() => removeDocument(index)}>
                      <Trash2 className="h-4 w-4 text-danger" />
                    </Button>
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      <IntegrationsHubCard
        tenantId={tenant.id}
        onOpen={onNavigate ? () => onNavigate('integrations') : undefined}
      />

      {isCompanyDeployment() && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Smartphone className="h-5 w-5 text-primary" />
              Aplikacja na telefon (PWA)
            </CardTitle>
            <CardDescription>
              Nazwa pod ikoną na pulpicie — Chrome, Firefox, Opera, Safari (Android i iOS). Domyślnie:{' '}
              {DEFAULT_PWA_BRANDING.appName}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="pwa-app-name">Pełna nazwa (instalacja)</Label>
                <Input
                  id="pwa-app-name"
                  value={pwaAppName}
                  onChange={(e) => setPwaAppName(e.target.value)}
                  placeholder={DEFAULT_PWA_BRANDING.appName}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pwa-short-name">Skrót pod ikoną</Label>
                <Input
                  id="pwa-short-name"
                  value={pwaShortName}
                  onChange={(e) => setPwaShortName(e.target.value)}
                  placeholder={DEFAULT_PWA_BRANDING.shortName}
                  maxLength={12}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Kierowcy mogą dodać skrót z baneru na portalu lub w panelu. Zmiana wymaga ponownej instalacji
              na telefonach, które już mają starą nazwę.
            </p>
            <Button size="sm" onClick={savePwaBrandingSettings}>
              Zapisz branding PWA
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base">Mechanicy i weryfikacja awarii</CardTitle>
            <CardDescription>
              Właściciel zawsze może weryfikować. Wyznaczeni weryfikatorzy — ID użytkowników (np. user-dispatcher-demo).
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label>Weryfikatorzy (ID, po przecinku)</Label>
            <Input value={verifierIds} onChange={(e) => setVerifierIds(e.target.value)} />
            <Button size="sm" variant="secondary" onClick={saveVerifiers}>
              Zapisz weryfikatorów
            </Button>
          </div>
          {mechanics.map((m, index) => (
            <div key={m.id} className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-2">
              <Input
                value={m.name}
                onChange={(e) => updateMechanic(index, { name: e.target.value })}
                placeholder="Imię i nazwisko"
              />
              <Input
                value={m.phone}
                onChange={(e) => updateMechanic(index, { phone: e.target.value })}
                placeholder="Telefon"
              />
              <Input
                className="sm:col-span-2"
                value={m.workshop ?? ''}
                onChange={(e) => updateMechanic(index, { workshop: e.target.value })}
                placeholder="Warsztat / adres"
              />
            </div>
          ))}
          <Button
            size="sm"
            variant="secondary"
            onClick={() =>
              persistMechanics([
                ...mechanics,
                {
                  id: crypto.randomUUID(),
                  name: '',
                  phone: '',
                  active: true,
                  updatedAt: new Date().toISOString(),
                },
              ])
            }
          >
            Dodaj mechanika
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-muted/50 px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  )
}
