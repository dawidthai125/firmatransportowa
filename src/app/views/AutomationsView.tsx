import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/Card'
import {
  loadAutomationSettings,
  saveAutomationSettings,
  toggleAutomationRule,
  type AutomationRule,
} from '@/lib/automation/rules'
import { runScheduledAutomations } from '@/lib/automation/scheduler'
import { cn } from '@/lib/utils'
import { Bot, Play, Zap } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

interface AutomationsViewProps {
  tenantId: string
  tenantSlug: string
  tenantName: string
}

export function AutomationsView({ tenantId, tenantSlug, tenantName }: AutomationsViewProps) {
  const [rules, setRules] = useState<AutomationRule[]>([])
  const [running, setRunning] = useState(false)

  const refresh = useCallback(() => {
    setRules(loadAutomationSettings(tenantId).rules)
  }, [tenantId])

  useEffect(() => {
    refresh()
  }, [refresh])

  function toggle(ruleId: string, enabled: boolean) {
    setRules(toggleAutomationRule(tenantId, ruleId, enabled).rules)
  }

  async function runNow() {
    setRunning(true)
    try {
      const settings = loadAutomationSettings(tenantId)
      saveAutomationSettings(tenantId, { ...settings, lastDailyRun: undefined, lastWeeklyRun: undefined })
      await runScheduledAutomations({ tenantId, tenantSlug, tenantName })
      refresh()
    } finally {
      setRunning(false)
    }
  }

  const enabledCount = rules.filter((r) => r.enabled).length

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Automatyzacje</h1>
          <p className="text-sm text-muted-foreground">
            {enabledCount}/{rules.length} reguł aktywnych · działają w tle bez Twojej interwencji
          </p>
        </div>
        <button
          type="button"
          onClick={() => void runNow()}
          disabled={running}
          className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
        >
          <Play className="h-4 w-4" />
          {running ? 'Uruchamiam…' : 'Uruchom harmonogram teraz'}
        </button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bot className="h-4 w-4 text-primary" />
            Jak to działa
          </CardTitle>
          <CardDescription>
            Zdarzenia (raport kierowcy, kurs międzynarodowy, poniedziałek rano) uruchamiają reguły.
            Powiadomienia w dzwonku · eksporty w Pliki · sync do chmury.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="space-y-2">
        {rules.map((rule) => (
          <Card key={rule.id} className={cn(!rule.enabled && 'opacity-60')}>
            <CardContent className="flex flex-wrap items-center gap-3 p-4">
              <Zap className={cn('h-5 w-5 shrink-0', rule.enabled ? 'text-warning' : 'text-muted-foreground')} />
              <div className="min-w-0 flex-1">
                <p className="font-medium">{rule.name}</p>
                <p className="text-xs text-muted-foreground">{rule.description}</p>
                <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                  Trigger: {rule.trigger} · Akcje: {rule.actions.join(', ')}
                </p>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={rule.enabled}
                  onChange={(e) => toggle(rule.id, e.target.checked)}
                  className="h-4 w-4 rounded border-border"
                />
                Włączona
              </label>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Pełna architektura (Supabase cron, Cursor Automations, webhooki):{' '}
        <code className="rounded bg-muted px-1">docs/AUTOMATION.md</code>
      </p>
    </div>
  )
}
