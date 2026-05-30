import { cn } from '@/lib/utils'
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
  type ReactNode,
  type RefObject,
} from 'react'
import { createPortal } from 'react-dom'

interface HeaderPopoverProps {
  open: boolean
  onClose: () => void
  anchorRef: RefObject<HTMLElement | null>
  children: ReactNode
  /** Klasy na panel (bez pozycjonowania) */
  panelClassName?: string
  widthClass?: string
  ariaLabel?: string
}

/**
 * Dropdown z nagłówka — render przez portal + fixed, żeby nie chował się pod banerem / scroll-area.
 */
export function HeaderPopover({
  open,
  onClose,
  anchorRef,
  children,
  panelClassName,
  widthClass = 'w-80',
  ariaLabel = 'Panel',
}: HeaderPopoverProps) {
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null)

  const updatePos = useCallback(() => {
    const el = anchorRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    setPos({
      top: rect.bottom + 4,
      right: Math.max(8, window.innerWidth - rect.right),
    })
  }, [anchorRef])

  useLayoutEffect(() => {
    if (!open) {
      setPos(null)
      return
    }
    updatePos()
    window.addEventListener('resize', updatePos)
    window.addEventListener('scroll', updatePos, true)
    return () => {
      window.removeEventListener('resize', updatePos)
      window.removeEventListener('scroll', updatePos, true)
    }
  }, [open, updatePos])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open || !pos) return null

  return createPortal(
    <>
      <div className="fixed inset-0 z-[110]" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-label={ariaLabel}
        className={cn('fixed z-[115]', widthClass, 'max-w-[calc(100vw-1rem)]', panelClassName)}
        style={{ top: pos.top, right: pos.right }}
      >
        {children}
      </div>
    </>,
    document.body,
  )
}
