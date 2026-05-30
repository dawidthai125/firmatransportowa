import { COMPANY_BRANDING, isCompanyDeployment } from '@/config/branding'
import {
  DEFAULT_PWA_BRANDING,
  loadPwaBranding,
  type PwaBrandingSettings,
} from '@/lib/pwa/pwa-branding'

export function resolvePwaBranding(tenantId?: string): PwaBrandingSettings {
  if (!tenantId) return DEFAULT_PWA_BRANDING
  return loadPwaBranding(tenantId)
}

export function pwaDisplayName(tenantId?: string): string {
  const b = resolvePwaBranding(tenantId)
  if (isCompanyDeployment()) {
    return b.appName || `${COMPANY_BRANDING.shortName} Test`
  }
  return b.appName || 'TransFlow'
}

export function pwaShortName(tenantId?: string): string {
  const b = resolvePwaBranding(tenantId)
  if (isCompanyDeployment()) {
    return b.shortName || COMPANY_BRANDING.shortName
  }
  return b.shortName || 'TransFlow'
}
