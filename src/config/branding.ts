/**
 * Tryb wdrożenia:
 * - `company` — strona jednej firmy (Tajski-Trans), bez kodu firmy i bez języka SaaS
 * - `saas` — przyszły portal sprzedaży abonamentów (multi-tenant widoczny)
 *
 * Przełączenie: VITE_DEPLOYMENT_MODE=saas w .env
 */
export type DeploymentMode = 'company' | 'saas'

export const DEPLOYMENT_MODE: DeploymentMode =
  import.meta.env.VITE_DEPLOYMENT_MODE === 'saas' ? 'saas' : 'company'

export interface CompanyBranding {
  /** Pełna nazwa prawna */
  name: string
  /** Nazwa na portalu i w nagłówkach */
  shortName: string
  /** Wewnętrzny kod tenant (ukryty w trybie company) */
  slug: string
  tagline: string
  portalSubtitle: string
  /** Miasto / region — copy transportowy */
  region: string
}

export const COMPANY_BRANDING: CompanyBranding = {
  name: import.meta.env.VITE_COMPANY_NAME ?? 'Tajski-Trans Sp. z o.o.',
  shortName: import.meta.env.VITE_COMPANY_SHORT_NAME ?? 'Tajski-Trans',
  slug: (import.meta.env.VITE_COMPANY_SLUG ?? 'TAAJSKI-TRANS').toUpperCase(),
  tagline: 'Transport krajowy i międzynarodowy · flota · logistyka TSL',
  portalSubtitle: 'Panel pracowniczy firmy — wybierz swoją rolę i zaloguj się',
  region: 'Wrocław · Dolny Śląsk',
}

/** Legacy slugi demo — dane w localStorage po migracji */
export const LEGACY_TENANT_SLUGS = ['DEMO-TRANS', 'TAAJSKI-TRANS'] as const

export function isCompanyDeployment(): boolean {
  return DEPLOYMENT_MODE === 'company'
}

export function isSaasDeployment(): boolean {
  return DEPLOYMENT_MODE === 'saas'
}

export function resolveDefaultTenantSlug(): string {
  return isCompanyDeployment() ? COMPANY_BRANDING.slug : 'DEMO-TRANS'
}

/** Nazwa w UI i eksportach — firma w trybie company, TransFlow w SaaS */
export function getDisplayProductName(): string {
  return isCompanyDeployment() ? COMPANY_BRANDING.shortName : 'TransFlow'
}
