import { loadFreightConnectorConfig, saveFreightConnectorConfig } from '@/lib/domain/freight-connectors'
import {
  loadFleetTelematicsConfig,
  saveFleetTelematicsConfig,
} from '@/lib/domain/fleet-telematics-connectors'
import { loadInvoicingConfig, saveInvoicingConfig } from '@/lib/domain/invoicing-config'
import { loadOcrConfig, saveOcrConfig } from '@/lib/domain/ocr-config'
import {
  loadTachographConnectorConfig,
  saveTachographConnectorConfig,
} from '@/lib/domain/tachograph-connectors'
import { pushTenantKeysNow } from '@/lib/cloud-sync'
import { isSupabaseConfigured } from '@/config/supabase'
import {
  syncFreightProductionApi,
  testIntegrationsViaEdge,
  testInvoicingConnection,
  type IntegrationTestResult,
} from '@/lib/domain/integration-api'
import { syncFleetTelematics } from '@/lib/domain/fleet-telematics-connectors'
import { syncTachographConnectors } from '@/lib/domain/tachograph-connectors'
import { ocrVisionConfigured } from '@/lib/domain/ocr-config'
import type { Tenant, TenantDataKey } from '@/lib/tenant/types'
import { DEFAULT_MODULES, type TenantModules } from '@/lib/tenant/types'
import { saveTenantsRegistry, loadTenantsRegistry } from '@/lib/tenant/storage'

export interface IntegrationHubSnapshot {
  freight: ReturnType<typeof loadFreightConnectorConfig>
  invoicing: ReturnType<typeof loadInvoicingConfig>
  tachograph: ReturnType<typeof loadTachographConnectorConfig>
  fleetGps: ReturnType<typeof loadFleetTelematicsConfig>
  ocr: ReturnType<typeof loadOcrConfig>
}

export function loadIntegrationHub(tenantId: string): IntegrationHubSnapshot {
  return {
    freight: loadFreightConnectorConfig(tenantId),
    invoicing: loadInvoicingConfig(tenantId),
    tachograph: loadTachographConnectorConfig(tenantId),
    fleetGps: loadFleetTelematicsConfig(tenantId),
    ocr: loadOcrConfig(tenantId),
  }
}

/** Po zapisie kluczy — włącz moduły i connectory, żeby od razu działało */
export function applyIntegrationActivation(tenant: Tenant): Tenant {
  const hub = loadIntegrationHub(tenant.id)
  const modules: TenantModules = { ...DEFAULT_MODULES, ...tenant.settings.modules }

  const freight = { ...hub.freight }
  if (freight.transEuApiKey?.trim() && freight.transEuClientId?.trim()) {
    freight.productionApiEnabled = true
    freight.transEuEnabled = true
    modules.freightApiProd = true
    modules.loadBoard = true
  }
  if (freight.timocomApiKey?.trim()) {
    freight.timocomEnabled = true
    freight.productionApiEnabled = true
    modules.freightApiProd = true
    modules.loadBoard = true
  }
  saveFreightConnectorConfig(tenant.id, freight)

  const invoicing = { ...hub.invoicing }
  if (invoicing.fakturowniaApiToken?.trim() && invoicing.fakturowniaSubdomain?.trim()) {
    invoicing.provider = 'fakturownia'
    invoicing.deliveryMode = invoicing.deliveryMode === 'csv' ? 'both' : invoicing.deliveryMode
    modules.invoicing = true
  }
  if (invoicing.wfirmaApiToken?.trim() && invoicing.wfirmaCompanyId?.trim()) {
    invoicing.provider = 'wfirma'
    invoicing.deliveryMode = invoicing.deliveryMode === 'csv' ? 'both' : invoicing.deliveryMode
    modules.invoicing = true
  }
  saveInvoicingConfig(tenant.id, invoicing)

  const tacho = { ...hub.tachograph }
  if (tacho.tachoScanApiKey?.trim()) {
    tacho.tachoScanEnabled = true
    modules.tachographImport = true
  }
  if (tacho.vdoFleetId?.trim()) {
    tacho.vdoOnlineEnabled = true
    modules.tachographImport = true
  }
  if (tacho.telematicsEndpoint?.trim()) {
    tacho.telematicsFmsEnabled = true
    modules.tachographImport = true
  }
  saveTachographConnectorConfig(tenant.id, tacho)

  const gps = { ...hub.fleetGps }
  if (gps.webfleetApiKey?.trim() && gps.webfleetAccount?.trim()) {
    gps.webfleetEnabled = true
    modules.gps = true
    modules.fleet = true
  }
  if (gps.transicsFleetId?.trim()) {
    gps.transicsEnabled = true
    modules.gps = true
    modules.fleet = true
  }
  if (gps.genericWebhookUrl?.trim()) {
    gps.genericEnabled = true
    modules.gps = true
    modules.fleet = true
  }
  saveFleetTelematicsConfig(tenant.id, gps)

  if (hub.ocr.openaiApiKey?.trim() || hub.ocr.googleVisionApiKey?.trim()) {
    modules.ocrRateCon = true
    modules.loadBoard = true
  }

  const next: Tenant = {
    ...tenant,
    settings: { ...tenant.settings, modules },
    updatedAt: new Date().toISOString(),
  }

  const registry = loadTenantsRegistry()
  saveTenantsRegistry(registry.map((t) => (t.id === next.id ? next : t)))
  return next
}

export function saveIntegrationHub(
  tenantId: string,
  patch: Partial<{
    freight: Partial<IntegrationHubSnapshot['freight']>
    invoicing: Partial<IntegrationHubSnapshot['invoicing']>
    tachograph: Partial<IntegrationHubSnapshot['tachograph']>
    fleetGps: Partial<IntegrationHubSnapshot['fleetGps']>
    ocr: Partial<IntegrationHubSnapshot['ocr']>
  }>,
): IntegrationHubSnapshot {
  const current = loadIntegrationHub(tenantId)
  if (patch.freight) {
    saveFreightConnectorConfig(tenantId, { ...current.freight, ...patch.freight })
  }
  if (patch.invoicing) {
    saveInvoicingConfig(tenantId, { ...current.invoicing, ...patch.invoicing })
  }
  if (patch.tachograph) {
    saveTachographConnectorConfig(tenantId, { ...current.tachograph, ...patch.tachograph })
  }
  if (patch.fleetGps) {
    saveFleetTelematicsConfig(tenantId, { ...current.fleetGps, ...patch.fleetGps })
  }
  if (patch.ocr) {
    saveOcrConfig(tenantId, { ...current.ocr, ...patch.ocr })
  }
  return loadIntegrationHub(tenantId)
}

export async function testAllIntegrations(tenantId: string): Promise<IntegrationTestResult[]> {
  return testIntegrationsViaEdge(tenantId, loadIntegrationHub(tenantId))
}

export interface IntegrationBootResult {
  label: string
  ok: boolean
  detail: string
}

const INTEGRATION_DATA_KEYS: TenantDataKey[] = [
  'freight-connectors',
  'tachograph-connectors',
  'fleet-telematics-connectors',
  'invoicing-config',
  'ocr-config',
]

/** Po zapisie kluczy — wypchnij do chmury i uruchom pierwszy sync każdego modułu */
export async function runIntegrationBootSync(tenantId: string): Promise<IntegrationBootResult[]> {
  const hub = loadIntegrationHub(tenantId)
  const out: IntegrationBootResult[] = []

  if (isSupabaseConfigured()) {
    try {
      await pushTenantKeysNow(tenantId, INTEGRATION_DATA_KEYS)
      out.push({ label: 'Chmura', ok: true, detail: 'Klucze zsynchronizowane z Edge' })
    } catch (e) {
      out.push({
        label: 'Chmura',
        ok: false,
        detail: e instanceof Error ? e.message : 'Błąd push kluczy',
      })
    }
  }

  if (
    hub.freight.transEuApiKey?.trim() ||
    hub.freight.timocomApiKey?.trim()
  ) {
    try {
      const r = await syncFreightProductionApi(tenantId, {
        transEuEnabled: hub.freight.transEuEnabled,
        timocomEnabled: hub.freight.timocomEnabled,
        transEuClientId: hub.freight.transEuClientId,
        transEuApiKey: hub.freight.transEuApiKey,
        timocomApiKey: hub.freight.timocomApiKey,
        transEuSandbox: hub.freight.transEuSandbox,
      })
      out.push({
        label: 'Giełda frachtu',
        ok: r.ok,
        detail:
          r.mode === 'production'
            ? `Produkcja: dodano ${r.added} ofert`
            : r.message ?? 'Demo — sprawdź klucze Trans.eu',
      })
    } catch (e) {
      out.push({
        label: 'Giełda frachtu',
        ok: false,
        detail: e instanceof Error ? e.message : 'Sync nieudany',
      })
    }
  }

  if (
    hub.tachograph.tachoScanEnabled ||
    hub.tachograph.vdoOnlineEnabled ||
    hub.tachograph.telematicsFmsEnabled
  ) {
    try {
      const r = await syncTachographConnectors(tenantId)
      out.push({
        label: 'Tachograf DDD',
        ok: !r.error,
        detail: r.error
          ? r.error
          : `Sync OK: +${r.added} / ~${r.updated}, dostawcy: ${r.providers.join(', ') || '—'}`,
      })
    } catch (e) {
      out.push({
        label: 'Tachograf DDD',
        ok: false,
        detail: e instanceof Error ? e.message : 'Sync nieudany',
      })
    }
  }

  if (
    hub.fleetGps.webfleetEnabled ||
    hub.fleetGps.transicsEnabled ||
    hub.fleetGps.genericEnabled
  ) {
    try {
      const r = await syncFleetTelematics(tenantId)
      out.push({
        label: 'GPS / telematyka',
        ok: !r.error,
        detail: r.error
          ? r.error
          : `Sync OK: ${r.updated} pozycji (${r.providers.join(', ') || '—'})`,
      })
    } catch (e) {
      out.push({
        label: 'GPS / telematyka',
        ok: false,
        detail: e instanceof Error ? e.message : 'Sync nieudany',
      })
    }
  }

  if (hub.invoicing.fakturowniaApiToken?.trim() && hub.invoicing.fakturowniaSubdomain?.trim()) {
    try {
      const r = await testInvoicingConnection(tenantId, 'fakturownia', {
        fakturowniaSubdomain: hub.invoicing.fakturowniaSubdomain,
        fakturowniaApiToken: hub.invoicing.fakturowniaApiToken,
      })
      out.push({ label: 'Fakturownia', ok: r.ok, detail: r.message })
    } catch (e) {
      out.push({
        label: 'Fakturownia',
        ok: false,
        detail: e instanceof Error ? e.message : 'Test nieudany',
      })
    }
  }

  if (hub.invoicing.wfirmaApiToken?.trim() && hub.invoicing.wfirmaCompanyId?.trim()) {
    try {
      const r = await testInvoicingConnection(tenantId, 'wfirma', {
        wfirmaApiToken: hub.invoicing.wfirmaApiToken,
        wfirmaCompanyId: hub.invoicing.wfirmaCompanyId,
      })
      out.push({ label: 'wFirma', ok: r.ok, detail: r.message })
    } catch (e) {
      out.push({
        label: 'wFirma',
        ok: false,
        detail: e instanceof Error ? e.message : 'Test nieudany',
      })
    }
  }

  if (ocrVisionConfigured(hub.ocr)) {
    out.push({
      label: 'OCR rate con',
      ok: true,
      detail: 'Klucz zapisany — użyj skanu PDF na giełdzie ładunków',
    })
  }

  return out
}
