import { readTenantData, writeTenantData } from '@/lib/tenant/storage'

export interface OcrIntegrationConfig {
  openaiApiKey?: string
  googleVisionApiKey?: string
  updatedAt?: string
}

export function loadOcrConfig(tenantId: string): OcrIntegrationConfig {
  return readTenantData<OcrIntegrationConfig>(tenantId, 'ocr-config', {})
}

export function saveOcrConfig(tenantId: string, cfg: OcrIntegrationConfig): void {
  writeTenantData(tenantId, 'ocr-config', {
    ...cfg,
    updatedAt: new Date().toISOString(),
  })
}

export function ocrVisionConfigured(cfg: OcrIntegrationConfig): boolean {
  return Boolean(cfg.openaiApiKey?.trim() || cfg.googleVisionApiKey?.trim())
}
