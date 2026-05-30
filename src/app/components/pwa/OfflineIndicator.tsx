import { cn } from '@/lib/utils'
import { WifiOff } from 'lucide-react'
import { useEffect, useState } from 'react'

export function OfflineIndicator() {
  const [offline, setOffline] = useState(
    typeof navigator !== 'undefined' ? !navigator.onLine : false,
  )

  useEffect(() => {
    const on = () => setOffline(false)
    const off = () => setOffline(true)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])

  if (!offline) return null

  return (
    <div
      className={cn(
        'flex items-center justify-center gap-2 border-b border-warning/30 bg-warning/10 px-3 py-1.5 text-xs font-medium text-warning',
      )}
      role="status"
    >
      <WifiOff className="h-3.5 w-3.5" />
      Brak internetu — dane zapisują się lokalnie, sync po połączeniu
    </div>
  )
}
