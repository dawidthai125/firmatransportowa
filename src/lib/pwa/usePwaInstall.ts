import {
  dismissPwaInstallPrompt,
  isIosSafari,
  isMobileDevice,
  isPwaInstallDismissed,
  isStandaloneDisplay,
  type BeforeInstallPromptEvent,
} from '@/lib/pwa/pwa-utils'
import { useCallback, useEffect, useState } from 'react'

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(isPwaInstallDismissed)
  const [standalone] = useState(isStandaloneDisplay)
  const [ios] = useState(isIosSafari)
  const [mobile] = useState(isMobileDevice)

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  const canInstallNative = Boolean(deferredPrompt) && !dismissed && !standalone
  const showIosHint = ios && mobile && !standalone && !dismissed
  const showBanner = canInstallNative || showIosHint

  const install = useCallback(async () => {
    if (!deferredPrompt) return false
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    setDeferredPrompt(null)
    return outcome === 'accepted'
  }, [deferredPrompt])

  const dismiss = useCallback(() => {
    dismissPwaInstallPrompt()
    setDismissed(true)
  }, [])

  return {
    showBanner,
    canInstallNative,
    showIosHint,
    isStandalone: standalone,
    install,
    dismiss,
  }
}
