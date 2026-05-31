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
import { useTenant } from '@/lib/tenant/context'
import { cn } from '@/lib/utils'
import { Plus, Settings, Trash2, Gauge, Satellite, Smartphone, ToggleLeft } from 'lucide-react'
import {
  applyPwaBrandingToDocument,
  DEFAULT_PWA_BRANDING,
  loadPwaBranding,
  savePwaBranding,
} from '@/lib/pwa/pwa-branding'
import {
  loadFleetTelematicsConfig,
  saveFleetTelematicsConfig,
  type FleetTelematicsConnectorConfig,
} from '@/lib/domain/fleet-telematics-connectors'
import {
  loadTachographConnectorConfig,
  saveTachographConnectorConfig,
  type TachographConnectorConfig,
} from '@/lib/domain/tachograph-connectors'
import { useCloudSyncRefreshKeys } from '@/lib/sync/useCloudSyncRefresh'
import { MODULE_DESCRIPTIONS, MODULE_LABELS } from '@/lib/tenant/module-labels'
import { DEFAULT_MODULES, type TenantModules } from '@/lib/tenant/types'
import { useCallback, useEffect, useState } from 'react'

interface SettingsViewProps {
  tenant: Tenant
}

export function SettingsView({ tenant }: SettingsViewProps) {
  const { registerTenant, setCurrentTenant } = useTenant()
  const { settings } = tenant
  const [documents, setDocuments] = useState<CompanyDocument[]>([])
  const [mechanics, setMechanics] = useState(loadTenantSettingsData(tenant.id).mechanics)
  const [verifierIds, setVerifierIds] = useState(
    loadTenantSettingsData(tenant.id).repairWorkflow.verifierUserIds.join(', '),
  )
  const [tachoCfg, setTachoCfg] = useState<TachographConnectorConfig>(() =>
    loadTachographConnectorConfig(tenant.id),
  )
  const [fleetGpsCfg, setFleetGpsCfg] = useState<FleetTelematicsConnectorConfig>(() =>
    loadFleetTelematicsConfig(tenant.id),
  )
  const [pwaAppName, setPwaAppName] = useState(DEFAULT_PWA_BRANDING.appName)
  const [pwaShortName, setPwaShortName] = useState(DEFAULT_PWA_BRANDING.shortName)

  const refresh = useCallback(() => {
    seedDemoCompanyDocuments(tenant.id)
    const data = loadTenantSettingsData(tenant.id)
    setDocuments(data.companyDocuments)
    setMechanics(data.mechanics)
    setVerifierIds(data.repairWorkflow.verifierUserIds.join(', '))
    setTachoCfg(loadTachographConnectorConfig(tenant.id))
    setFleetGpsCfg(loadFleetTelematicsConfig(tenant.id))
    const pwa = loadPwaBranding(tenant.id)
    setPwaAppName(pwa.appName)
    setPwaShortName(pwa.shortName)
  }, [tenant.id])

  useEffect(() => {
    refresh()
  }, [refresh])

  useCloudSyncRefreshKeys(tenant.id, ['tachograph-connectors', 'fleet-telematics-connectors'], refresh)

  function saveTachoConnector(patch: Partial<TachographConnectorConfig>) {
    const next = { ...tachoCfg, ...patch }
    saveTachographConnectorConfig(tenant.id, next)
    setTachoCfg(next)
  }

  function saveFleetGpsConnector(patch: Partial<FleetTelematicsConnectorConfig>) {
    const next = { ...fleetGpsCfg, ...patch }
    saveFleetTelematicsConfig(tenant.id, next)
    setFleetGpsCfg(next)
  }

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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Gauge className="h-4 w-4 text-primary" />
            Integracja tachografu (API)
          </CardTitle>
          <CardDescription>
            TachoScan, VDO Online i telematyka FMS — klucze produkcyjne w Supabase Secrets Edge Function
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <label className="flex flex-wrap items-center gap-2">
            <input
              type="checkbox"
              checked={tachoCfg.tachoScanEnabled}
              onChange={(e) => saveTachoConnector({ tachoScanEnabled: e.target.checked })}
            />
            TachoScan API
            {tachoCfg.lastSyncByProvider.tacho_scan && (
              <span className="text-xs text-muted-foreground">
                · sync {new Date(tachoCfg.lastSyncByProvider.tacho_scan).toLocaleString('pl-PL')}
              </span>
            )}
          </label>
          <div className="space-y-1.5 pl-6">
            <Label htmlFor="tacho-scan-key">Klucz API (demo — zapis lokalny)</Label>
            <Input
              id="tacho-scan-key"
              type="password"
              autoComplete="off"
              placeholder="TachoScan API key"
              value={tachoCfg.tachoScanApiKey ?? ''}
              onChange={(e) => saveTachoConnector({ tachoScanApiKey: e.target.value || undefined })}
            />
          </div>

          <label className="flex flex-wrap items-center gap-2">
            <input
              type="checkbox"
              checked={tachoCfg.vdoOnlineEnabled}
              onChange={(e) => saveTachoConnector({ vdoOnlineEnabled: e.target.checked })}
            />
            VDO Fleet / Online
            {tachoCfg.lastSyncByProvider.vdo_online && (
              <span className="text-xs text-muted-foreground">
                · sync {new Date(tachoCfg.lastSyncByProvider.vdo_online).toLocaleString('pl-PL')}
              </span>
            )}
          </label>
          <div className="space-y-1.5 pl-6">
            <Label htmlFor="vdo-fleet-id">ID floty VDO</Label>
            <Input
              id="vdo-fleet-id"
              placeholder="Fleet ID"
              value={tachoCfg.vdoFleetId ?? ''}
              onChange={(e) => saveTachoConnector({ vdoFleetId: e.target.value || undefined })}
            />
          </div>

          <label className="flex flex-wrap items-center gap-2">
            <input
              type="checkbox"
              checked={tachoCfg.telematicsFmsEnabled}
              onChange={(e) => saveTachoConnector({ telematicsFmsEnabled: e.target.checked })}
            />
            Telematyka / FMS (Webfleet, CAN)
            {tachoCfg.lastSyncByProvider.telematics_fms && (
              <span className="text-xs text-muted-foreground">
                · sync {new Date(tachoCfg.lastSyncByProvider.telematics_fms).toLocaleString('pl-PL')}
              </span>
            )}
          </label>
          <div className="space-y-1.5 pl-6">
            <Label htmlFor="telematics-endpoint">Endpoint webhook / REST</Label>
            <Input
              id="telematics-endpoint"
              placeholder="https://partner.example/fms/tachograph"
              value={tachoCfg.telematicsEndpoint ?? ''}
              onChange={(e) =>
                saveTachoConnector({ telematicsEndpoint: e.target.value || undefined })
              }
            />
          </div>

          {tachoCfg.lastSyncAt && (
            <p className="text-xs text-muted-foreground">
              Ostatnia synchronizacja: {new Date(tachoCfg.lastSyncAt).toLocaleString('pl-PL')}
            </p>
          )}
          {tachoCfg.lastSyncError && (
            <p className="text-xs text-danger">Błąd sync: {tachoCfg.lastSyncError}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Satellite className="h-4 w-4 text-primary" />
            Telematyka GPS (Webfleet / Transics)
          </CardTitle>
          <CardDescription>
            Urządzenie w ciężarówce → API dostawcy → Edge webhook/cron → pozycje na mapie Floty
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <label className="flex flex-wrap items-center gap-2">
            <input
              type="checkbox"
              checked={fleetGpsCfg.webfleetEnabled}
              onChange={(e) => saveFleetGpsConnector({ webfleetEnabled: e.target.checked })}
            />
            Webfleet
            {fleetGpsCfg.lastSyncByProvider.webfleet && (
              <span className="text-xs text-muted-foreground">
                · sync {new Date(fleetGpsCfg.lastSyncByProvider.webfleet).toLocaleString('pl-PL')}
              </span>
            )}
          </label>
          <div className="grid gap-2 pl-6 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="webfleet-account">Konto Webfleet</Label>
              <Input
                id="webfleet-account"
                placeholder="account name"
                value={fleetGpsCfg.webfleetAccount ?? ''}
                onChange={(e) => saveFleetGpsConnector({ webfleetAccount: e.target.value || undefined })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="webfleet-key">Klucz API (demo lokalnie)</Label>
              <Input
                id="webfleet-key"
                type="password"
                autoComplete="off"
                value={fleetGpsCfg.webfleetApiKey ?? ''}
                onChange={(e) => saveFleetGpsConnector({ webfleetApiKey: e.target.value || undefined })}
              />
            </div>
          </div>

          <label className="flex flex-wrap items-center gap-2">
            <input
              type="checkbox"
              checked={fleetGpsCfg.transicsEnabled}
              onChange={(e) => saveFleetGpsConnector({ transicsEnabled: e.target.checked })}
            />
            Transics
            {fleetGpsCfg.lastSyncByProvider.transics && (
              <span className="text-xs text-muted-foreground">
                · sync {new Date(fleetGpsCfg.lastSyncByProvider.transics).toLocaleString('pl-PL')}
              </span>
            )}
          </label>
          <div className="space-y-1.5 pl-6">
            <Label htmlFor="transics-fleet">ID floty Transics</Label>
            <Input
              id="transics-fleet"
              value={fleetGpsCfg.transicsFleetId ?? ''}
              onChange={(e) => saveFleetGpsConnector({ transicsFleetId: e.target.value || undefined })}
            />
          </div>

          <label className="flex flex-wrap items-center gap-2">
            <input
              type="checkbox"
              checked={fleetGpsCfg.genericEnabled}
              onChange={(e) => saveFleetGpsConnector({ genericEnabled: e.target.checked })}
            />
            Inny dostawca (FleetGO, Geotab…)
          </label>
          <div className="space-y-1.5 pl-6">
            <Label htmlFor="generic-webhook">URL webhook (push pozycji)</Label>
            <Input
              id="generic-webhook"
              placeholder="https://…/fleet-telematics-webhook"
              value={fleetGpsCfg.genericWebhookUrl ?? ''}
              onChange={(e) => saveFleetGpsConnector({ genericWebhookUrl: e.target.value || undefined })}
            />
          </div>

          {fleetGpsCfg.lastSyncAt && (
            <p className="text-xs text-muted-foreground">
              Ostatnia synchronizacja GPS: {new Date(fleetGpsCfg.lastSyncAt).toLocaleString('pl-PL')}
            </p>
          )}
          {fleetGpsCfg.lastSyncError && (
            <p className="text-xs text-danger">Błąd sync GPS: {fleetGpsCfg.lastSyncError}</p>
          )}
        </CardContent>
      </Card>

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
