import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface TransportImageBgProps {
  src: string
  alt: string
  overlayClass?: string
  className?: string
  children?: ReactNode
  /** fixed | absolute cover layer */
  position?: 'fixed' | 'absolute'
}

export function TransportImageBg({
  src,
  alt,
  overlayClass = 'from-background/80 via-background/90 to-background',
  className,
  children,
  position = 'fixed',
}: TransportImageBgProps) {
  return (
    <div className={cn('inset-0 -z-10 overflow-hidden', position, className)}>
      <img
        src={src}
        alt={alt}
        className="h-full w-full object-cover opacity-35"
        loading="eager"
        decoding="async"
      />
      <div className={cn('absolute inset-0 bg-gradient-to-b', overlayClass)} aria-hidden />
      {children}
    </div>
  )
}
