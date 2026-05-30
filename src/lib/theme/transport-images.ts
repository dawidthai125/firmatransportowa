import type { UserRole } from '@/lib/auth/session'

/** Zdjęcia z Unsplash (weryfikowane — stare ID zwracały 404) */
export const TRANSPORT_HERO_IMAGE =
  'https://images.unsplash.com/photo-1670509295484-df0c2512fec4?auto=format&fit=crop&w=1920&q=80'

export const TRANSPORT_PORT_IMAGE =
  'https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=1920&q=80'

export interface PanelTheme {
  role: UserRole
  image: string
  imageAlt: string
  tagline: string
  badge: string
  /** Tailwind gradient overlay on photos */
  overlayClass: string
  accentClass: string
  glowClass: string
}

export const PANEL_THEMES: Record<UserRole, PanelTheme> = {
  owner: {
    role: 'owner',
    image:
      'https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Flota ciężarówek przy terminalu logistycznym',
    tagline: 'Marże, flota i dokumenty ITD — bez rozproszenia w wielu plikach',
    badge: 'Centrum dowodzenia TSL',
    overlayClass: 'from-primary/90 via-primary/40 to-background/95',
    accentClass: 'text-primary',
    glowClass: 'shadow-primary/25',
  },
  dispatcher: {
    role: 'dispatcher',
    image:
      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Magazyn logistyczny i sortownia przesyłek',
    tagline: 'Planuj kursy, kierowców i reaguj na awarie',
    badge: 'Dyspozytornia · logistyka',
    overlayClass: 'from-accent/90 via-accent/50 to-background/95',
    accentClass: 'text-accent-foreground',
    glowClass: 'shadow-accent-foreground/20',
  },
  driver: {
    role: 'driver',
    image:
      'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Ciężarówka na trasie międzynarodowej',
    tagline: 'Raport z kabiny w minutę — km, paliwo, myto, koniec zmiany',
    badge: 'Kabina · trasa · CMR',
    overlayClass: 'from-success/85 via-emerald-900/50 to-background/95',
    accentClass: 'text-success',
    glowClass: 'shadow-success/25',
  },
  mechanic: {
    role: 'mechanic',
    image:
      'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Warsztat naprawy pojazdów ciężarowych',
    tagline: 'Naprawy naczep, silników i terminów serwisu',
    badge: 'Warsztat · serwis floty',
    overlayClass: 'from-warning/90 via-amber-900/45 to-background/95',
    accentClass: 'text-warning',
    glowClass: 'shadow-warning/25',
  },
}

export function getPanelTheme(role: UserRole): PanelTheme {
  return PANEL_THEMES[role]
}
