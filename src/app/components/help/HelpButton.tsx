import { Button } from '@/app/components/ui/Button'
import { useHelp } from '@/lib/help/help-context'
import { cn } from '@/lib/utils'
import { CircleHelp } from 'lucide-react'

interface HelpButtonProps {
  className?: string
}

export function HelpButton({ className }: HelpButtonProps) {
  const { toggle, isNewScreen } = useHelp()

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label="Pomoc — instrukcja krok po kroku"
      className={cn('relative touch-target', className)}
    >
      <CircleHelp className="h-4 w-4" />
      {isNewScreen && (
        <span
          className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary ring-2 ring-background"
          aria-hidden
        />
      )}
    </Button>
  )
}
