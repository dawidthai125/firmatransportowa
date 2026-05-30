import type { AppMode } from '@/lib/auth/session'
import type { AdminView, DriverView, MechanicView } from '@/lib/navigation'

export interface HelpStep {
  title: string
  description: string
  /** Gdzie kliknąć — np. „Dolna nawigacja → Awaria” */
  action?: string
}

export interface PanelHelpContent {
  title: string
  summary: string
  steps: HelpStep[]
  tips?: string[]
  /** Powiązane zakładki w nawigacji */
  related?: { label: string; hint: string }[]
}

export type HelpScreenKey =
  | `owner:${AdminView}`
  | `dispatcher:${AdminView}`
  | `driver:${DriverView}`
  | `mechanic:${MechanicView}`

export function helpKey(mode: AppMode, view: string): HelpScreenKey {
  return `${mode}:${view}` as HelpScreenKey
}
