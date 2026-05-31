import { readTenantData, writeTenantData } from '@/lib/tenant/storage'

export type InvoicingProvider = 'none' | 'csv' | 'fakturownia' | 'wfirma'

export type InvoicingDeliveryMode = 'csv' | 'rest' | 'both'

export interface InvoicingConfig {
  provider: InvoicingProvider
  /** CSV, REST API lub oba */
  deliveryMode: InvoicingDeliveryMode
  defaultPaymentDays: number
  defaultVatRate: number
  sellerName?: string
  sellerNip?: string
  sellerAddress?: string
  sellerEmail?: string
  sellerBankAccount?: string
  /** Fakturownia.pl */
  fakturowniaSubdomain?: string
  fakturowniaApiToken?: string
  fakturowniaDepartmentId?: string
  /** wFirma */
  wfirmaCompanyId?: string
  wfirmaApiToken?: string
  wfirmaSeriesName?: string
  /** Automatycznie wystawiaj fakturę po statusie „dostarczony” */
  autoInvoiceOnDelivered: boolean
  lastExportAt?: string
  lastApiSyncAt?: string
  lastApiError?: string
  updatedAt?: string
}

export const INVOICING_PROVIDER_LABELS: Record<InvoicingProvider, string> = {
  none: 'Wyłączone',
  csv: 'Eksport CSV (uniwersalny)',
  fakturownia: 'Fakturownia.pl',
  wfirma: 'wFirma',
}

export const INVOICING_DELIVERY_LABELS: Record<InvoicingDeliveryMode, string> = {
  csv: 'Tylko eksport CSV',
  rest: 'Tylko REST API',
  both: 'CSV + REST API',
}

const DEFAULT: InvoicingConfig = {
  provider: 'csv',
  deliveryMode: 'csv',
  defaultPaymentDays: 14,
  defaultVatRate: 23,
  autoInvoiceOnDelivered: false,
}

export function loadInvoicingConfig(tenantId: string): InvoicingConfig {
  const raw = readTenantData<Partial<InvoicingConfig>>(tenantId, 'invoicing-config', {})
  return {
    ...DEFAULT,
    ...raw,
    deliveryMode: raw.deliveryMode ?? (raw.provider === 'csv' ? 'csv' : 'both'),
    autoInvoiceOnDelivered: raw.autoInvoiceOnDelivered ?? false,
    defaultVatRate: raw.defaultVatRate ?? 23,
  }
}

export function saveInvoicingConfig(tenantId: string, config: InvoicingConfig): void {
  writeTenantData(tenantId, 'invoicing-config', {
    ...config,
    updatedAt: new Date().toISOString(),
  })
}

export function invoicingRestEnabled(config: InvoicingConfig): boolean {
  if (config.provider === 'none' || config.provider === 'csv') return false
  return config.deliveryMode === 'rest' || config.deliveryMode === 'both'
}

export function invoicingCsvEnabled(config: InvoicingConfig): boolean {
  if (config.provider === 'none') return false
  return config.deliveryMode === 'csv' || config.deliveryMode === 'both' || config.provider === 'csv'
}
