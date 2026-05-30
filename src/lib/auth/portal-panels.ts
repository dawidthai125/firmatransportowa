import type { UserRole } from '@/lib/auth/session'
import { Headset, LayoutDashboard, Truck, Wrench, type LucideIcon } from 'lucide-react'

export interface PortalPanel {
  role: UserRole
  title: string
  description: string
  benefit: string
  icon: LucideIcon
  tileClass: string
  iconClass: string
}

export const PORTAL_PANELS: PortalPanel[] = [
  {
    role: 'owner',
    title: 'Panel właściciela',
    description: 'Widzisz całą firmę: flotę, marże, dokumenty i kierowców',
    benefit: 'Decyzje biznesowe bez grzebania w Excelu',
    icon: LayoutDashboard,
    tileClass:
      'border-primary/25 bg-gradient-to-br from-primary/10 via-card to-card hover:border-primary/50 hover:shadow-primary/10',
    iconClass: 'bg-primary/15 text-primary',
  },
  {
    role: 'dispatcher',
    title: 'Panel dyspozytora',
    description: 'Planujesz kursy, pilnujesz czasu jazdy i awarii',
    benefit: 'Mniej telefonów — status kursu zawsze aktualny',
    icon: Headset,
    tileClass:
      'border-accent-foreground/25 bg-gradient-to-br from-accent/40 via-card to-card hover:border-accent-foreground/50 hover:shadow-accent/20',
    iconClass: 'bg-accent text-accent-foreground',
  },
  {
    role: 'driver',
    title: 'Panel kierowcy',
    description: 'Raport dnia, kurs, myto i awaria — wszystko z kabiny',
    benefit: 'Koniec z papierowymi raportami po powrocie z trasy',
    icon: Truck,
    tileClass:
      'border-success/25 bg-gradient-to-br from-success/10 via-card to-card hover:border-success/50 hover:shadow-success/10',
    iconClass: 'bg-success/15 text-success',
  },
  {
    role: 'mechanic',
    title: 'Panel mechanika',
    description: 'Naprawy ciężarówek i naczep — terminy i zdjęcia od kierowcy',
    benefit: 'Szybsza reakcja — flota szybciej wraca na trasę',
    icon: Wrench,
    tileClass:
      'border-warning/25 bg-gradient-to-br from-warning/10 via-card to-card hover:border-warning/50 hover:shadow-warning/10',
    iconClass: 'bg-warning/15 text-warning',
  },
]

export const DEMO_EMAIL_BY_ROLE: Record<UserRole, string> = {
  owner: 'wlasciciel@demo-trans.pl',
  dispatcher: 'dyspozytor@demo-trans.pl',
  driver: 'jan.kowalski@demo-trans.pl',
  mechanic: 'mechanik@demo-trans.pl',
}
