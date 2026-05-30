import { applyPwaBrandingToDocument, loadPwaBranding } from '@/lib/pwa/pwa-branding'
import { useEffect } from 'react'

/** Stosuje nazwę PWA z ustawień firmy (ikona na pulpicie) */
export function usePwaBrandingEffect(tenantId: string | undefined): void {
  useEffect(() => {
    if (!tenantId) return
    const branding = loadPwaBranding(tenantId)
    void applyPwaBrandingToDocument(branding)
  }, [tenantId])
}
