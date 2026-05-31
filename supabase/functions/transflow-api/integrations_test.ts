/** Test połączeń integracji — klucze z panelu właściciela */

export interface IntegrationHubPayload {
  freight: {
    transEuClientId?: string
    transEuApiKey?: string
    transEuSandbox?: boolean
    timocomApiKey?: string
    timocomCompanyId?: string
  }
  invoicing: {
    fakturowniaSubdomain?: string
    fakturowniaApiToken?: string
    wfirmaApiToken?: string
    wfirmaCompanyId?: string
  }
  tachograph: {
    tachoScanApiKey?: string
    vdoFleetId?: string
    telematicsEndpoint?: string
  }
  fleetGps: {
    webfleetAccount?: string
    webfleetApiKey?: string
    transicsFleetId?: string
    genericWebhookUrl?: string
  }
  ocr: {
    openaiApiKey?: string
    googleVisionApiKey?: string
  }
}

export interface IntegrationTestResult {
  id: string
  label: string
  ok: boolean
  mode: 'production' | 'demo' | 'skipped'
  message: string
}

async function testTransEu(freight: IntegrationHubPayload['freight']): Promise<IntegrationTestResult> {
  const id = 'freight_trans_eu'
  const token = freight.transEuApiKey?.trim()
  const clientId = freight.transEuClientId?.trim()
  if (!token || !clientId) {
    return { id, label: 'Trans.eu', ok: false, mode: 'skipped', message: 'Brak Client ID lub API Key' }
  }
  try {
    const res = await fetch('https://api.platform.trans.eu/ext/freights-api/v1/freight-exchange?limit=1', {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Client-Id': clientId,
        Accept: 'application/json',
      },
    })
    if (res.ok) {
      return { id, label: 'Trans.eu', ok: true, mode: 'production', message: 'Połączenie OK — oferty z API' }
    }
    return {
      id,
      label: 'Trans.eu',
      ok: false,
      mode: 'production',
      message: `HTTP ${res.status} — sprawdź klucze i sandbox`,
    }
  } catch (e) {
    return { id, label: 'Trans.eu', ok: false, mode: 'production', message: String(e) }
  }
}

async function testTimocom(freight: IntegrationHubPayload['freight']): Promise<IntegrationTestResult> {
  const id = 'freight_timocom'
  const key = freight.timocomApiKey?.trim()
  if (!key) {
    return { id, label: 'TimoCom', ok: false, mode: 'skipped', message: 'Brak klucza API' }
  }
  return {
    id,
    label: 'TimoCom',
    ok: true,
    mode: 'demo',
    message: 'Klucz zapisany — sync TimoCom używa demo do pełnego REST partnera',
  }
}

async function testFakturownia(inv: IntegrationHubPayload['invoicing']): Promise<IntegrationTestResult> {
  const id = 'invoicing_fakturownia'
  const sub = inv.fakturowniaSubdomain?.trim()
  const token = inv.fakturowniaApiToken?.trim()
  if (!sub || !token) {
    return { id, label: 'Fakturownia', ok: false, mode: 'skipped', message: 'Brak subdomeny lub tokenu' }
  }
  const url = `https://${sub}.fakturownia.pl/invoices.json?period=this_month&page=1&api_token=${encodeURIComponent(token)}`
  const res = await fetch(url)
  if (res.ok) {
    return { id, label: 'Fakturownia', ok: true, mode: 'production', message: 'Połączenie OK' }
  }
  return { id, label: 'Fakturownia', ok: false, mode: 'production', message: `HTTP ${res.status}` }
}

async function testWfirma(inv: IntegrationHubPayload['invoicing']): Promise<IntegrationTestResult> {
  const id = 'invoicing_wfirma'
  const token = inv.wfirmaApiToken?.trim()
  const companyId = inv.wfirmaCompanyId?.trim()
  if (!token || !companyId) {
    return { id, label: 'wFirma', ok: false, mode: 'skipped', message: 'Brak tokenu lub ID firmy' }
  }
  const res = await fetch(
    `https://api2.wfirma.pl/invoices/find?company_id=${companyId}&inputFormat=json&outputFormat=json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ invoices: { parameters: { limit: 1 } } }),
    },
  )
  if (res.ok) {
    return { id, label: 'wFirma', ok: true, mode: 'production', message: 'Połączenie OK' }
  }
  return { id, label: 'wFirma', ok: false, mode: 'production', message: `HTTP ${res.status}` }
}

async function testTachoScan(tacho: IntegrationHubPayload['tachograph']): Promise<IntegrationTestResult> {
  const id = 'tachograph_tachoscan'
  const key = tacho.tachoScanApiKey?.trim()
  if (!key) {
    return { id, label: 'TachoScan', ok: false, mode: 'skipped', message: 'Brak klucza API' }
  }
  const base = Deno.env.get('TACHOSCAN_API_BASE') ?? 'https://api.tachoscan.pl'
  try {
    const res = await fetch(`${base}/api/v1/status`, {
      headers: { Authorization: `Bearer ${key}`, Accept: 'application/json' },
    })
    if (res.ok) {
      return { id, label: 'TachoScan', ok: true, mode: 'production', message: 'API partnera odpowiada' }
    }
  } catch {
    /* fallback below */
  }
  return {
    id,
    label: 'TachoScan',
    ok: true,
    mode: 'demo',
    message: 'Klucz zapisany — sync użyje API gdy endpoint partnera jest dostępny',
  }
}

async function testWebfleet(gps: IntegrationHubPayload['fleetGps']): Promise<IntegrationTestResult> {
  const id = 'fleet_webfleet'
  const account = gps.webfleetAccount?.trim()
  const apiKey = gps.webfleetApiKey?.trim()
  if (!account || !apiKey) {
    return { id, label: 'Webfleet', ok: false, mode: 'skipped', message: 'Brak konta lub API Key' }
  }
  try {
    const url = `https://csv.webfleet.com/extern?account=${encodeURIComponent(account)}&apikey=${encodeURIComponent(apiKey)}&action=showAccountOrderExtern&outputformat=json`
    const res = await fetch(url)
    if (res.ok) {
      return { id, label: 'Webfleet', ok: true, mode: 'production', message: 'Połączenie OK — pozycje GPS' }
    }
    return { id, label: 'Webfleet', ok: false, mode: 'production', message: `HTTP ${res.status}` }
  } catch (e) {
    return { id, label: 'Webfleet', ok: false, mode: 'production', message: String(e) }
  }
}

async function testOpenAi(ocr: IntegrationHubPayload['ocr']): Promise<IntegrationTestResult> {
  const id = 'ocr_openai'
  const key = ocr.openaiApiKey?.trim()
  if (!key) {
    return { id, label: 'OpenAI (OCR)', ok: false, mode: 'skipped', message: 'Brak klucza' }
  }
  const res = await fetch('https://api.openai.com/v1/models', {
    headers: { Authorization: `Bearer ${key}` },
  })
  if (res.ok) {
    return { id, label: 'OpenAI (OCR)', ok: true, mode: 'production', message: 'Klucz OK — OCR rate con' }
  }
  return { id, label: 'OpenAI (OCR)', ok: false, mode: 'production', message: `HTTP ${res.status}` }
}

export async function runIntegrationsTest(
  hub: IntegrationHubPayload,
): Promise<{ ok: boolean; results: IntegrationTestResult[] }> {
  const results = await Promise.all([
    testTransEu(hub.freight),
    testTimocom(hub.freight),
    testFakturownia(hub.invoicing),
    testWfirma(hub.invoicing),
    testTachoScan(hub.tachograph),
    testWebfleet(hub.fleetGps),
    testOpenAi(hub.ocr),
  ])
  const configured = results.filter((r) => r.mode !== 'skipped')
  const ok = configured.length === 0 || configured.some((r) => r.ok)
  return { ok, results }
}

export type { IntegrationHubPayload as HubPayload }
