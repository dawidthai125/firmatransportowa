import type { TenantModules } from '@/lib/tenant/types'

export const MODULE_LABELS: Record<keyof TenantModules, string> = {
  fleet: 'Flota pojazdów',
  drivers: 'Kierowcy',
  courses: 'Kursy i zlecenia',
  compliance: 'Zgodność i dokumenty',
  gps: 'Mapa GPS / telematyka',
  loadBoard: 'Giełda ładunków',
  itd: 'ITD i kontrole',
  tachographImport: 'Import tachografu (DDD)',
  repairs: 'Awarie i naprawy',
  courseStatusPing: 'Statusy kursu z kabiny',
  courseDocuments: 'Zdjęcia CMR / POD przy kursie',
  vehicleMargin: 'Marża per auto na pulpicie',
  invoicing: 'Integracja fakturowania',
  rmpdSent: 'Checklista RMPD / SENT',
  driverChat: 'Czat dyspozytor ↔ kierowca',
  driverPayroll: 'Rozliczenie wynagrodzenia kierowcy',
  weeklyPlanner: 'Planowanie tygodnia',
  clientPortal: 'Portal klienta (tracking)',
}

export const MODULE_DESCRIPTIONS: Partial<Record<keyof TenantModules, string>> = {
  courseStatusPing: 'Kierowca zmienia status: załadunek, w trasie, dostarczony — alert na pulpicie.',
  courseDocuments: 'Upload zdjęć listu przewozowego i potwierdzenia dostawy (POD) z telefonu.',
  vehicleMargin: 'Tabela marży i kosztów per pojazd na pulpicie właściciela.',
  invoicing: 'Eksport faktur do CSV, Fakturownia lub wFirma — włącz gdy masz konto u dostawcy.',
  rmpdSent: 'Checklista dokumentów międzynarodowych i daty rejestracji RMPD/SENT.',
  driverChat: 'Wiadomości tekstowe przy aktywnym kursie — bez WhatsAppa.',
  driverPayroll: 'Stawki km/dzień/% frachtu i zestawienie wypłat z raportów kabiny.',
  weeklyPlanner: 'Widok tygodnia: kto, gdzie i kiedy — prosty plan dyspozytora.',
  clientPortal: 'Link read-only dla klienta — status kursu bez logowania do panelu.',
}

/** Moduły opcjonalne — domyślnie wyłączone u nowych tenantów (poza planem trial). */
export const OPTIONAL_MODULE_DEFAULTS: Partial<TenantModules> = {
  invoicing: false,
  driverPayroll: false,
  clientPortal: false,
}
