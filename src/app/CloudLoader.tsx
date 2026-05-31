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

/** Synchronizacja w tle — aplikacja od razu pokazuje dane lokalne. */
export function CloudLoader({ children }: CloudLoaderProps) {
  const [banner, setBanner] = useState<string | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured()) return

    let cancelled = false

    const unsub = onCloudStatus((status, msg) => {
      if (cancelled) return
      if (status === 'ok') setBanner(null)
      if (status === 'error' && msg) setBanner(msg)
    })

    void pullAllFromCloud().catch((e) => {
      if (cancelled) return
      const msg = e instanceof Error ? e.message : 'Chmura chwilowo niedostępna'
      setBanner(msg)
    })

    const stopSyncListeners = startCloudSyncListeners()

    return () => {
      cancelled = true
      unsub()
      stopSyncListeners()
    }
  }, [])

  return (
    <CloudSyncContext.Provider value={true}>
      {banner && (
        <div
          className="fixed inset-x-0 top-0 z-[100] bg-warning/10 px-4 py-2 text-center text-xs text-warning"
          role="status"
          aria-live="polite"
        >
          {banner} — pokazujemy dane z tej przeglądarki. Kliknij ikonę chmury, aby ponowić.
        </div>
      )}
      {children}
    </CloudSyncContext.Provider>
  )
}
