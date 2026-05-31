import { isSupabaseConfigured } from '@/config/supabase'
import {
  getLastSyncError,
  onCloudStatus,
  retryCloudSync,
  type CloudSyncStatus,
} from '@/lib/cloud-sync'
import { APP_VERSION } from '@/config/version'
import { cn } from '@/lib/utils'
import { Cloud, CloudOff, Loader2, RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'

const LABELS: Record<CloudSyncStatus, string> = {
  idle: 'Chmura',
  syncing: 'Synchronizacja…',
  ok: 'Dane aktualne',
  error: 'Brak połączenia',
  offline: 'Tylko lokalnie',
}

function userFacingDetail(status: CloudSyncStatus, detail: string | null): string | null {
  if (!detail) return null
  if (status !== 'error') return detail
  if (/timeout|50[23]|fetch|network/i.test(detail)) return detail
  return detail
}

export function CloudStatusBadge() {
  const [status, setStatus] = useState<CloudSyncStatus>(
    isSupabaseConfigured() ? 'ok' : 'offline',
  )
  const [detail, setDetail] = useState<string | null>(null)
  const [retrying, setRetrying] = useState(false)

  useEffect(
    () =>
      onCloudStatus((s, msg) => {
        setStatus(s)
        setDetail(msg ?? getLastSyncError())
      }),
    [],
  )

  async function onRetry() {
    if (!isSupabaseConfigured() || retrying) return
    setRetrying(true)
    try {
      await retryCloudSync()
    } finally {
      setRetrying(false)
    }
  }

  if (!isSupabaseConfigured()) {
    return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground" title={`Brak .env Supabase · v${APP_VERSION}`}>
        <CloudOff className="h-3.5 w-3.5" />
        local
      </span>
    )
  }

  const title =
    status === 'error' && (detail || getLastSyncError())
      ? `${userFacingDetail(status, detail ?? getLastSyncError())} · kliknij, aby ponowić · v${APP_VERSION}`
      : `${LABELS[status]} · v${APP_VERSION}`

  return (
    <button
      type="button"
      onClick={() => void onRetry()}
      className={cn(
        'flex items-center gap-1 text-xs transition-opacity hover:opacity-80',
        status === 'ok' && 'text-success',
        status === 'syncing' && 'text-primary',
        status === 'error' && 'text-warning',
        status === 'idle' && 'text-muted-foreground',
      )}
      title={title}
      aria-label={status === 'error' ? 'Ponów synchronizację z chmurą' : LABELS[status]}
    >
      {status === 'syncing' || retrying ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : status === 'error' ? (
        <RefreshCw className="h-3.5 w-3.5" />
      ) : (
        <Cloud className="h-3.5 w-3.5" />
      )}
      {LABELS[status]}
    </button>
  )
}
