import { Button } from '@/app/components/ui/Button'
import { pwaDisplayName } from '@/lib/pwa/pwa-branding-resolve'
import { usePwaInstall } from '@/lib/pwa/usePwaInstall'
import { cn } from '@/lib/utils'
import { Download, Share, Smartphone, X } from 'lucide-react'

interface InstallAppBannerProps {
  className?: string
  tenantId?: string
}

/** Baner instalacji PWA — portal i panel kierowcy na telefonie */
export function InstallAppBanner({ className, tenantId }: InstallAppBannerProps) {
  const { showBanner, canInstallNative, showIosHint, install, dismiss } = usePwaInstall()
  const appName = pwaDisplayName(tenantId)

  if (!showBanner) return null

  return (
    <div
      className={cn(
        'mb-4 rounded-xl border border-primary/30 bg-gradient-to-r from-primary/10 to-primary/5 p-4',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Smartphone className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold leading-snug">Zainstaluj {appName} na telefonie</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {showIosHint
              ? `Safari → Udostępnij → „Dodaj do ekranu początkowego” — szybki dostęp jak natywna apka.`
              : `Dodaj skrót na ekran główny — raport i awaria jednym tapnięciem (Chrome, Firefox, Opera).`}
          </p>

          {showIosHint && (
            <ol className="mt-3 space-y-1.5 text-xs text-muted-foreground">
              <li className="flex items-center gap-2">
                <Share className="h-3.5 w-3.5 shrink-0 text-primary" />
                Safari → ikona Udostępnij (na dole)
              </li>
              <li className="flex items-center gap-2">
                <Download className="h-3.5 w-3.5 shrink-0 text-primary" />
                „Dodaj do ekranu początkowego” — nazwa: {appName}
              </li>
            </ol>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            {canInstallNative && (
              <Button type="button" size="sm" className="gap-1.5 touch-target" onClick={() => void install()}>
                <Download className="h-4 w-4" />
                Zainstaluj
              </Button>
            )}
            <Button type="button" size="sm" variant="ghost" className="text-muted-foreground" onClick={dismiss}>
              Nie teraz
            </Button>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={dismiss}
          aria-label="Zamknij"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
