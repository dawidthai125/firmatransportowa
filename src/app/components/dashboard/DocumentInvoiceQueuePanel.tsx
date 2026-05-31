import { Button } from '@/app/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/Card'
import {
  courseDocumentGap,
  coursesMissingDocumentsAfterDelivery,
  coursesOverduePayment,
  coursesReadyForInvoicing,
} from '@/lib/domain/course-documents-readiness'
import { loadCourses, seedDemoCourses } from '@/lib/domain/courses-store'
import type { AdminView } from '@/lib/navigation'
import { useCloudSyncRefreshKeys } from '@/lib/sync/useCloudSyncRefresh'
import { AlertTriangle, FileCheck, Receipt, Wallet } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

interface DocumentInvoiceQueuePanelProps {
  tenantId: string
  invoicingEnabled: boolean
  onNavigate?: (view: AdminView) => void
}

export function DocumentInvoiceQueuePanel({
  tenantId,
  invoicingEnabled,
  onNavigate,
}: DocumentInvoiceQueuePanelProps) {
  const [ready, setReady] = useState(0)
  const [missingDocs, setMissingDocs] = useState<string[]>([])
  const [overdue, setOverdue] = useState(0)

  const refresh = useCallback(() => {
    seedDemoCourses(tenantId)
    const courses = loadCourses(tenantId)
    setReady(coursesReadyForInvoicing(courses).length)
    setMissingDocs(
      coursesMissingDocumentsAfterDelivery(courses).map((c) => c.reference).slice(0, 5),
    )
    setOverdue(coursesOverduePayment(courses).length)
  }, [tenantId])

  useEffect(() => {
    refresh()
  }, [refresh])

  useCloudSyncRefreshKeys(tenantId, ['courses'], refresh)

  if (ready === 0 && missingDocs.length === 0 && overdue === 0) return null

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 pb-2">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileCheck className="h-4 w-4 text-primary" />
            Dokumenty → faktura → płatność
          </CardTitle>
          <CardDescription>
            Najczęstszy problem MŚP: brak POD blokuje fakturę i kasę (trans.info / fora przewoźników)
          </CardDescription>
        </div>
        {invoicingEnabled && onNavigate && ready > 0 && (
          <Button size="sm" variant="secondary" onClick={() => onNavigate('invoicing')}>
            Fakturowanie ({ready})
          </Button>
        )}
      </CardHeader>
      <CardContent className="grid gap-2 sm:grid-cols-3">
        {ready > 0 && (
          <Stat
            icon={Receipt}
            label="Gotowe do faktury"
            value={String(ready)}
            tone="text-success"
          />
        )}
        {missingDocs.length > 0 && (
          <div className="rounded-md border border-warning/40 bg-warning/5 p-3 text-sm sm:col-span-2">
            <p className="flex items-center gap-1 font-medium text-warning">
              <AlertTriangle className="h-4 w-4" />
              Brak POD/CMR — faktura czeka
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{missingDocs.join(', ')}</p>
            {onNavigate && (
              <Button size="sm" variant="ghost" className="mt-2 h-8 px-0" onClick={() => onNavigate('courses')}>
                Otwórz kursy
              </Button>
            )}
          </div>
        )}
        {overdue > 0 && (
          <Stat icon={Wallet} label="Przeterminowane należności" value={String(overdue)} tone="text-danger" />
        )}
      </CardContent>
    </Card>
  )
}

function Stat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Receipt
  label: string
  value: string
  tone: string
}) {
  return (
    <div className="rounded-md bg-muted/50 px-3 py-2">
      <p className="flex items-center gap-1 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </p>
      <p className={`text-xl font-bold ${tone}`}>{value}</p>
    </div>
  )
}

    </div>
  )
}