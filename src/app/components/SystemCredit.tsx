import { APP_VERSION } from '@/config/version'
import { cn } from '@/lib/utils'

/** Autor systemu — widoczna sygnatura w UI */
export const SYSTEM_AUTHOR = 'Dawid Thai Thanh'

interface SystemCreditProps {
  className?: string
  /** Krótszy wariant w stopce panelu */
  compact?: boolean
}

export function SystemCredit({ className, compact = false }: SystemCreditProps) {
  return (
    <div className={cn('text-center', className)}>
      <p className="text-xs text-muted-foreground">
        {compact ? (
          <>
            System TSL · <span className="font-medium text-foreground/85">{SYSTEM_AUTHOR}</span>
          </>
        ) : (
          <>
            System zarządzania firmą transportową · stworzony przez{' '}
            <span className="font-medium text-foreground/85">{SYSTEM_AUTHOR}</span>
          </>
        )}
      </p>
      {!compact && (
        <p className="mt-0.5 text-[10px] text-muted-foreground/75">TransFlow v{APP_VERSION}</p>
      )}
    </div>
  )
}
