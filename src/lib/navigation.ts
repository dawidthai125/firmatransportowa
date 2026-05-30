export type AdminView =
  | 'dashboard'
  | 'courses'
  | 'reports'
  | 'settlements'
  | 'fleet'
  | 'drivers'
  | 'compliance'
  | 'settings'

export type DriverView = 'home' | 'report' | 'courses' | 'profile'

export interface NavItem<T extends string = string> {
  id: T
  label: string
  icon: string
  /** Ukryj gdy moduł wyłączony w planie */
  module?: keyof import('@/lib/tenant/types').TenantModules
}

export const OWNER_NAV: NavItem<AdminView>[] = [
  { id: 'dashboard', label: 'Pulpit', icon: 'layout-dashboard' },
  { id: 'courses', label: 'Kursy', icon: 'route', module: 'courses' },
  { id: 'reports', label: 'Raporty', icon: 'file-text', module: 'courses' },
  { id: 'settlements', label: 'Rozliczenia', icon: 'calculator', module: 'courses' },
  { id: 'fleet', label: 'Flota', icon: 'truck', module: 'fleet' },
  { id: 'drivers', label: 'Kierowcy', icon: 'users', module: 'drivers' },
  { id: 'compliance', label: 'Zgodność', icon: 'shield-check', module: 'compliance' },
  { id: 'settings', label: 'Firma', icon: 'settings' },
]

export const DISPATCHER_NAV: NavItem<AdminView>[] = [
  { id: 'dashboard', label: 'Pulpit', icon: 'layout-dashboard' },
  { id: 'courses', label: 'Kursy', icon: 'route', module: 'courses' },
  { id: 'reports', label: 'Raporty', icon: 'file-text', module: 'courses' },
  { id: 'settlements', label: 'Rozliczenia', icon: 'calculator', module: 'courses' },
  { id: 'fleet', label: 'Flota', icon: 'truck', module: 'fleet' },
  { id: 'drivers', label: 'Kierowcy', icon: 'users', module: 'drivers' },
]

export const DRIVER_NAV: NavItem<DriverView>[] = [
  { id: 'home', label: 'Start', icon: 'home' },
  { id: 'courses', label: 'Kursy', icon: 'route' },
  { id: 'report', label: 'Raport', icon: 'file-text' },
  { id: 'profile', label: 'Profil', icon: 'user' },
]

export const VIEW_TITLES: Record<AdminView, string> = {
  dashboard: 'Pulpit',
  courses: 'Kursy i zlecenia',
  reports: 'Raporty dzienne',
  settlements: 'Rozliczenia i czas jazdy',
  fleet: 'Flota pojazdów',
  drivers: 'Kierowcy',
  compliance: 'Zgodność i dokumenty',
  settings: 'Ustawienia firmy',
}
