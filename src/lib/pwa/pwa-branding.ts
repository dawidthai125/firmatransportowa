import { COMPANY_BRANDING } from '@/config/branding'
import { loadTenantSettingsData, saveTenantSettingsData } from '@/lib/domain/tenant-settings'

export interface PwaBrandingSettings {
  /** Pełna nazwa przy instalacji PWA — np. „Tajski-Trans Test” */
  appName: string
  /** Skrót pod ikoną na pulpicie */
  shortName: string
}

export const DEFAULT_PWA_BRANDING: PwaBrandingSettings = {
  appName: `${COMPANY_BRANDING.shortName} Test`,
  shortName: COMPANY_BRANDING.shortName,
}

export function loadPwaBranding(tenantId: string): PwaBrandingSettings {
  const raw = loadTenantSettingsData(tenantId)
  const pwa = raw.pwaBranding ?? {}
  return {
    appName: pwa.appName?.trim() || DEFAULT_PWA_BRANDING.appName,
    shortName: pwa.shortName?.trim() || DEFAULT_PWA_BRANDING.shortName,
  }
}

export function savePwaBranding(tenantId: string, patch: Partial<PwaBrandingSettings>): PwaBrandingSettings {
  const data = loadTenantSettingsData(tenantId)
  const next: PwaBrandingSettings = {
    ...loadPwaBranding(tenantId),
    ...patch,
  }
  saveTenantSettingsData(tenantId, {
    ...data,
    pwaBranding: next,
  })
  return next
}

/** Meta tagi + dynamiczny manifest — nazwa skrótu na pulpicie (Chrome, Safari, Firefox, Opera) */
export async function applyPwaBrandingToDocument(branding: PwaBrandingSettings): Promise<void> {
  if (typeof document === 'undefined') return

  document.title = `${branding.shortName} — Panel transportowy`

  const setMeta = (name: string, content: string) => {
    let el = document.querySelector(`meta[name="${name}"]`)
    if (!el) {
      el = document.createElement('meta')
      el.setAttribute('name', name)
      document.head.appendChild(el)
    }
    el.setAttribute('content', content)
  }

  setMeta('application-name', branding.appName)
  setMeta('apple-mobile-web-app-title', branding.shortName)

  try {
    const res = await fetch('/manifest.webmanifest', { cache: 'no-cache' })
    if (!res.ok) return
    const base = (await res.json()) as Record<string, unknown>
    const manifest = {
      ...base,
      name: branding.appName,
      short_name: branding.shortName,
    }
    const blob = new Blob([JSON.stringify(manifest)], { type: 'application/manifest+json' })
    const url = URL.createObjectURL(blob)
    let link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]')
    if (!link) {
      link = document.createElement('link')
      link.rel = 'manifest'
      document.head.appendChild(link)
    }
    const prev = link.dataset.blobUrl
    if (prev) URL.revokeObjectURL(prev)
    link.href = url
    link.dataset.blobUrl = url
  } catch {
    /* manifest opcjonalny offline */
  }
}
