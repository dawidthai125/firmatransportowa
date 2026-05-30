/**
 * REJESTR POMOCY — aktualizuj przy każdej nowej funkcji / widoku
 *
 * Checklist dla developera:
 * 1. Dodajesz widok w navigation.ts → dodaj wpis tutaj (owner + dispatcher jeśli dotyczy)
 * 2. Zmieniasz flow w widoku → zaktualizuj steps i action
 * 3. Uruchom `npm run build` — validateHelpRegistry() w DEV wykryje brakujące klucze
 *
 * Klucz: `{rola}:{viewId}` np. `owner:repairs`, `driver:issue`
 */
import type { AdminView, DriverView } from '@/lib/navigation'
import { DISPATCHER_NAV, DRIVER_NAV, MECHANIC_NAV, OWNER_NAV } from '@/lib/navigation'
import type { HelpScreenKey, PanelHelpContent } from './types'

const NAV_HINT = 'Menu po lewej (komputer) lub dolna belka (telefon)'

function adminSteps(
  view: AdminView,
  role: 'owner' | 'dispatcher',
): PanelHelpContent {
  const isOwner = role === 'owner'

  const byView: Record<AdminView, PanelHelpContent> = {
    dashboard: {
      title: 'Pulpit — szybki przegląd firmy',
      summary: `Tu widzisz najważniejsze liczby na start dnia pracy ${isOwner ? 'właściciela' : 'dyspozytora'}.`,
      steps: [
        {
          title: 'Sprawdź kafelki KPI',
          description: 'Aktywne kursy, marża, alerty zgodności i czasu jazdy — na pierwszy rzut oka.',
          action: 'Przewiń ekran w dół na pulpicie',
        },
        {
          title: 'Reaguj na alerty',
          description: 'Czerwone/żółte komunikaty oznaczają dokumenty lub limity czasu jazdy do sprawdzenia.',
          action: `${NAV_HINT} → Zgodność (tylko właściciel) lub Kierowcy / Flota`,
        },
        {
          title: 'Przejdź do szczegółów',
          description: 'Kliknij odpowiednią zakładkę w menu, żeby rozwiązać problem z alertu.',
          action: NAV_HINT,
        },
      ],
      related: [
        { label: 'Kursy', hint: 'Planowanie i status zleceń' },
        { label: 'Awarie', hint: 'Zgłoszenia od kierowców' },
      ],
    },
    courses: {
      title: 'Kursy i zlecenia',
      summary: 'Tworzenie tras, przypisywanie kierowcy i pojazdu, koszty i status kursu.',
      steps: [
        {
          title: 'Dodaj nowy kurs',
          description: 'Wypełnij trasę, nadawcę, fracht, koszty i zakres (kraj / międzynarodówka).',
          action: 'Przycisk „Nowy kurs” u góry listy',
        },
        {
          title: 'Przypisz kierowcę i pojazd',
          description: 'W formularzu kursu wybierz kierowcę i ciągnik/naczepę z floty.',
          action: 'Edytuj kurs → pola Kierowca / Pojazd',
        },
        {
          title: 'Zmień status',
          description: 'Planowany → w trasie → zakończony — kierowca widzi aktywny kurs na swoim pulpicie.',
          action: 'Kliknij kurs na liście → Edytuj → Status',
        },
        {
          title: 'Usuń lub popraw',
          description: 'Ikona kosza usuwa kurs; ołówek otwiera edycję.',
          action: 'Wiersz kursu → ikony po prawej',
        },
      ],
      tips: ['Kierowca widzi kursy tylko do odczytu w swoim panelu „Kursy”.'],
      related: [
        { label: 'Kierowcy', hint: 'Kto może dostać kurs' },
        { label: 'Flota', hint: 'Pojazdy do przypisania' },
      ],
    },
    reports: {
      title: 'Raporty dzienne kierowców',
      summary: 'Km, paliwo, myto i czas pracy — to, co kierowca wpisuje z kabiny.',
      steps: [
        {
          title: 'Wybierz dzień',
          description: 'Filtr daty pokazuje raporty z konkretnego dnia.',
          action: 'Pole daty u góry ekranu',
        },
        {
          title: 'Przeglądaj raport',
          description: 'Sprawdź km, koszty, czas jazdy i odpoczynku oraz notatki kierowcy.',
          action: 'Kliknij wiersz raportu na liście',
        },
        {
          title: 'Porównaj z kursami',
          description: 'Brak raportu przy aktywnym kursie — przypomnij kierowcy o wypełnieniu.',
          action: `${NAV_HINT} → Kursy`,
        },
      ],
      related: [{ label: 'Rozliczenia', hint: 'Podsumowanie tygodnia' }],
    },
    settlements: {
      title: 'Rozliczenia i czas jazdy',
      summary: 'Tygodniowe podsumowanie km, kosztów i marż klientów — eksport do pliku.',
      steps: [
        {
          title: 'Wybierz tydzień',
          description: 'Strzałki lub data początku tygodnia zmieniają zakres.',
          action: 'Selektor tygodnia u góry',
        },
        {
          title: 'Sprawdź kierowców',
          description: 'Tabela pokazuje km, koszty i dni z raportem.',
          action: 'Sekcja „Kierowcy”',
        },
        {
          title: 'Marże klientów',
          description: 'Zobacz rentowność per nadawca/klient.',
          action: 'Sekcja „Marże klientów”',
        },
        {
          title: 'Eksportuj',
          description: 'CSV, PDF lub HTML — podgląd przed pobraniem.',
          action: 'Przyciski eksportu (CSV / PDF / HTML)',
        },
      ],
      tips: ['Alerty czasu jazdy pojawiają się też na pulpicie.'],
    },
    files: {
      title: 'Pliki i dokumenty',
      summary: 'Import CMR, faktur i innych dokumentów — podgląd w systemie.',
      steps: [
        {
          title: 'Importuj plik',
          description: 'Przeciągnij plik lub kliknij strefę uploadu (PDF, CSV, zdjęcia).',
          action: 'Strefa „Import pliku” u góry',
        },
        {
          title: 'Podgląd',
          description: 'Kliknij plik, żeby otworzyć podgląd (PDF, obraz, tekst).',
          action: 'Wiersz pliku na liście',
        },
        {
          title: 'Usuń niepotrzebne',
          description: 'Ikona kosza usuwa plik z biblioteki firmy.',
          action: 'Ikona kosza przy pliku',
        },
      ],
    },
    automations: {
      title: 'Automatyzacje',
      summary: 'Reguły, które same wysyłają przypomnienia, eksporty i alerty.',
      steps: [
        {
          title: 'Włącz regułę',
          description: 'Przełącznik obok nazwy reguły — zielony = aktywna.',
          action: 'Przełącznik przy regule na liście',
        },
        {
          title: 'Przeczytaj opis',
          description: 'Każda reguła ma trigger (np. brak raportu, awaria) i akcję (powiadomienie, plik).',
          action: 'Karta reguły → tekst opisu',
        },
        {
          title: 'Test harmonogramu',
          description: 'Ręcznie uruchom zaplanowane zadania (np. tygodniowy eksport).',
          action: 'Przycisk „Uruchom harmonogram teraz”',
        },
      ],
      tips: ['Powiadomienia z automatyzacji są też w dzwonku u góry ekranu.'],
    },
    fleet: {
      title: 'Flota pojazdów',
      summary: 'Ciągniki, naczepy, ADR, dokumenty pojazdu i przebieg.',
      steps: [
        {
          title: 'Dodaj pojazd',
          description: 'Rejestracja, typ, ADR, daty dokumentów, przebieg.',
          action: 'Przycisk „Dodaj pojazd”',
        },
        {
          title: 'Edytuj dane',
          description: 'Aktualizuj przebieg i ważność dokumentów po przeglądzie lub kontroli.',
          action: 'Kliknij pojazd → Edytuj',
        },
        {
          title: 'Dezaktywuj',
          description: 'Nieaktywny pojazd nie pojawia się przy przypisywaniu do kursu.',
          action: 'Formularz pojazdu → pole Aktywny',
        },
      ],
      related: [{ label: 'Zgodność', hint: 'Alerty ważności dokumentów' }],
    },
    repairs: {
      title: 'Awarie i naprawy',
      summary: 'Kierowca zgłasza → weryfikacja → mechanik realizuje naprawę.',
      steps: [
        {
          title: 'Wybierz zgłoszenie',
          description: 'Lista po lewej — status, kierowca, pojazd, zdjęcia.',
          action: 'Kliknij wiersz zgłoszenia',
        },
        {
          title: 'Zweryfikuj (właściciel / dyspozytor)',
          description: 'Sprawdź opis i zdjęcia, potwierdź wysyłkę do warsztatu.',
          action: '„Zweryfikuj i wyślij do mechanika” + wybór mechanika',
        },
        {
          title: 'Odrzuć błędne',
          description: 'Gdy zgłoszenie jest niekompletne — kierowca dostanie informację.',
          action: '„Odrzuć zgłoszenie” + powód',
        },
        {
          title: 'Śledź status',
          description: 'Oczekuje → u mechanika → w naprawie → zakończone.',
          action: 'Badge statusu na liście i w szczegółach',
        },
      ],
      tips: [
        'Kierowca składa zgłoszenie w panelu Awaria.',
        'Mechanik aktualizuje terminy w swoim panelu Naprawy.',
      ],
      related: [{ label: 'Firma', hint: 'Lista mechaników (właściciel)' }],
    },
    drivers: {
      title: 'Kierowcy',
      summary: 'Baza kierowców, kontakt, pojazd i dokumenty (CKZ itd.).',
      steps: [
        {
          title: 'Dodaj kierowcę',
          description: 'Imię, telefon, przypisany pojazd, daty dokumentów.',
          action: 'Przycisk „Dodaj kierowcę”',
        },
        {
          title: 'Edytuj dane',
          description: 'Po zmianie pojazdu lub odnowieniu CKZ zaktualizuj wpis.',
          action: 'Kliknij kierowcę → Edytuj',
        },
        {
          title: 'Sprawdź alerty',
          description: 'Wygasające dokumenty widać też w module Zgodność.',
          action: `${NAV_HINT} → Zgodność`,
        },
      ],
    },
    compliance: {
      title: 'Zgodność i dokumenty',
      summary: 'Alerty ważności licencji, CKZ, pojazdów i dokumentów firmy — tylko właściciel.',
      steps: [
        {
          title: 'Przegląd alertów',
          description: 'Lista posortowana według pilności — czerwony = po terminie lub wkrótce.',
          action: 'Lista alertów na ekranie',
        },
        {
          title: 'Uzupełnij dane u źródła',
          description: 'Edytuj kierowcę, pojazd lub dokumenty firmy, żeby alert zniknął.',
          action: `${NAV_HINT} → Kierowcy / Flota / Firma`,
        },
      ],
    },
    settings: {
      title: 'Ustawienia firmy',
      summary: 'Dokumenty firmy (licencje, CKZ), mechanicy i weryfikatorzy awarii.',
      steps: [
        {
          title: 'Dokumenty firmy',
          description: 'Licencja, CKZ, zezwolenie — daty ważności wpływają na alerty.',
          action: 'Sekcja „Dokumenty firmy” → Dodaj / edytuj',
        },
        {
          title: 'Mechanicy',
          description: 'Lista warsztatu — używana przy wysyłce awarii.',
          action: 'Sekcja „Mechanicy i weryfikacja awarii”',
        },
        {
          title: 'Weryfikatorzy awarii',
          description: 'ID użytkowników (np. dyspozytor), którzy mogą zatwierdzać zgłoszenia.',
          action: 'Pole Weryfikatorzy → Zapisz',
        },
      ],
    },
  }

  const content = byView[view]
  if (view === 'compliance' && !isOwner) {
    return {
      ...content,
      summary: 'Ten moduł jest dostępny tylko dla właściciela firmy.',
      steps: [{ title: 'Brak dostępu', description: 'Zaloguj się jako właściciel.', action: NAV_HINT }],
    }
  }
  if (view === 'settings' && !isOwner) {
    return {
      title: 'Ustawienia firmy',
      summary: 'Tylko właściciel może zmieniać dokumenty firmy i mechaników.',
      steps: [{ title: 'Brak dostępu', description: 'Skontaktuj się z właścicielem.', action: NAV_HINT }],
    }
  }
  return content
}

function driverHelp(view: DriverView): PanelHelpContent {
  const bottom = 'Dolna belka nawigacji na telefonie'

  const byView: Record<DriverView, PanelHelpContent> = {
    home: {
      title: 'Start kierowcy',
      summary: 'Twój aktywny kurs, szybkie akcje i status awarii.',
      steps: [
        {
          title: 'Sprawdź aktywny kurs',
          description: 'Karta u góry — trasa, status, numer zlecenia.',
          action: 'Karta kursu na pulpicie',
        },
        {
          title: 'Zgłoś awarię',
          description: 'Problem z pojazdem? Zdjęcie i opis w kilka minut.',
          action: 'Przycisk „Zgłoś awarię” lub belka → Awaria',
        },
        {
          title: 'Wypełnij raport dzienny',
          description: 'Km, paliwo, myto — na koniec dnia lub zmiany.',
          action: '„Wypełnij raport dzienny” lub belka → Raport',
        },
        {
          title: 'Status naprawy',
          description: 'Kompaktowy podgląd Twoich zgłoszeń awarii.',
          action: 'Sekcja statusu awarii pod kartą kursu',
        },
      ],
      related: [
        { label: 'Awaria', hint: 'Nowe zgłoszenie' },
        { label: 'Raport', hint: 'Dzień pracy' },
      ],
    },
    issue: {
      title: 'Zgłoszenie awarii',
      summary: 'Opisz problem, dodaj zdjęcia — biuro zweryfikuje i wyśle do warsztatu.',
      steps: [
        {
          title: 'Wybierz pojazd',
          description: 'Lista pojazdów przypisanych do firmy.',
          action: 'Pole „Pojazd” u góry formularza',
        },
        {
          title: 'Opisz usterkę',
          description: 'Tytuł, opis, lokalizacja (np. parking A2 km 120).',
          action: 'Pola Tytuł / Opis / Lokalizacja',
        },
        {
          title: 'Dodaj zdjęcia',
          description: 'Do 4 zdjęć — uszkodzenie, licznik, tabliczka.',
          action: '„Dodaj zdjęcie” pod formularzem',
        },
        {
          title: 'Wyślij',
          description: 'Po wysłaniu status „Oczekuje na weryfikację”.',
          action: 'Przycisk „Wyślij zgłoszenie”',
        },
      ],
      tips: ['Możesz śledzić status w tej zakładce i na pulpicie Start.'],
    },
    courses: {
      title: 'Moje kursy',
      summary: 'Zlecenia przypisane do Ciebie — tylko podgląd.',
      steps: [
        {
          title: 'Lista kursów',
          description: 'Trasa, status, numer referencyjny.',
          action: 'Przewiń listę kursów',
        },
        {
          title: 'Szczegóły',
          description: 'Kliknij kurs, żeby zobaczyć trasę i uwagi dyspozytora.',
          action: 'Kliknij wiersz kursu',
        },
      ],
      tips: ['Zmiany w kursie robi dyspozytor lub właściciel w panelu administracyjnym.'],
    },
    report: {
      title: 'Raport dzienny',
      summary: 'Km, paliwo, myto, czas jazdy i odpoczynku — obowiązek na koniec dnia.',
      steps: [
        {
          title: 'Uzupełnij liczby',
          description: 'Przebieg, litry paliwa, koszty myta, minuty jazdy i odpoczynku.',
          action: 'Pola formularza raportu',
        },
        {
          title: 'Granice / uwagi',
          description: 'Opcjonalnie: przekroczone granice, notatki dla biura.',
          action: 'Sekcja granic i notatki',
        },
        {
          title: 'Zapisz',
          description: 'Zapis wysyła raport do biura — możesz edytować tego samego dnia.',
          action: '„Zapisz raport”',
        },
        {
          title: 'Koniec pracy',
          description: 'Oznacza zakończenie zmiany (status w raporcie).',
          action: '„Kończę pracę”',
        },
      ],
    },
    profile: {
      title: 'Profil kierowcy',
      summary: 'Twoje dane, uprawnienia i przypisany pojazd (w rozwoju).',
      steps: [
        {
          title: 'Sprawdź dane',
          description: 'Imię i rola — szczegóły dokumentów uzupełnia biuro.',
          action: 'Karta profilu na ekranie',
        },
        {
          title: 'Wyloguj',
          description: 'Po zmianie na innym urządzeniu zawsze się wyloguj.',
          action: 'Ikona wyjścia u góry po prawej',
        },
      ],
      tips: [`W razie pytań: ${bottom} → Start → przycisk Pomoc (?) u góry`],
    },
  }

  return byView[view]
}

function mechanicHelp(): PanelHelpContent {
  return {
    title: 'Naprawy floty',
    summary: 'Zlecenia po weryfikacji biura — terminy, kontakt z kierowcą, zamknięcie naprawy.',
    steps: [
      {
        title: 'Wybierz zlecenie',
        description: 'Lista po lewej — kierowca, pojazd, opis, zdjęcia.',
        action: 'Kliknij wiersz na liście napraw',
      },
      {
        title: 'Ustal termin',
        description: 'Data i godzina wizyty w warsztacie.',
        action: 'Pole terminu → „Zapisz termin”',
      },
      {
        title: 'Poproś o kontakt',
        description: 'Gdy brakuje info od kierowcy.',
        action: 'Wiadomość → „Wyślij prośbę o kontakt”',
      },
      {
        title: 'Rozpocznij naprawę',
        description: 'Status zmienia się na „W naprawie”.',
        action: '„Rozpoczęto naprawę”',
      },
      {
        title: 'Zakończ',
        description: 'Po zakończeniu prac zamknij zlecenie.',
        action: '„Naprawa zakończona” / „Oznacz jako zakończone”',
      },
    ],
    tips: ['Nowe zlecenia pojawiają się po weryfikacji w panelu Awarie (biuro).'],
  }
}

/** Pełny rejestr — używany przez getPanelHelp i walidację */
export const PANEL_HELP: Record<HelpScreenKey, PanelHelpContent> = {} as Record<
  HelpScreenKey,
  PanelHelpContent
>

for (const { id } of OWNER_NAV) {
  const key = `owner:${id}` as HelpScreenKey
  PANEL_HELP[key] = adminSteps(id, 'owner')
}

for (const { id } of DISPATCHER_NAV) {
  const key = `dispatcher:${id}` as HelpScreenKey
  PANEL_HELP[key] = adminSteps(id, 'dispatcher')
}

for (const { id } of DRIVER_NAV) {
  const key = `driver:${id}` as HelpScreenKey
  PANEL_HELP[key] = driverHelp(id)
}

for (const { id } of MECHANIC_NAV) {
  const key = `mechanic:${id}` as HelpScreenKey
  PANEL_HELP[key] = mechanicHelp()
}

const FALLBACK: PanelHelpContent = {
  title: 'Pomoc',
  summary: 'Instrukcja dla tego ekranu nie jest jeszcze dostępna.',
  steps: [
    {
      title: 'Skorzystaj z menu',
      description: 'Wybierz moduł z nawigacji po lewej lub dolnej belki.',
      action: 'Menu nawigacji',
    },
  ],
}

export function getPanelHelp(mode: string, view: string): PanelHelpContent {
  const key = `${mode}:${view}` as HelpScreenKey
  return PANEL_HELP[key] ?? FALLBACK
}

/** W DEV: brakujący wpis = błąd w konsoli przy starcie */
export function validateHelpRegistry(): void {
  const required: HelpScreenKey[] = []

  for (const { id } of OWNER_NAV) required.push(`owner:${id}` as HelpScreenKey)
  for (const { id } of DISPATCHER_NAV) required.push(`dispatcher:${id}` as HelpScreenKey)
  for (const { id } of DRIVER_NAV) required.push(`driver:${id}` as HelpScreenKey)
  for (const { id } of MECHANIC_NAV) required.push(`mechanic:${id}` as HelpScreenKey)

  const missing = required.filter((k) => !PANEL_HELP[k]?.steps?.length)
  if (missing.length > 0) {
    console.error('[Help] Brakujące wpisy w panel-help.ts:', missing.join(', '))
  }
}

if (import.meta.env.DEV) {
  validateHelpRegistry()
}
