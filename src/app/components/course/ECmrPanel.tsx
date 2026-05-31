import { Button } from '@/app/components/ui/Button'
import type { Course } from '@/lib/domain/course'
import {
  E_CMR_STATUS_LABELS,
  advanceECmr,
  createEmptyECmr,
  driverSignECmr,
  type ECmrDocument,
} from '@/lib/domain/e-cmr'
import { upsertCourseGuarded } from '@/lib/domain/courses-store'
import { cn } from '@/lib/utils'
import { FileSignature } from 'lucide-react'

interface ECmrPanelProps {
  tenantId: string
  course: Course
  signerName: string
  driverMode?: boolean
  onUpdated: (course: Course) => void
}

export function ECmrPanel({ tenantId, course, signerName, driverMode = false, onUpdated }: ECmrPanelProps) {
  const doc: ECmrDocument = course.eCmr ?? createEmptyECmr()

  async function save(nextDoc: ECmrDocument) {
    const now = new Date().toISOString()
    const updated: Course = {
      ...course,
      eCmr: nextDoc,
      cmrNumber: course.cmrNumber ?? nextDoc.documentId,
      updatedAt: now,
    }
    await upsertCourseGuarded(tenantId, updated)
    onUpdated(updated)
  }

  async function initECmr() {
    await save(createEmptyECmr())
  }

  async function sign() {
    const next = driverMode
      ? driverSignECmr(doc, signerName)
      : advanceECmr(doc, signerName, 'dispatcher')
    await save(next)
  }

  const canSign = driverMode
    ? doc.status === 'in_transit' || doc.status === 'signed_shipper'
    : doc.status !== 'completed'

  return (
    <div className="space-y-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
      <p className="flex items-center gap-1.5 font-medium">
        <FileSignature className="h-4 w-4 text-primary" />
        e-CMR · {doc.documentId}
      </p>
      <p className="text-xs text-muted-foreground">
        Status:{' '}
        <span className={cn('font-medium', doc.status === 'completed' ? 'text-success' : 'text-foreground')}>
          {E_CMR_STATUS_LABELS[doc.status]}
        </span>
      </p>
      <ul className="space-y-0.5 text-xs text-muted-foreground">
        {doc.shipperSignedBy && <li>Nadawca: {doc.shipperSignedBy}</li>}
        {doc.driverSignedBy && <li>Kierowca: {doc.driverSignedBy}</li>}
        {doc.consigneeSignedBy && <li>Odbiorca: {doc.consigneeSignedBy}</li>}
      </ul>
      {!course.eCmr ? (
        <Button size="sm" variant="secondary" onClick={() => void initECmr()}>
          Utwórz e-CMR
        </Button>
      ) : (
        canSign && (
          <Button size="sm" onClick={() => void sign()}>
            {driverMode ? 'Potwierdź odbiór (kierowca)' : 'Następny krok podpisu'}
          </Button>
        )
      )}
    </div>
  )
}
