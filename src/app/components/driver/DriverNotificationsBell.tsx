import { Button } from '@/app/components/ui/Button'
import { Card, CardContent } from '@/app/components/ui/Card'
import { HeaderPopover } from '@/app/components/ui/HeaderPopover'
import {
  driverUnreadCount,
  loadDriverNotifications,
  markDriverNotificationRead,
} from '@/lib/notifications/driver-inbox'
import type { DriverView } from '@/lib/navigation'
import { cn } from '@/lib/utils'
import { Bell, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

interface DriverNotificationsBellProps {
  tenantId: string
  driverName: string
  onNavigate?: (view: DriverView) => void
}

export function DriverNotificationsBell({
  tenantId,
  driverName,
  onNavigate,
}: DriverNotificationsBellProps) {
  const anchorRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const [count, setCount] = useState(0)
  const [items, setItems] = useState(() => loadDriverNotifications(tenantId, driverName))

  const refresh = useCallback(() => {
    setItems(loadDriverNotifications(tenantId, driverName))
    setCount(driverUnreadCount(tenantId, driverName))
  }, [tenantId, driverName])

  useEffect(() => {
    refresh()
    const id = window.setInterval(refresh, 8000)
    return () => window.clearInterval(id)
  }, [refresh])

  function handleOpen(id: string, actionView?: DriverView) {
    markDriverNotificationRead(tenantId, driverName, id)
    refresh()
    if (actionView && onNavigate) {
      onNavigate(actionView)
      setOpen(false)
    }
  }

  return (
    <div className="relative">
      <Button
        ref={anchorRef}
        variant="ghost"
        size="icon"
        onClick={() => setOpen((o) => !o)}
        aria-label="Powiadomienia kierowcy"
        aria-expanded={open}
        className="relative touch-target"
      >
        <Bell className="h-4 w-4" />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </Button>

      <HeaderPopover
        open={open}
        onClose={() => setOpen(false)}
        anchorRef={anchorRef}
        ariaLabel="Powiadomienia kierowcy"
        panelClassName="shadow-lg"
      >
        <Card className="overflow-hidden border-border shadow-none">
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <span className="text-sm font-medium">Twoje powiadomienia</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardContent className="max-h-72 space-y-2 overflow-y-auto p-2">
            {items.length === 0 ? (
              <p className="p-2 text-xs text-muted-foreground">Brak powiadomień — wszystko OK.</p>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleOpen(n.id, n.actionView)}
                  className={cn(
                    'w-full rounded-lg border border-border p-2 text-left text-xs transition-colors hover:bg-muted/50',
                    !n.read && 'border-primary/30 bg-primary/5',
                  )}
                >
                  <p className="font-medium">{n.title}</p>
                  <p className="mt-0.5 text-muted-foreground">{n.message}</p>
                </button>
              ))
            )}
          </CardContent>
        </Card>
      </HeaderPopover>
    </div>
  )
}
