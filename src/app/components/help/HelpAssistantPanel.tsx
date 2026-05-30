import { Button } from '@/app/components/ui/Button'
import { useHelp } from '@/lib/help/help-context'
import { cn } from '@/lib/utils'
import { Lightbulb, MousePointerClick, X } from 'lucide-react'
import { useEffect } from 'react'

export function HelpAssistantPanel() {
  const { open, setOpen, content, markSeen, isNewScreen } = useHelp()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, setOpen])

  if (!open) return null

  function handleClose() {
    markSeen()
    setOpen(false)
  }

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[105] bg-background/60 backdrop-blur-sm"
        aria-label="Zamknij pomoc"
        onClick={handleClose}
      />

      <aside
        role="dialog"
        aria-labelledby="help-panel-title"
        aria-modal="true"
        className={cn(
          'fixed z-[110] flex flex-col bg-background shadow-2xl',
          'inset-x-0 bottom-0 max-h-[88dvh] rounded-t-2xl border-t border-border',
          'md:inset-y-0 md:left-auto md:right-0 md:max-h-none md:w-full md:max-w-md md:rounded-none md:rounded-l-2xl md:border-l md:border-t-0',
        )}
      >
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-4 py-4">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-primary">Asystent pomocy</p>
            <h2 id="help-panel-title" className="mt-0.5 text-lg font-semibold leading-snug">
              {content.title}
            </h2>
            {isNewScreen && (
              <p className="mt-1 text-xs text-muted-foreground">
                Pierwsza wizyta na tym ekranie — poniżej instrukcja krok po kroku.
              </p>
            )}
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={handleClose} aria-label="Zamknij">
            <X className="h-4 w-4" />
          </Button>
        </header>

        <div className="scroll-area flex-1 space-y-5 px-4 py-4">
          <p className="text-sm leading-relaxed text-muted-foreground">{content.summary}</p>

          <ol className="space-y-4">
            {content.steps.map((step, index) => (
              <li key={step.title} className="relative pl-0">
                <div className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <p className="font-medium leading-snug">{step.title}</p>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                    {step.action && (
                      <p className="flex items-start gap-1.5 rounded-lg border border-primary/25 bg-primary/5 px-2.5 py-2 text-xs font-medium text-foreground">
                        <MousePointerClick className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                        <span>{step.action}</span>
                      </p>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>

          {content.tips && content.tips.length > 0 && (
            <div className="rounded-xl border border-warning/30 bg-warning/5 p-3">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-warning">
                <Lightbulb className="h-3.5 w-3.5" />
                Wskazówki
              </p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {content.tips.map((tip) => (
                  <li key={tip} className="flex gap-2">
                    <span className="text-warning">·</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {content.related && content.related.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Powiązane moduły
              </p>
              <ul className="space-y-2">
                {content.related.map((r) => (
                  <li
                    key={r.label}
                    className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm"
                  >
                    <span className="font-medium">{r.label}</span>
                    <span className="text-muted-foreground"> — {r.hint}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <footer className="shrink-0 border-t border-border p-4">
          <Button type="button" className="w-full touch-target" size="lg" onClick={handleClose}>
            Rozumiem — zamknij pomoc
          </Button>
          <p className="mt-2 text-center text-[10px] text-muted-foreground">
            Ikona ? u góry — pomoc zawsze pod ręką
          </p>
        </footer>
      </aside>
    </>
  )
}
