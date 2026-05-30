import type { RepairReport } from '@/lib/domain/repair-report'
import { cn } from '@/lib/utils'
import { Banknote, ClipboardList, Package, Stethoscope } from 'lucide-react'

interface RepairWorkDetailsProps {
  report: RepairReport
  /** Koszt naprawy — tylko właściciel */
  showCost?: boolean
  className?: string
}

/** Opis pracy warsztatu — widoczny dla kierowcy, admina i mechanika */
export function RepairWorkDetails({ report, showCost = false, className }: RepairWorkDetailsProps) {
  const hasWork =
    report.diagnosis?.trim() ||
    report.partsReplaced?.trim() ||
    report.repairSummary?.trim() ||
    (showCost && report.repairCostPln != null && report.repairCostPln > 0)

  if (!hasWork) return null

  return (
    <div className={cn('space-y-2 rounded-lg border border-border/60 bg-muted/20 p-3 text-sm', className)}>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Raport warsztatu</p>
      {report.diagnosis?.trim() && (
        <p className="flex items-start gap-2">
          <Stethoscope className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <span>
            <span className="font-medium">Usterka / diagnoza: </span>
            {report.diagnosis}
          </span>
        </p>
      )}
      {report.partsReplaced?.trim() && (
        <p className="flex items-start gap-2">
          <Package className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <span>
            <span className="font-medium">Wymienione części: </span>
            {report.partsReplaced}
          </span>
        </p>
      )}
      {report.repairSummary?.trim() && (
        <p className="flex items-start gap-2">
          <ClipboardList className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <span>
            <span className="font-medium">Wykonane prace: </span>
            {report.repairSummary}
          </span>
        </p>
      )}
      {showCost && report.repairCostPln != null && report.repairCostPln > 0 && (
        <p className="flex items-center gap-2 border-t border-border/50 pt-2 font-medium text-foreground">
          <Banknote className="h-4 w-4 text-success" />
          Koszt naprawy (wewnętrzny): {report.repairCostPln.toLocaleString('pl-PL')} zł
        </p>
      )}
      {report.completedAt && (
        <p className="text-xs text-muted-foreground">
          Zakończono: {new Date(report.completedAt).toLocaleString('pl-PL')}
        </p>
      )}
    </div>
  )
}
