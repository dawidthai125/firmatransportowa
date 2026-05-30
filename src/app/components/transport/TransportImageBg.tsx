import { cn } from '@/lib/utils'
import { useState, type ReactNode } from 'react'

interface TransportImageBgProps {
  src: string
  /** Opis dla czytników ekranu — tło dekoracyjne, nie wyświetlany przy błędzie ładowania */
  alt?: string
  overlayClass?: string
  className?: string
  children?: ReactNode
  /** fixed | absolute cover layer */
  position?: 'fixed' | 'absolute'
}

export function TransportImageBg({
  src,
  alt = '',
  overlayClass = 'from-background/80 via-background/90 to-background',
  className,
  children,
  position = 'fixed',
}: TransportImageBgProps) {
  const [failed, setFailed] = useState(false)

  return (
    <div className={cn('inset-0 -z-10 overflow-hidden', position, className)}>
      {!failed && (
        <img
          src={src}
          alt={alt}
          aria-hidden={alt ? undefined : true}
          className="h-full w-full object-cover opacity-35"
          loading="eager"
          decoding="async"
          onError={() => setFailed(true)}
        />
      )}
      <div className={cn('absolute inset-0 bg-gradient-to-b', overlayClass)} aria-hidden />
      {children}
    </div>
  )
}
