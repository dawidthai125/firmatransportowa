import { Button } from '@/app/components/ui/Button'
import { AlertTriangle } from 'lucide-react'

interface EditConflictBannerProps {
  onReload: () => void
  onForceSave?: () => void
  className?: string
}

/** Proste ostrzeżenie — bez żargonu technicznego */
export function EditConflictBanner({ onReload, onForceSave, className }: EditConflictBannerProps) {
  return (
    <div
      className={`flex flex-col gap-2 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm sm:flex-row sm:items-center sm:justify-between ${className ?? ''}`}
      role="alert"
    >
      <p className="flex items-start gap-2 text-warning">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          <strong>Ktoś inny zmienił ten wpis.</strong> Odśwież dane przed zapisem, żeby nie
          nadpisać nowszej wersji.
        </span>
      </p>
      <div className="flex shrink-0 gap-2">
        <Button type="button" size="sm" variant="secondary" onClick={onReload}>
          Odśwież dane
        </Button>
        {onForceSave && (
          <Button type="button" size="sm" variant="outline" onClick={onForceSave}>
            Zapisz mimo to
          </Button>
        )}
      </div>
    </div>
  )
}
