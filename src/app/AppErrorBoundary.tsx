import { Button } from '@/app/components/ui/Button'
import { AlertTriangle } from 'lucide-react'
import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/** Łapie błędy renderu — zamiast pustego ekranu pokazuje komunikat i opcję odświeżenia */
export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[TransFlow] UI error', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background p-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-danger/15 text-danger">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h1 className="text-lg font-semibold text-foreground">Coś poszło nie tak</h1>
          <p className="max-w-md text-sm text-muted-foreground">
            Aplikacja napotkała błąd. Odśwież stronę — dane są zapisane lokalnie i w chmurze.
          </p>
          <p className="max-w-md truncate text-xs text-muted-foreground/80">
            {this.state.error.message}
          </p>
          <Button type="button" onClick={() => window.location.reload()}>
            Odśwież stronę
          </Button>
        </div>
      )
    }
    return this.props.children
  }
}
