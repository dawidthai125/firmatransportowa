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
import type { IntegrationTestResult } from '@/lib/domain/integration-api'
import { testIntegrationsViaEdge } from '@/lib/domain/integration-api'
import type { Tenant } from '@/lib/tenant/types'
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
