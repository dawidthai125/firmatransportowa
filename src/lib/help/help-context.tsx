import { HelpAssistantPanel } from '@/app/components/help/HelpAssistantPanel'
import type { AppMode } from '@/lib/auth/session'
import { getPanelHelp } from '@/lib/help/panel-help'
import { hasSeenHelp, markHelpSeen } from '@/lib/help/help-storage'
import type { HelpScreenKey } from '@/lib/help/types'
import { helpKey } from '@/lib/help/types'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

interface HelpContextValue {
  open: boolean
  setOpen: (open: boolean) => void
  toggle: () => void
  content: ReturnType<typeof getPanelHelp>
  screenKey: HelpScreenKey
  isNewScreen: boolean
  markSeen: () => void
}

const HelpContext = createContext<HelpContextValue | null>(null)

interface HelpProviderProps {
  mode: AppMode
  viewId: string
  tenantId: string
  userId: string
  children: ReactNode
}

export function HelpProvider({ mode, viewId, tenantId, userId, children }: HelpProviderProps) {
  const screenKey = helpKey(mode, viewId)
  const content = useMemo(() => getPanelHelp(mode, viewId), [mode, viewId])
  const [open, setOpen] = useState(false)
  const [isNewScreen, setIsNewScreen] = useState(false)

  const markSeen = useCallback(() => {
    markHelpSeen(tenantId, userId, screenKey)
    setIsNewScreen(false)
  }, [tenantId, userId, screenKey])

  useEffect(() => {
    const seen = hasSeenHelp(tenantId, userId, screenKey)
    setIsNewScreen(!seen)
    if (!seen) {
      const t = window.setTimeout(() => setOpen(true), 600)
      return () => window.clearTimeout(t)
    }
    setOpen(false)
    return undefined
  }, [screenKey, tenantId, userId])

  const value = useMemo<HelpContextValue>(
    () => ({
      open,
      setOpen,
      toggle: () => setOpen((v) => !v),
      content,
      screenKey,
      isNewScreen,
      markSeen,
    }),
    [open, content, screenKey, isNewScreen, markSeen],
  )

  return (
    <HelpContext.Provider value={value}>
      {children}
      <HelpAssistantPanel />
    </HelpContext.Provider>
  )
}

export function useHelp(): HelpContextValue {
  const ctx = useContext(HelpContext)
  if (!ctx) {
    throw new Error('useHelp must be used within HelpProvider')
  }
  return ctx
}

/** W shellu poza providerem — nie rzuca */
export function useHelpOptional(): HelpContextValue | null {
  return useContext(HelpContext)
}
