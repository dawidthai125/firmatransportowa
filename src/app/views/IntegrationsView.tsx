import { Button } from '@/app/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/Card'
import { Input, Label } from '@/app/components/ui/Input'
import {
  applyIntegrationActivation,
  loadIntegrationHub,
  saveIntegrationHub,
  testAllIntegrations,
  type IntegrationHubSnapshot,
} from '@/lib/domain/integration-hub'
import type { IntegrationTestResult } from '@/lib/domain/integration-api'
import { useTenant } from '@/lib/tenant/context'
import type { Tenant } from '@/lib/tenant/types'
import { cn } from '@/lib/utils'
import { useCloudSyncRefreshKeys } from '@/lib/sync/useCloudSyncRefresh'
import { CheckCircle2, KeyRound, Loader2, Plug, Save, XCircle } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

interface IntegrationsViewProps {
  tenant: Tenant
}

export function IntegrationsView({ tenant }: IntegrationsViewProps) {
  const { registerTenant, setCurrentTenant } = useTenant()
  const [hub, setHub] = useState<IntegrationHubSnapshot>(() => loadIntegrationHub(tenant.id))
  const [tests, setTests] = useState<IntegrationTestResult[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const refresh = useCallback(() => {
    setHub(loadIntegrationHub(tenant.id))
  }, [tenant.id])

  useEffect(() => {
    refresh()
  }, [refresh])

  useCloudSyncRefreshKeys(
    tenant.id,
    [
      'freight-connectors',
      'invoicing-config',
      'tachograph-connectors',
      'fleet-telematics-connectors',
      'ocr-config',
      'settings',
    ],
    refresh,
  )

  function patch<K extends keyof IntegrationHubSnapshot>(
    section: K,
    field: keyof IntegrationHubSnapshot[K],
    value: string | boolean | undefined,
  ) {
    setHub((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: typeof value === 'boolean' ? value : value || undefined,
      },
    }))
  }

  async function handleSaveAndActivate() {
    setBusy(true)
    setMsg(null)
    try {
      saveIntegrationHub(tenant.id, {
        freight: hub.freight,
        invoicing: hub.invoicing,
        tachograph: hub.tachograph,
        fleetGps: hub.fleetGps,
        ocr: hub.ocr,
      })
      const next = applyIntegrationActivation(tenant)
      registerTenant(next)
      setCurrentTenant(next)
      setMsg('Zapisano — moduły i connectory włączone automatycznie.')
    } finally {
      setBusy(false)
    }
  }

  async function handleTestAll() {
    setBusy(true)
    setMsg(null)
    setTests(null)
    try {
      saveIntegrationHub(tenant.id, {
        freight: hub.freight,
        invoicing: hub.invoicing,
        tachograph: hub.tachograph,
        fleetGps: hub.fleetGps,
        ocr: hub.ocr,
      })
      const results = await testAllIntegrations(tenant.id)
      setTests(results)
      const configured = results.filter((r) => r.mode !== 'skipped')
      const okCount = configured.filter((r) => r.ok).length
      setMsg(
        configured.length === 0
          ? 'Wpisz klucze w sekcjach poniżej, potem testuj ponownie.'
          : `Test: ${okCount}/${configured.length} połączeń OK`,
      )
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Test nieudany')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold">
            <KeyRound className="h-5 w-5 text-primary" />
            Klucze API i integracje
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Wpisz klucze wygenerowane u dostawców — po zapisie moduły włączą się automatycznie.
            Edge Function testuje połączenia i synchronizuje dane (giełda, faktury, tachograf, GPS, OCR).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" disabled={busy} onClick={() => void handleTestAll()} className="gap-2">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plug className="h-4 w-4" />}
            Test połączeń
          </Button>
          <Button disabled={busy} onClick={() => void handleSaveAndActivate()} className="gap-2">
            <Save className="h-4 w-4" />
            Zapisz i aktywuj
          </Button>
        </div>
      </div>

      {msg && (
        <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">{msg}</p>
      )}

      {tests && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Wyniki testu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {tests.map((t) => (
              <div
                key={t.id}
                className={cn(
                  'flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm',
                  t.mode === 'skipped' && 'opacity-60',
                  t.ok ? 'border-success/30 bg-success/5' : t.mode !== 'skipped' ? 'border-warning/30 bg-warning/5' : '',
                )}
              >
                <span className="flex items-center gap-2 font-medium">
                  {t.mode === 'skipped' ? (
                    <span className="h-4 w-4 rounded-full bg-muted" />
                  ) : t.ok ? (
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  ) : (
                    <XCircle className="h-4 w-4 text-warning" />
                  )}
                  {t.label}
                  {t.mode === 'production' && (
                    <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary">prod</span>
                  )}
                  {t.mode === 'demo' && t.ok && (
                    <span className="rounded bg-muted px-1.5 py-0.5 text-xs">demo</span>
                  )}
                </span>
                <span className="text-xs text-muted-foreground">{t.message}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Section title="Giełda frachtu — Trans.eu / TimoCom" desc="Oferty produkcyjne z API giełd">
        <Field label="Trans.eu Client ID" value={hub.freight.transEuClientId ?? ''} onChange={(v) => patch('freight', 'transEuClientId', v)} />
        <Field label="Trans.eu API Key" value={hub.freight.transEuApiKey ?? ''} onChange={(v) => patch('freight', 'transEuApiKey', v)} secret />
        <Field label="TimoCom API Key" value={hub.freight.timocomApiKey ?? ''} onChange={(v) => patch('freight', 'timocomApiKey', v)} secret />
        <Field label="TimoCom Company ID" value={hub.freight.timocomCompanyId ?? ''} onChange={(v) => patch('freight', 'timocomCompanyId', v)} />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={hub.freight.transEuSandbox !== false}
            onChange={(e) => patch('freight', 'transEuSandbox', e.target.checked)}
          />
          Trans.eu sandbox
        </label>
      </Section>

      <Section title="Fakturowanie — Fakturownia / wFirma" desc="REST API faktur VAT">
        <Field label="Fakturownia subdomena" value={hub.invoicing.fakturowniaSubdomain ?? ''} onChange={(v) => patch('invoicing', 'fakturowniaSubdomain', v)} placeholder="twojafirma" />
        <Field label="Fakturownia API token" value={hub.invoicing.fakturowniaApiToken ?? ''} onChange={(v) => patch('invoicing', 'fakturowniaApiToken', v)} secret />
        <Field label="wFirma Company ID" value={hub.invoicing.wfirmaCompanyId ?? ''} onChange={(v) => patch('invoicing', 'wfirmaCompanyId', v)} />
        <Field label="wFirma API token" value={hub.invoicing.wfirmaApiToken ?? ''} onChange={(v) => patch('invoicing', 'wfirmaApiToken', v)} secret />
      </Section>

      <Section title="Tachograf — TachoScan / VDO / FMS" desc="Odczyty DDD i czas jazdy">
        <Field label="TachoScan API Key" value={hub.tachograph.tachoScanApiKey ?? ''} onChange={(v) => patch('tachograph', 'tachoScanApiKey', v)} secret />
        <Field label="VDO Fleet ID" value={hub.tachograph.vdoFleetId ?? ''} onChange={(v) => patch('tachograph', 'vdoFleetId', v)} />
        <Field label="Endpoint FMS / REST" value={hub.tachograph.telematicsEndpoint ?? ''} onChange={(v) => patch('tachograph', 'telematicsEndpoint', v)} placeholder="https://…" />
      </Section>

      <Section title="GPS / telematyka — Webfleet / Transics" desc="Pozycje pojazdów na mapie floty">
        <Field label="Webfleet konto" value={hub.fleetGps.webfleetAccount ?? ''} onChange={(v) => patch('fleetGps', 'webfleetAccount', v)} />
        <Field label="Webfleet API Key" value={hub.fleetGps.webfleetApiKey ?? ''} onChange={(v) => patch('fleetGps', 'webfleetApiKey', v)} secret />
        <Field label="Transics Fleet ID" value={hub.fleetGps.transicsFleetId ?? ''} onChange={(v) => patch('fleetGps', 'transicsFleetId', v)} />
        <Field label="Webhook URL (push pozycji)" value={hub.fleetGps.genericWebhookUrl ?? ''} onChange={(v) => patch('fleetGps', 'genericWebhookUrl', v)} />
      </Section>

      <Section title="OCR rate con — OpenAI / Google Vision" desc="Skan zlecenia PDF → oferta na giełdzie">
        <Field label="OpenAI API Key" value={hub.ocr.openaiApiKey ?? ''} onChange={(v) => patch('ocr', 'openaiApiKey', v)} secret />
        <Field label="Google Vision API Key" value={hub.ocr.googleVisionApiKey ?? ''} onChange={(v) => patch('ocr', 'googleVisionApiKey', v)} secret />
      </Section>
    </div>
  )
}

function Section({
  title,
  desc,
  children,
}: {
  title: string
  desc: string
  children: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{desc}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">{children}</CardContent>
    </Card>
  )
}

function Field({
  label,
  value,
  onChange,
  secret,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  secret?: boolean
  placeholder?: string
}) {
  return (
    <div className="space-y-1.5 sm:col-span-1">
      <Label>{label}</Label>
      <Input
        type={secret ? 'password' : 'text'}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
      />
    </div>
  )
}
