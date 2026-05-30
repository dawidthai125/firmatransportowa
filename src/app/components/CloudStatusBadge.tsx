import { isSupabaseConfigured } from '@/config/supabase'
import { onCloudStatus, type CloudSyncStatus } from '@/lib/cloud-sync'
import { APP_VERSION } from '@/config/version'
import { cn } from '@/lib/utils'
import { Cloud, CloudOff, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'

const LABELS: Record<CloudSyncStatus, string> = {
  idle: 'Chmura',
  syncing: 'Sync…',
  ok: 'Zsynchronizowano',
  error: 'Błąd sync',
  offline: 'Tylko lokalnie',
}

export function CloudStatusBadge() {
  const [status, setStatus] = useState<CloudSyncStatus>(
    isSupabaseConfigured() ? 'idle' : 'offline',
  )

  useEffect(() => onCloudStatus(setStatus), [])

  if (!isSupabaseConfigured()) {
    return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground" title={`Brak .env Supabase · v${APP_VERSION}`}>
        <CloudOff className="h-3.5 w-3.5" />
        local
      </span>
    )
  }

  return (
    <span
      className={cn(
        'flex items-center gap-1 text-xs',
        status === 'ok' && 'text-success',
        status === 'syncing' && 'text-primary',
        status === 'error' && 'text-danger',
        status === 'idle' && 'text-muted-foreground',
      )}
      title={`${LABELS[status]} · v${APP_VERSION}`}
    >
      {status === 'syncing' ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Cloud className="h-3.5 w-3.5" />
      )}
      {LABELS[status]}
    </span>
  )
}
