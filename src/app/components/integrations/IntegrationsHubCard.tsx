import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/Card'
import { loadIntegrationHub } from '@/lib/domain/integration-hub'
import { ocrVisionConfigured } from '@/lib/domain/ocr-config'
import { CheckCircle2, Circle } from 'lucide-react'

export function IntegrationStatusSummary({ tenantId }: { tenantId: string }) {
  const hub = loadIntegrationHub(tenantId)
  const items = [
    {
      label: 'Trans.eu',
      ok: Boolean(hub.freight.transEuApiKey?.trim() && hub.freight.transEuClientId?.trim()),
    },
    {
      label: 'TimoCom',
      ok: Boolean(hub.freight.timocomApiKey?.trim()),
    },
    {
      label: 'Fakturownia',
      ok: Boolean(hub.invoicing.fakturowniaApiToken?.trim() && hub.invoicing.fakturowniaSubdomain?.trim()),
    },
    {
      label: 'wFirma',
      ok: Boolean(hub.invoicing.wfirmaApiToken?.trim() && hub.invoicing.wfirmaCompanyId?.trim()),
    },
    {
      label: 'TachoScan',
      ok: Boolean(hub.tachograph.tachoScanApiKey?.trim()),
    },
    {
      label: 'Webfleet GPS',
      ok: Boolean(hub.fleetGps.webfleetApiKey?.trim() && hub.fleetGps.webfleetAccount?.trim()),
    },
    {
      label: 'OCR (OpenAI/Vision)',
      ok: ocrVisionConfigured(hub.ocr),
    },
  ]
  const configured = items.filter((i) => i.ok).length

  return (
    <div className="space-y-3 text-sm">
      <p className="text-muted-foreground">
        Skonfigurowano {configured} z {items.length} integracji. Reszta działa w trybie demo bez klucza.
      </p>
      <ul className="grid gap-1.5 sm:grid-cols-2">
        {items.map((item) => (
          <li key={item.label} className="flex items-center gap-2">
            {item.ok ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
            ) : (
              <Circle className="h-4 w-4 shrink-0 text-muted-foreground/50" />
            )}
            <span className={item.ok ? 'font-medium' : 'text-muted-foreground'}>{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function IntegrationsHubCard({
  tenantId,
  onOpen,
}: {
  tenantId: string
  onOpen?: () => void
}) {
  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="text-base">Klucze API i integracje</CardTitle>
        <CardDescription>
          Giełda Trans.eu, faktury, tachograf DDD, GPS Webfleet, OCR — wpisz klucze raz, reszta włączy się
          automatycznie.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <IntegrationStatusSummary tenantId={tenantId} />
        {onOpen && (
          <button
            type="button"
            onClick={onOpen}
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Przejdź do Klucze API →
          </button>
        )}
      </CardContent>
    </Card>
  )
}
