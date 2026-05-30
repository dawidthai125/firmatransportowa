import { isSupabaseConfigured } from '@/config/supabase'
import { pullAllFromCloud } from '@/lib/cloud-sync'
import { Truck } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'

interface CloudLoaderProps {
  children: ReactNode
}

export function CloudLoader({ children }: CloudLoaderProps) {
  const [ready, setReady] = useState(!isSupabaseConfigured())
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setReady(true)
      return
    }

    let cancelled = false
    const timeout = setTimeout(() => {
      if (!cancelled) setReady(true)
    }, 8000)

    pullAllFromCloud()
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Błąd chmury')
      })
      .finally(() => {
        if (!cancelled) setReady(true)
        clearTimeout(timeout)
      })

    return () => {
      cancelled = true
      clearTimeout(timeout)
    }
  }, [])

  if (!ready) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background p-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Truck className="h-8 w-8 animate-pulse" />
        </div>
        <p className="text-sm text-muted-foreground">Synchronizacja z chmurą Supabase…</p>
      </div>
    )
  }

  if (error) {
    return (
      <>
        <div className="bg-warning/10 px-4 py-2 text-center text-xs text-warning">
          Chmura niedostępna ({error}) — dane z przeglądarki. Sprawdź SUPABASE-SETUP.md
        </div>
        {children}
      </>
    )
  }

  return <>{children}</>
}
