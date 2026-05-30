import { Button } from '@/app/components/ui/Button'
import { Card, CardContent } from '@/app/components/ui/Card'
import { HeaderPopover } from '@/app/components/ui/HeaderPopover'
import {
  loadNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  unreadCount,
  type AutomationNotification,
} from '@/lib/automation/notifications-store'
import { cn } from '@/lib/utils'
import { Bell, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { AdminView } from '@/lib/navigation'

interface AutomationNotificationsProps {
  tenantId: string
  onNavigate?: (view: AdminView) => void
}

export function AutomationNotifications({ tenantId, onNavigate }: AutomationNotificationsProps) {
  const anchorRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<AutomationNotification[]>([])
  const [count, setCount] = useState(0)

  const refresh = useCallback(() => {
    setItems(loadNotifications(tenantId))
    setCount(unreadCount(tenantId))
  }, [tenantId])

  useEffect(() => {
    refresh()
    const id = window.setInterval(refresh, 5000)
    return () => window.clearInterval(id)
  }, [refresh])

  function handleOpen(n: AutomationNotification) {
    markNotificationRead(tenantId, n.id)
    refresh()
    if (n.actionView && onNavigate) {
      onNavigate(n.actionView)
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
        aria-label="Powiadomienia automatyzacji"
        aria-expanded={open}
        className="relative"
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
        ariaLabel="Powiadomienia automatyzacji"
        panelClassName="shadow-lg"
      >
        <Card className="overflow-hidden border-border shadow-none">
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <span className="text-sm font-medium">Automatyzacje</span>
            <div className="flex gap-1">
              {count > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => {
                    markAllNotificationsRead(tenantId)
                    refresh()
                  }}
                >
                  Oznacz przeczytane
                </Button>
              )}
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOpen(false)}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <CardContent className="max-h-72 space-y-1 overflow-y-auto p-2">
            {items.length === 0 ? (
              <p className="p-3 text-center text-xs text-muted-foreground">Brak powiadomień</p>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleOpen(n)}
                  className={cn(
                    'w-full rounded-md px-2 py-2 text-left text-xs transition-colors hover:bg-muted',
                    !n.read && 'bg-primary/5',
                  )}
                >
                  <p className="font-medium">{n.title}</p>
                  <p className="text-muted-foreground">{n.message}</p>
                </button>
              ))
            )}
          </CardContent>
        </Card>
      </HeaderPopover>
    </div>
  )
}
