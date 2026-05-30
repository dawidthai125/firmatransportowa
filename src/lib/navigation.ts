export type AdminView =
  | 'dashboard'
  | 'courses'
  | 'reports'
  | 'settlements'
  | 'files'
  | 'automations'
  | 'fleet'
  | 'drivers'
  | 'compliance'
  | 'repairs'
  | 'loads'
  | 'itd'
  | 'tachograph'
  | 'settings'

export type DriverView = 'home' | 'report' | 'courses' | 'issue' | 'itd' | 'profile'

export type MechanicView = 'home'

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
  { id: 'loads', label: 'Giełda ładunków', icon: 'search', module: 'loadBoard' },
  { id: 'reports', label: 'Raporty', icon: 'file-text', module: 'courses' },
  { id: 'settlements', label: 'Rozliczenia', icon: 'calculator', module: 'courses' },
  { id: 'files', label: 'Pliki', icon: 'folder-open', module: 'courses' },
  { id: 'automations', label: 'Automatyzacje', icon: 'bot', module: 'courses' },
  { id: 'fleet', label: 'Flota', icon: 'truck', module: 'fleet' },
  { id: 'repairs', label: 'Awarie', icon: 'wrench', module: 'repairs' },
  { id: 'itd', label: 'ITD', icon: 'shield-alert', module: 'itd' },
  { id: 'drivers', label: 'Kierowcy', icon: 'users', module: 'drivers' },
  { id: 'compliance', label: 'Zgodność', icon: 'shield-check', module: 'compliance' },
  { id: 'tachograph', label: 'Tachograf', icon: 'hard-drive', module: 'tachographImport' },
  { id: 'settings', label: 'Firma', icon: 'settings' },
]

export const DISPATCHER_NAV: NavItem<AdminView>[] = [
  { id: 'dashboard', label: 'Pulpit', icon: 'layout-dashboard' },
  { id: 'courses', label: 'Kursy', icon: 'route', module: 'courses' },
  { id: 'loads', label: 'Giełda ładunków', icon: 'search', module: 'loadBoard' },
  { id: 'reports', label: 'Raporty', icon: 'file-text', module: 'courses' },
  { id: 'settlements', label: 'Rozliczenia', icon: 'calculator', module: 'courses' },
  { id: 'files', label: 'Pliki', icon: 'folder-open', module: 'courses' },
  { id: 'automations', label: 'Automatyzacje', icon: 'bot', module: 'courses' },
  { id: 'fleet', label: 'Flota', icon: 'truck', module: 'fleet' },
  { id: 'repairs', label: 'Awarie', icon: 'wrench', module: 'repairs' },
  { id: 'itd', label: 'ITD', icon: 'shield-alert', module: 'itd' },
  { id: 'drivers', label: 'Kierowcy', icon: 'users', module: 'drivers' },
]

export const DRIVER_NAV: NavItem<DriverView>[] = [
  { id: 'home', label: 'Start', icon: 'home' },
  { id: 'issue', label: 'Awaria', icon: 'wrench' },
  { id: 'itd', label: 'ITD', icon: 'shield-alert', module: 'itd' },
  { id: 'courses', label: 'Kursy', icon: 'route' },
  { id: 'report', label: 'Raport', icon: 'file-text' },
  { id: 'profile', label: 'Profil', icon: 'user' },
]

export const MECHANIC_NAV: NavItem<MechanicView>[] = [{ id: 'home', label: 'Naprawy', icon: 'wrench' }]

export const VIEW_TITLES: Record<AdminView, string> = {
  dashboard: 'Pulpit',
  courses: 'Kursy i zlecenia',
  loads: 'Giełda ładunków',
  reports: 'Raporty dzienne',
  settlements: 'Rozliczenia i czas jazdy',
  files: 'Pliki i dokumenty',
  automations: 'Automatyzacje',
  fleet: 'Flota pojazdów',
  repairs: 'Awarie i naprawy',
  itd: 'ITD i kontrole drogowe',
  drivers: 'Kierowcy',
  compliance: 'Zgodność i dokumenty',
  tachograph: 'Import tachografu (DDD)',
  settings: 'Ustawienia firmy',
}
