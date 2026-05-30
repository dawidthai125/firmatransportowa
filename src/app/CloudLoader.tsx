import { isSupabaseConfigured } from '@/config/supabase'
import { pullAllFromCloud, startCloudSyncListeners } from '@/lib/cloud-sync'
import { useEffect, useState, type ReactNode } from 'react'

interface CloudLoaderProps {
  children: ReactNode
}

/** Synchronizacja w tle — portal i panele widoczne od razu, bez pełnoekranowego blokera. */
export function CloudLoader({ children }: CloudLoaderProps) {
  const [error, setError] = useState<string | null>(null)
  const [initialPull, setInitialPull] = useState(isSupabaseConfigured())

  useEffect(() => {
    if (!isSupabaseConfigured()) return

    let cancelled = false

    pullAllFromCloud()
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Błąd chmury')
      })
      .finally(() => {
        if (!cancelled) setInitialPull(false)
      })

    const stopSyncListeners = startCloudSyncListeners()

    return () => {
      cancelled = true
      stopSyncListeners()
    }
  }, [])

  return (
    <>
      {initialPull && (
        <div
          className="fixed inset-x-0 top-0 z-[100] border-b border-border/60 bg-background/95 px-4 py-2 text-center text-xs text-muted-foreground backdrop-blur-sm"
          role="status"
          aria-live="polite"
        >
          Synchronizacja z chmurą…
        </div>
      )}
      {error && (
        <div
          className={`fixed inset-x-0 z-[100] bg-warning/10 px-4 py-2 text-center text-xs text-warning ${initialPull ? 'top-8' : 'top-0'}`}
        >
          Chmura niedostępna ({error}) — dane z przeglądarki.
        </div>
      )}
      {children}
    </>
  )
}
