/**
 * REJESTR FUNKCJI APLIKACJI — single source of truth
 *
 * Aktualizuj ten plik przy każdej nowej funkcji, integracji lub usunięciu modułu.
 * Ten sam rejestr zasila:
 * - widok admina „Funkcje” (FeaturesView)
 * - dokumentację docs/SYSTEM-OVERVIEW.md (sekcja odniesień)
 *
 * Checklist developera / agenta AI:
 * 1. Dodaj wpis poniżej (status, opis, codePaths, dataKeys)
 * 2. Jeśli nowy widok → navigation.ts + App.tsx + panel-help.ts
 * 3. Jeśli nowe dane → TenantDataKey w types.ts + merge-strategy
 * 4. Uruchom npm run build
 */
import type { AdminView, DriverView } from '@/lib/navigation'
import type { TenantDataKey, TenantModules } from '@/lib/tenant/types'

export const APP_FEATURES_CATALOG_VERSION = '0.17.6'

export type AppFeatureArea = 'admin' | 'driver' | 'mechanic' | 'platform' | 'integration'

export type AppFeatureStatus = 'live' | 'beta' | 'planned'

export type AppFeatureRole = 'owner' | 'dispatcher' | 'driver' | 'mechanic'

export interface AppFeature {
  id: string
  title: string
  description: string
  area: AppFeatureArea
  roles: AppFeatureRole[]
  status: AppFeatureStatus
  /** Widok admina — do nawigacji z katalogu */
  adminView?: AdminView
  driverView?: DriverView
  /** Moduł abonamentowy — ukryty gdy wyłączony u tenant */
  module?: keyof TenantModules
  codePaths?: string[]
  dataKeys?: TenantDataKey[]
  sinceVersion?: string
}

export const APP_FEATURE_AREA_LABELS: Record<AppFeatureArea, string> = {
  admin: 'Panel właściciela / dyspozytora',
  driver: 'Panel kierowcy (mobile PWA)',
  mechanic: 'Panel warsztatu',
  platform: 'Platforma i infrastruktura',
  integration: 'Integracje zewnętrzne (API)',
}

export const APP_FEATURE_STATUS_LABELS: Record<AppFeatureStatus, string> = {
  live: 'Dostępne',
  beta: 'Beta / demo API',
  planned: 'Planowane',
}

/** Pełny katalog — sortowanie w UI po area + title */
export const APP_FEATURES: AppFeature[] = [
  // —— Admin ——
  {
    id: 'admin-dashboard',
    title: 'Pulpit operacyjny',
    description:
      'KPI, alerty „wymaga uwagi dziś”, wyjątki (awarie, brak raportów, dokumenty, GPS), mapa floty i skróty do modułów.',
    area: 'admin',
    roles: ['owner', 'dispatcher'],
    status: 'live',
    adminView: 'dashboard',
    codePaths: ['src/app/views/DashboardView.tsx', 'src/lib/operations/dashboard-exceptions.ts'],
    sinceVersion: '0.10',
  },
  {
    id: 'admin-courses',
    title: 'Kursy i zlecenia',
    description:
      'Tworzenie tras A→B, przypisanie kierowcy i pojazdu, statusy, fracht, koszty plan vs rzeczywiste z raportów kabiny, marża.',
    area: 'admin',
    roles: ['owner', 'dispatcher'],
    status: 'live',
    adminView: 'courses',
    module: 'courses',
    dataKeys: ['courses'],
    codePaths: ['src/app/views/CoursesView.tsx', 'src/lib/domain/courses-store.ts'],
    sinceVersion: '0.2',
  },
  {
    id: 'admin-loads',
    title: 'Giełda ładunków',
    description:
      'Agregacja ofert frachtu z wielu platform, filtry TSL (ADR, kabotaż, korytarz, typ nadwozia), zapis ofert, konwersja oferty → kurs, import leadu e-mail.',
    area: 'admin',
    roles: ['owner', 'dispatcher'],
    status: 'live',
    adminView: 'loads',
    module: 'loadBoard',
    dataKeys: ['freight-offers', 'freight-board', 'freight-connectors'],
    codePaths: ['src/app/views/FreightBoardView.tsx', 'src/lib/domain/freight-connectors.ts'],
    sinceVersion: '0.12',
  },
  {
    id: 'admin-reports',
    title: 'Raporty dzienne kierowców',
    description:
      'Przegląd raportów km, paliwa, myta i postojów z kabiny. Weryfikacja i kontrola rozliczeń operacyjnych.',
    area: 'admin',
    roles: ['owner', 'dispatcher'],
    status: 'live',
    adminView: 'reports',
    module: 'courses',
    dataKeys: ['daily-reports'],
    codePaths: ['src/app/views/DailyReportsView.tsx'],
    sinceVersion: '0.2',
  },
  {
    id: 'admin-settlements',
    title: 'Rozliczenia i czas jazdy',
    description:
      'Marże, koszty kursów, zestawienia rozliczeniowe i analiza czasu jazdy w kontekście przepisów 561/2006.',
    area: 'admin',
    roles: ['owner'],
    status: 'live',
    adminView: 'settlements',
    module: 'courses',
    codePaths: ['src/app/views/SettlementsView.tsx'],
    sinceVersion: '0.8',
  },
  {
    id: 'admin-files',
    title: 'Pliki i dokumenty',
    description:
      'Magazyn dokumentów firmy i kursów — CMR, faktury, zdjęcia. Podgląd w aplikacji (PDF, obrazy).',
    area: 'admin',
    roles: ['owner'],
    status: 'live',
    adminView: 'files',
    module: 'courses',
    dataKeys: ['files'],
    codePaths: ['src/app/views/FilesView.tsx', 'docs/FILES-PREVIEW.md'],
    sinceVersion: '0.9',
  },
  {
    id: 'admin-automations',
    title: 'Automatyzacje',
    description:
      'Reguły czasowe (np. przypomnienia o raporcie, alerty dokumentów). Harmonogram i powiadomienia w panelu.',
    area: 'admin',
    roles: ['owner'],
    status: 'live',
    adminView: 'automations',
    module: 'courses',
    dataKeys: ['automation'],
    codePaths: ['src/app/views/AutomationsView.tsx', 'src/lib/automation/scheduler.ts', 'docs/AUTOMATION.md'],
    sinceVersion: '0.11',
  },
  {
    id: 'admin-fleet',
    title: 'Flota pojazdów',
    description:
      'Kartoteka ciągników i naczep, statusy, powiązanie z kursami/kierowcami, karty floty z GPS, mini-mapy, alerty postoju >3h.',
    area: 'admin',
    roles: ['owner', 'dispatcher'],
    status: 'live',
    adminView: 'fleet',
    module: 'fleet',
    dataKeys: ['vehicles', 'fleet-positions', 'fleet-telematics-connectors'],
    codePaths: ['src/app/views/FleetView.tsx', 'src/app/components/fleet/'],
    sinceVersion: '0.15',
  },
  {
    id: 'admin-repairs',
    title: 'Awarie i naprawy',
    description:
      'Zgłoszenia od kierowców, workflow weryfikacji, raport warsztatu (diagnoza, części, opis). Koszt naprawy — tylko właściciel.',
    area: 'admin',
    roles: ['owner', 'dispatcher'],
    status: 'live',
    adminView: 'repairs',
    module: 'repairs',
    dataKeys: ['repair-reports', 'settings'],
    codePaths: ['src/app/views/RepairsView.tsx', 'src/app/views/DriverIssueView.tsx'],
    sinceVersion: '0.7',
  },
  {
    id: 'admin-itd',
    title: 'ITD — kontrole drogowe',
    description:
      'Instrukcje dla kierowców, mapa kontroli, checklisty dokumentów przy kontroli krajowej i międzynarodowej.',
    area: 'admin',
    roles: ['owner', 'dispatcher'],
    status: 'live',
    adminView: 'itd',
    module: 'itd',
    dataKeys: ['itd'],
    codePaths: ['src/app/views/ItdAdminView.tsx', 'src/app/views/DriverItdView.tsx'],
    sinceVersion: '0.13',
  },
  {
    id: 'admin-drivers',
    title: 'Kierowcy',
    description:
      'Kartoteka kierowców, uprawnienia, kontakt, przypisania do pojazdów i kursów, dane do raportów i ITD.',
    area: 'admin',
    roles: ['owner', 'dispatcher'],
    status: 'live',
    adminView: 'drivers',
    module: 'drivers',
    dataKeys: ['drivers'],
    codePaths: ['src/app/views/DriversView.tsx'],
    sinceVersion: '0.2',
  },
  {
    id: 'admin-compliance',
    title: 'Zgodność i dokumenty firmy',
    description:
      'Licencje, CKZ, zezwolenia przewoźnika, alerty ważności — przygotowanie do kontroli ITD i za granicą.',
    area: 'admin',
    roles: ['owner'],
    status: 'live',
    adminView: 'compliance',
    module: 'compliance',
    dataKeys: ['compliance-alerts', 'settings'],
    codePaths: ['src/app/views/ComplianceView.tsx', 'src/lib/domain/compliance.ts'],
    sinceVersion: '0.6',
  },
  {
    id: 'admin-tachograph',
    title: 'Import tachografu (DDD)',
    description:
      'Import plików .ddd, synchronizacja z API tachografu (connector w ustawieniach), dane czasu jazdy i odpoczynku.',
    area: 'admin',
    roles: ['owner'],
    status: 'live',
    adminView: 'tachograph',
    module: 'tachographImport',
    dataKeys: ['tachograph', 'tachograph-connectors'],
    codePaths: ['src/app/views/TachographView.tsx', 'supabase/functions/transflow-api/tachograph_sync.ts'],
    sinceVersion: '0.17',
  },
  {
    id: 'admin-settings',
    title: 'Ustawienia firmy',
    description:
      'Dokumenty firmy, mechanicy, weryfikatorzy awarii, telematyka floty, connector tachografu, branding PWA (nazwa na pulpicie telefonu).',
    area: 'admin',
    roles: ['owner'],
    status: 'live',
    adminView: 'settings',
    dataKeys: ['settings', 'tachograph-connectors', 'fleet-telematics-connectors'],
    codePaths: ['src/app/views/SettingsView.tsx', 'src/lib/domain/tenant-settings.ts'],
    sinceVersion: '0.1',
  },
  {
    id: 'admin-features-catalog',
    title: 'Katalog funkcji aplikacji',
    description:
      'Pełna lista możliwości systemu z opisami — ten ekran. Źródło danych: src/lib/catalog/app-features.ts.',
    area: 'admin',
    roles: ['owner', 'dispatcher'],
    status: 'live',
    adminView: 'features',
    codePaths: ['src/app/views/FeaturesView.tsx', 'src/lib/catalog/app-features.ts'],
    sinceVersion: '0.17.3',
  },

  // —— Kierowca ——
  {
    id: 'driver-home',
    title: 'Start kierowcy',
    description:
      'Aktywny kurs, skróty do raportu i awarii, powiadomienia, przypomnienia o raporcie dziennym.',
    area: 'driver',
    roles: ['driver'],
    status: 'live',
    driverView: 'home',
    codePaths: ['src/app/views/DriverViews.tsx'],
    sinceVersion: '0.3',
  },
  {
    id: 'driver-issue',
    title: 'Zgłoszenie awarii',
    description: 'Formularz usterki pojazdu z kabiny — trafia do modułu Awarie w biurze.',
    area: 'driver',
    roles: ['driver'],
    status: 'live',
    driverView: 'issue',
    module: 'repairs',
    dataKeys: ['repair-reports'],
    codePaths: ['src/app/views/DriverIssueView.tsx'],
    sinceVersion: '0.7',
  },
  {
    id: 'driver-itd',
    title: 'ITD w kabinie',
    description: 'Checklisty dokumentów i wskazówki przy kontroli drogowej — wersja mobilna.',
    area: 'driver',
    roles: ['driver'],
    status: 'live',
    driverView: 'itd',
    module: 'itd',
    codePaths: ['src/app/views/DriverItdView.tsx'],
    sinceVersion: '0.13',
  },
  {
    id: 'driver-courses',
    title: 'Moje kursy',
    description: 'Lista przypisanych tras, status, szczegóły załadunku i rozładunku.',
    area: 'driver',
    roles: ['driver'],
    status: 'live',
    driverView: 'courses',
    module: 'courses',
    dataKeys: ['courses'],
    sinceVersion: '0.2',
  },
  {
    id: 'driver-report',
    title: 'Raport dzienny',
    description: 'Km, paliwo, myto, postoje — raport z telefonu (PWA), sync z biurem.',
    area: 'driver',
    roles: ['driver'],
    status: 'live',
    driverView: 'report',
    module: 'courses',
    dataKeys: ['daily-reports'],
    codePaths: ['src/app/views/DriverViews.tsx'],
    sinceVersion: '0.2',
  },
  {
    id: 'driver-profile',
    title: 'Profil kierowcy',
    description: 'Dane konta, pojazd, kontakt z dyspozytorem, powiadomienia push, wylogowanie.',
    area: 'driver',
    roles: ['driver'],
    status: 'live',
    driverView: 'profile',
    codePaths: ['src/app/views/DriverViews.tsx'],
    sinceVersion: '0.4',
  },

  // —— Mechanik ——
  {
    id: 'mechanic-repairs',
    title: 'Zlecenia napraw',
    description:
      'Status naprawy (w trakcie / naprawiony), diagnoza, wymienione części, opis prac — widoczne u kierowcy i w biurze. Koszt naprawy wpisuje mechanik — widzi tylko właściciel.',
    area: 'mechanic',
    roles: ['mechanic'],
    status: 'live',
    dataKeys: ['repair-reports'],
    codePaths: ['src/app/views/MechanicViews.tsx'],
    sinceVersion: '0.7',
  },

  // —— Platforma ——
  {
    id: 'platform-multitenant',
    title: 'Multi-tenant SaaS',
    description:
      'Każda firma transportowa to osobny tenant (kod logowania, izolacja danych, moduły wg abonamentu).',
    area: 'platform',
    roles: ['owner', 'dispatcher', 'driver', 'mechanic'],
    status: 'live',
    codePaths: ['src/lib/tenant/', 'docs/ARCHITECTURE.md'],
    sinceVersion: '0.1',
  },
  {
    id: 'platform-portal',
    title: 'Portal i role',
    description:
      'Strona główna z wyborem panelu (właściciel, dyspozytor, kierowca, mechanik), branding Tajski-Trans, PWA install banner.',
    area: 'platform',
    roles: ['owner', 'dispatcher', 'driver', 'mechanic'],
    status: 'live',
    codePaths: ['src/app/PortalHome.tsx', 'src/app/LoginScreen.tsx', 'src/lib/auth/'],
    sinceVersion: '0.1',
  },
  {
    id: 'platform-pwa',
    title: 'PWA — aplikacja na telefon',
    description:
      'Instalacja na ekran główny (Android/iOS), offline service worker, konfigurowalna nazwa skrótu w ustawieniach firmy.',
    area: 'platform',
    roles: ['owner', 'driver'],
    status: 'live',
    codePaths: ['src/lib/pwa/', 'vite.config.ts'],
    sinceVersion: '0.17.2',
  },
  {
    id: 'platform-cloud-sync',
    title: 'Synchronizacja chmura',
    description:
      'Offline-first localStorage + sync Supabase KV (Edge transflow-api), merge per klucz danych.',
    area: 'platform',
    roles: ['owner', 'dispatcher', 'driver'],
    status: 'live',
    codePaths: ['src/lib/cloud-sync.ts', 'docs/SUPABASE-ARCHITECTURE.md'],
    sinceVersion: '0.4',
  },
  {
    id: 'platform-help',
    title: 'Pomoc kontekstowa',
    description: 'Przycisk „?” z instrukcją krok po kroku dla każdego widoku — rejestr panel-help.ts.',
    area: 'platform',
    roles: ['owner', 'dispatcher', 'driver', 'mechanic'],
    status: 'live',
    codePaths: ['src/lib/help/panel-help.ts'],
    sinceVersion: '0.14',
  },
  {
    id: 'platform-mobile-admin-nav',
    title: 'Menu mobilne admina',
    description:
      'Dolna belka ze skrótami + pełne menu wysuwane (hamburger) — nawigacja na telefonie/tablecie.',
    area: 'platform',
    roles: ['owner', 'dispatcher'],
    status: 'live',
    codePaths: ['src/app/components/AdminMobileNav.tsx', 'src/app/shells/AdminShell.tsx'],
    sinceVersion: '0.17.3',
  },

  // —— Integracje ——
  {
    id: 'int-freight-trans-eu',
    title: 'Giełda: Trans.eu',
    description: 'Connector API ofert frachtu (demo: syntetyczny feed; prod: klucz w Edge).',
    area: 'integration',
    roles: ['owner', 'dispatcher'],
    status: 'beta',
    module: 'loadBoard',
    dataKeys: ['freight-connectors', 'freight-offers'],
    codePaths: ['src/lib/domain/freight-connectors.ts'],
    sinceVersion: '0.12',
  },
  {
    id: 'int-freight-timocom',
    title: 'Giełda: TimoCom',
    description: 'Connector TimoCom — agregacja ofert międzynarodowych.',
    area: 'integration',
    roles: ['owner', 'dispatcher'],
    status: 'beta',
    module: 'loadBoard',
    sinceVersion: '0.12',
  },
  {
    id: 'int-freight-teleroute',
    title: 'Giełda: Teleroute',
    description: 'Connector Teleroute marketplace.',
    area: 'integration',
    roles: ['owner', 'dispatcher'],
    status: 'beta',
    module: 'loadBoard',
    sinceVersion: '0.17.3',
  },
  {
    id: 'int-freight-123cargo',
    title: 'Giełda: 123cargo',
    description: 'Connector 123cargo — oferty LTL/FTL.',
    area: 'integration',
    roles: ['owner', 'dispatcher'],
    status: 'beta',
    module: 'loadBoard',
    sinceVersion: '0.17.3',
  },
  {
    id: 'int-freight-transporeon',
    title: 'Giełda: Transporeon',
    description: 'Connector Transporeon — zlecenia od shipperów retail/FMCG.',
    area: 'integration',
    roles: ['owner', 'dispatcher'],
    status: 'beta',
    module: 'loadBoard',
    sinceVersion: '0.17.3',
  },
  {
    id: 'int-freight-wtransnet',
    title: 'Giełda: Wtransnet',
    description: 'Polska giełda transportowa Wtransnet.',
    area: 'integration',
    roles: ['owner', 'dispatcher'],
    status: 'beta',
    module: 'loadBoard',
    sinceVersion: '0.17.3',
  },
  {
    id: 'int-freight-b2pweb',
    title: 'Giełda: B2PWeb',
    description: 'Connector B2PWeb exchange.',
    area: 'integration',
    roles: ['owner', 'dispatcher'],
    status: 'beta',
    module: 'loadBoard',
    sinceVersion: '0.17.3',
  },
  {
    id: 'int-freight-freightlink',
    title: 'Giełda: Freightlink',
    description: 'Connector Freightlink EU.',
    area: 'integration',
    roles: ['owner', 'dispatcher'],
    status: 'beta',
    module: 'loadBoard',
    sinceVersion: '0.17.3',
  },
  {
    id: 'int-fleet-telematics',
    title: 'Telematyka floty (Webfleet / Transics)',
    description: 'Sync pozycji GPS i telemetrii z zewnętrznych systemów floty.',
    area: 'integration',
    roles: ['owner'],
    status: 'beta',
    module: 'gps',
    dataKeys: ['fleet-telematics-connectors', 'fleet-positions'],
    codePaths: ['supabase/functions/transflow-api/fleet_telematics_sync.ts'],
    sinceVersion: '0.17',
  },
  {
    id: 'int-tachograph-api',
    title: 'API tachografu',
    description: 'Synchronizacja danych DDD / czasu jazdy przez Edge Function tachograph-sync.',
    area: 'integration',
    roles: ['owner'],
    status: 'beta',
    module: 'tachographImport',
    dataKeys: ['tachograph-connectors', 'tachograph'],
    codePaths: ['supabase/functions/transflow-api/tachograph_sync.ts'],
    sinceVersion: '0.17',
  },
]

export function featuresByArea(): Record<AppFeatureArea, AppFeature[]> {
  const out: Record<AppFeatureArea, AppFeature[]> = {
    admin: [],
    driver: [],
    mechanic: [],
    platform: [],
    integration: [],
  }
  for (const f of APP_FEATURES) {
    out[f.area].push(f)
  }
  for (const key of Object.keys(out) as AppFeatureArea[]) {
    out[key].sort((a, b) => a.title.localeCompare(b.title, 'pl'))
  }
  return out
}

export function liveFeatureCount(): number {
  return APP_FEATURES.filter((f) => f.status === 'live').length
}
