import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { isSupabaseConfigured } from '@/config/supabase'
import { onCloudStatus, pullAllFromCloud, startCloudSyncListeners } from '@/lib/cloud-sync'

const CloudSyncContext = createContext(false)

export function useInitialCloudSyncDone(): boolean {
  return useContext(CloudSyncContext)
}

interface CloudLoaderProps {
  children: ReactNode
}

const STARTUP_PULL_RETRIES = 2
const STARTUP_RETRY_DELAY_MS = 2500

/** Synchronizacja w tle — portal i panele widoczne od razu, bez pełnoekranowego blokera. */
export function CloudLoader({ children }: CloudLoaderProps) {
  const [banner, setBanner] = useState<string | null>(null)
  const [initialPull, setInitialPull] = useState(isSupabaseConfigured())
  const [initialSyncDone, setInitialSyncDone] = useState(!isSupabaseConfigured())

  useEffect(() => {
    if (!isSupabaseConfigured()) return

    let cancelled = false

    const unsub = onCloudStatus((status) => {
      if (cancelled) return
      if (status === 'ok') setBanner(null)
      if (status === 'ok' || status === 'error' || status === 'offline') {
        setInitialSyncDone(true)
      }
    })

    async function runStartupPull(): Promise<void> {
      let lastErr: unknown
      for (let attempt = 0; attempt <= STARTUP_PULL_RETRIES; attempt++) {
        if (cancelled) return
        try {
          await pullAllFromCloud()
          if (!cancelled) setBanner(null)
          return
        } catch (e) {
          lastErr = e
          if (attempt < STARTUP_PULL_RETRIES) {
            await new Promise((r) => setTimeout(r, STARTUP_RETRY_DELAY_MS))
          }
        }
      }
      if (!cancelled) {
        const msg =
          lastErr instanceof Error
            ? lastErr.message
            : 'Chmura chwilowo niedostępna'
        setBanner(msg)
      }
    }

    void runStartupPull().finally(() => {
      if (!cancelled) {
        setInitialPull(false)
        setInitialSyncDone(true)
      }
    })

    const stopSyncListeners = startCloudSyncListeners()

    return () => {
      cancelled = true
      unsub()
      stopSyncListeners()
    }
  }, [])

  return (
    <CloudSyncContext.Provider value={initialSyncDone}>
      {initialPull && (
        <div
          className="fixed inset-x-0 top-0 z-[100] border-b border-border/60 bg-background/95 px-4 py-2 text-center text-xs text-muted-foreground backdrop-blur-sm"
          role="status"
          aria-live="polite"
        >
          Synchronizacja z chmurą…
        </div>
      )}
      {banner && (
        <div
          className={`fixed inset-x-0 z-[100] bg-warning/10 px-4 py-2 text-center text-xs text-warning ${initialPull ? 'top-8' : 'top-0'}`}
        >
          {banner} — pokazujemy dane z tej przeglądarki. Kliknij ikonę chmury, aby ponowić.
        </div>
      )}
      {children}
    </CloudSyncContext.Provider>
  )
}
