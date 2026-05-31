import { supabaseAnonKey, supabaseFunctionsBase, isSupabaseConfigured } from '@/config/supabase'
import { getSupabaseAccessToken } from '@/lib/auth/supabase-client'
import type { RateConParseResult } from '@/lib/domain/rate-con-ocr'
import type { IntegrationHubSnapshot } from '@/lib/domain/integration-hub'

async function edgePost<T>(path: string, body: unknown): Promise<T> {
  if (!isSupabaseConfigured()) throw new Error('Supabase nie skonfigurowane')
  const jwt = await getSupabaseAccessToken()
  const res = await fetch(`${supabaseFunctionsBase}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt ?? supabaseAnonKey}`,
      apikey: supabaseAnonKey,
    },
    body: JSON.stringify(body),
  })
  const json = (await res.json()) as T & { error?: string }
  if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`)
  return json
}

export interface OcrRateConResponse {
  ok: boolean
  extractedText: string
  parse: RateConParseResult
  provider: 'edge' | 'demo'
}

export interface FreightProdSyncResponse {
  ok: boolean
  added: number
  sources: string[]
  mode: 'production' | 'demo'
  message?: string
}

export async function syncFreightProductionApi(
  tenantId: string,
  config: {
    transEuEnabled: boolean
    timocomEnabled: boolean
    transEuClientId?: string
    transEuApiKey?: string
    timocomApiKey?: string
    transEuSandbox?: boolean
  },
): Promise<FreightProdSyncResponse> {
  return edgePost('/freight-sync', { tenantId, config })
}

export interface InvoicingApiResponse {
  ok: boolean
  created: number
  invoiceIds: string[]
  mode: 'rest' | 'csv_fallback'
  errors?: string[]
}

export interface InvoicingApiLine {
  reference: string
  buyerName: string
  description: string
  netPln: number
  vatRate: number
  issueDate: string
  dueDate: string
}

export async function createInvoicesViaEdge(
  tenantId: string,
  provider: 'fakturownia' | 'wfirma',
  config: {
    fakturowniaSubdomain?: string
    fakturowniaApiToken?: string
    wfirmaApiToken?: string
    wfirmaCompanyId?: string
    sellerName?: string
    sellerNip?: string
  },
  lines: InvoicingApiLine[],
): Promise<InvoicingApiResponse> {
  return edgePost('/invoicing-sync', { tenantId, provider, config, lines })
}

export async function testInvoicingConnection(
  tenantId: string,
  provider: 'fakturownia' | 'wfirma',
  config: Record<string, string | undefined>,
): Promise<{ ok: boolean; message: string }> {
  return edgePost('/invoicing-sync', { tenantId, provider, config, testOnly: true, lines: [] })
}

export interface IntegrationTestResult {
  id: string
  label: string
  ok: boolean
  mode: 'production' | 'demo' | 'skipped'
  message: string
}

export async function testIntegrationsViaEdge(
  tenantId: string,
  hub: IntegrationHubSnapshot,
): Promise<IntegrationTestResult[]> {
  const r = await edgePost<{ results: IntegrationTestResult[] }>('/integrations-test', {
    tenantId,
    hub,
  })
  return r.results ?? []
}

export async function ocrRateConViaEdge(
  tenantId: string,
  options: {
    text?: string
    fileName?: string
    mimeType?: string
    openaiApiKey?: string
    googleVisionApiKey?: string
  },
): Promise<OcrRateConResponse> {
  return edgePost('/ocr-rate-con', { tenantId, ...options })
}
