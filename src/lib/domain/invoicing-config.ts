import { readTenantData, writeTenantData } from '@/lib/tenant/storage'

export type InvoicingProvider = 'none' | 'csv' | 'fakturownia' | 'wfirma'

export interface InvoicingConfig {
  provider: InvoicingProvider
  defaultPaymentDays: number
  sellerName?: string
  sellerNip?: string
  sellerAddress?: string
  fakturowniaSubdomain?: string
  wfirmaCompanyId?: string
  lastExportAt?: string
  updatedAt?: string
}

export const INVOICING_PROVIDER_LABELS: Record<InvoicingProvider, string> = {
  none: 'Wyłączone',
  csv: 'Eksport CSV (uniwersalny)',
  fakturownia: 'Fakturownia.pl',
  wfirma: 'wFirma',
}

const DEFAULT: InvoicingConfig = {
  provider: 'csv',
  defaultPaymentDays: 14,
}

export function loadInvoicingConfig(tenantId: string): InvoicingConfig {
  return { ...DEFAULT, ...readTenantData<Partial<InvoicingConfig>>(tenantId, 'invoicing-config', {}) }
}

export function saveInvoicingConfig(tenantId: string, config: InvoicingConfig): void {
  writeTenantData(tenantId, 'invoicing-config', {
    ...config,
    updatedAt: new Date().toISOString(),
  })
}
