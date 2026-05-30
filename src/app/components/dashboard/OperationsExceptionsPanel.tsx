import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/Card'
import type { OperationException } from '@/lib/operations/dashboard-exceptions'
import type { AdminView } from '@/lib/navigation'
import { cn } from '@/lib/utils'
import { AlertTriangle, ChevronRight, Info } from 'lucide-react'

interface OperationsExceptionsPanelProps {
  exceptions: OperationException[]
  onNavigate: (view: AdminView) => void
}

const SEVERITY_STYLE = {
  critical: 'border-danger/40 bg-danger/5 text-danger',
  warning: 'border-warning/40 bg-warning/5 text-warning',
  info: 'border-border bg-muted/20 text-muted-foreground',
}

export function OperationsExceptionsPanel({
  exceptions,
  onNavigate,
}: OperationsExceptionsPanelProps) {
  if (exceptions.length === 0) {
    return (
      <Card className="border-success/30 bg-success/5">
        <CardContent className="flex items-center gap-3 p-4 text-sm">
          <Info className="h-5 w-5 shrink-0 text-success" />
          <div>
            <p className="font-medium text-success">Brak pilnych wyjątków na dziś</p>
            <p className="text-muted-foreground">Firma działa — sprawdź pulpit KPI poniżej.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="h-4 w-4 text-warning" />
          Wymaga uwagi dziś ({exceptions.length})
        </CardTitle>
        <CardDescription>
          Reaguj tylko na te punkty — reszta powinna iść automatycznie
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {exceptions.map((ex) => (
          <button
            key={ex.id}
            type="button"
            onClick={() => onNavigate(ex.actionView)}
            className={cn(
              'flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors hover:opacity-90',
              SEVERITY_STYLE[ex.severity],
            )}
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">{ex.title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{ex.description}</p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 opacity-60" />
          </button>
        ))}
      </CardContent>
    </Card>
  )
}
