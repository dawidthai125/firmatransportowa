import { ShieldAlert } from 'lucide-react'

interface AccessDeniedProps {
  title?: string
  message?: string
}

/** Widok tylko dla właściciela — dyspozytor / inne role */
export function AccessDenied({
  title = 'Brak dostępu',
  message = 'Ten moduł jest dostępny tylko dla właściciela firmy. Skontaktuj się z administratorem, jeśli potrzebujesz dostępu.',
}: AccessDeniedProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card p-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/15 text-warning">
        <ShieldAlert className="h-6 w-6" />
      </div>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="max-w-md text-sm text-muted-foreground">{message}</p>
    </div>
  )
}

function SessionBootSplash() {
  return (
    <div
      className="flex min-h-dvh flex-col items-center justify-center gap-2 bg-background p-6 text-center"
      role="status"
      aria-live="polite"
    >
      <p className="text-sm text-muted-foreground">Przywracanie sesji…</p>
    </div>
  )
}

export { SessionBootSplash }
