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
      summary: `Tu widzisz wyjątki na dziś i KPI — ${isOwner ? 'właściciel' : 'dyspozytor'} reaguje tylko na to, co wymaga uwagi.`,
      steps: [
        {
          title: 'Panel „Wymaga uwagi dziś”',
          description: 'Awarie, brak raportów, dokumenty, czas jazdy i nieświeży GPS — kliknij wiersz, aby przejść do modułu.',
          action: 'Sekcja u góry pulpitu — klik w alert otwiera Kursy / Raporty / Awarie itd.',
        },
        {
          title: 'Sprawdź kafelki KPI',
          description: 'Aktywne kursy, marża, alerty zgodności i czasu jazdy — na pierwszy rzut oka.',
          action: 'Przewiń ekran w dół na pulpicie',
        },
        {
          title: 'Ten tydzień — operacje',
          description: 'Km, koszty z raportów i marża rzeczywista aktywnych kursów — bez wchodzenia w Rozliczenia.',
          action: 'Sekcja „Ten tydzień — operacje” pod kafelkami KPI',
        },
        {
          title: 'Mapa floty (GPS)',
          description: 'Pozycje z telefonów kierowców (PWA) lub demo. Zielone = w trasie, pomarańczowe = załadunek.',
          action: 'Sekcja „Flota na mapie” — Odśwież aktualizuje pozycje',
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
    features: {
      title: 'Katalog funkcji aplikacji',
      summary:
        'Pełna lista modułów systemu zarządzania firmą transportową — opisy, role, status. Aktualizowany wraz z rozwojem produktu.',
      steps: [
        {
          title: 'Przeglądaj obszary',
          description:
            'Funkcje pogrupowane: panel admina, kierowca, mechanik, platforma, integracje API.',
          action: 'Przewiń sekcje na tym ekranie',
        },
        {
          title: 'Szukaj i filtruj',
          description: 'Wpisz słowo kluczowe lub filtruj: Dostępne / Beta / Planowane.',
          action: 'Pasek wyszukiwania u góry',
        },
        {
          title: 'Przejdź do modułu',
          description: 'Przy funkcjach panelu admina — przycisk „Otwórz moduł” przenosi do zakładki.',
          action: 'Karta funkcji → Otwórz moduł',
        },
        {
          title: 'Dla developerów',
          description:
            'Źródło prawdy: src/lib/catalog/app-features.ts oraz docs/SYSTEM-OVERVIEW.md dla agentów AI.',
          action: 'Stopka ekranu — ścieżki plików',
        },
      ],
      related: [
        { label: 'Pulpit', hint: 'Operacje na co dzień' },
        { label: 'Firma', hint: 'Ustawienia i integracje' },
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
          title: 'Marża z raportów',
          description: 'Na karcie kursu widać km i koszty z kabiny oraz marżę rzeczywistą vs plan.',
          action: 'Lista kursów → wiersz „Z raportów”',
        },
        {
          title: 'Międzynarodówka',
          description: 'Badge CMR / RMPD / Wypis przy kursach poza kraj — uzupełnij przed wyjazdem.',
          action: 'Edytuj kurs → zakres i pola CMR/RMPD',
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
          title: 'Marża per kurs',
          description: 'Porównanie planu z kursu z kosztami z raportów kierowcy — ta sama lista co na pulpicie.',
          action: 'Sekcja „Marża per kurs (z raportów kierowcy)”',
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
      summary: 'Pojazdy z ostatnią pozycją GPS, kierowcą, kursem i alertem gdy sygnał starszy niż 3 h.',
      steps: [
        {
          title: 'Status GPS na karcie pojazdu',
          description: 'Kierowca, aktywny kurs, prędkość i „ostatni sygnał” — z telefonu (PWA) lub telematyki.',
          action: 'Moduł Flota → lista pojazdów',
        },
        {
          title: 'Alert GPS nieaktualny',
          description: 'Pojazd bez świeżej pozycji > 3 h — baner w Flocie i wyjątek na pulpicie.',
          action: 'Pulpit → Wymaga uwagi → GPS, lub Flota → pomarańczowy baner',
        },
        {
          title: 'Dodaj / edytuj pojazd',
          description: 'Rejestracja, ADR, dokumenty, przebieg.',
          action: 'Przycisk „Dodaj pojazd” lub Edytuj na karcie',
        },
      ],
      related: [
        { label: 'Pulpit', hint: 'Mapa floty na żywo' },
        { label: 'Kursy', hint: 'Przypisanie pojazdu do trasy' },
      ],
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
    loads: {
      title: 'Giełda ładunków',
      summary: 'Wyszukiwarka ofert z wielu źródeł — filtry pod preferencje Twojej floty i stawki.',
      steps: [
        {
          title: 'Ustaw preferencje firmy',
          description: 'Nadwozie, stawka/km, płatność, ADR, kabotaż, baza operacyjna, koretarz trasy.',
          action: 'Przycisk „Preferencje firmy”',
        },
        {
          title: 'Wybierz źródła',
          description: 'Trans.eu, TimoCom, Teleroute, 123cargo, e-mail, sieć partnerska — włącz te, z których korzystasz.',
          action: 'Sekcja źródeł w filtrach',
        },
        {
          title: 'Szukaj i zapisuj',
          description: 'Wpisz miasto/trasa/ładunek. Zapisane oferty wracają filtrem „Zapisane”.',
          action: 'Pole wyszukiwania + ikona zakładki przy ofercie',
        },
        {
          title: 'Oceń stawkę',
          description: 'Porównaj PLN/km, termin płatności i ocenę zleceniodawcy przed negocjacją.',
          action: 'Kolumna ceny i gwiazdki na karcie oferty',
        },
      ],
      tips: ['Docelowo: integracja API z giełdami — użyj „Synchronizuj teraz” (Trans.eu / TimoCom).'],
    },
    itd: {
      title: 'ITD i kontrole drogowe',
      summary: 'Alerty od kierowców, wyniki kontroli, mapa punktów ITD i edycja instrukcji.',
      steps: [
        {
          title: 'Reaguj na alerty',
          description: 'Kierowca wysyła „Kontrola w toku” — przyjmij alert i skontaktuj się po zakończeniu czynności.',
          action: 'Zakładka Alerty → „Przyjąłem”',
        },
        {
          title: 'Mapa ITD',
          description: 'Wagi A1/A2/A4, granice, zgłoszenia na żywo (4 h).',
          action: 'Zakładka Mapa ITD',
        },
        {
          title: 'Archiwum kontroli',
          description: 'Protokoły, mandaty — kierowca lub biuro dodaje wynik po kontroli.',
          action: 'Zakładka Wyniki kontroli',
        },
        {
          title: 'Instrukcja kierowcy',
          description: isOwner
            ? 'Edytujesz wszystkie sekcje — prawne i firmowe.'
            : 'Dyspozytor edytuje tylko sekcje firmowe (kontakt, procedury).',
          action: 'Zakładka Instrukcja kierowcy → Edytuj',
        },
      ],
      related: [{ label: 'Zgodność', hint: 'Dokumenty firmy i pojazdów' }],
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
      summary: 'Alerty ważności licencji, CKZ, pojazdów oraz brakujące CMR/RMPD na kursach międzynarodowych.',
      steps: [
        {
          title: 'Kursy międzynarodowe',
          description: 'Sekcja u góry — brak CMR, wypisu lub rejestracji RMPD w PUESC przed wyjazdem poza UE.',
          action: 'Link PUESC przy alertach RMPD',
        },
        {
          title: 'Przegląd alertów dokumentów',
          description: 'Lista posortowana według pilności — czerwony = po terminie lub wkrótce.',
          action: 'Lista alertów na ekranie',
        },
        {
          title: 'Uzupełnij dane u źródła',
          description: 'Edytuj kierowcę, pojazd, kurs lub dokumenty firmy, żeby alert zniknął.',
          action: `${NAV_HINT} → Kierowcy / Flota / Kursy / Firma`,
        },
      ],
    },
    tachograph: {
      title: 'Tachograf i czasy jazdy',
      summary:
        'Synchronizacja z TachoScan / VDO / telematyką oraz archiwum DDD — kontrola ITD i czas jazdy 561/2006.',
      steps: [
        {
          title: 'Status połączenia',
          description:
            'Włącz dostawców w Ustawieniach firmy, potem „Synchronizuj teraz” — widać ostatni sync i minuty jazdy/odpoczynku.',
          action: 'Karta „Połączenie z dostawcą” u góry modułu',
        },
        {
          title: 'Import ręczny (.ddd)',
          description:
            'Fallback przy kontroli ITD lub awarii telematyki — plik trafia też do biblioteki Pliki.',
          action: 'Sekcja „Import ręczny” na dole modułu',
        },
        {
          title: 'Przypisz kierowcę',
          description: 'System próbuje rozpoznać kierowcę z nazwy pliku lub danych API — możesz poprawić ręcznie.',
          action: 'Lista odczytów → wybór kierowcy',
        },
      ],
      related: [
        { label: 'Ustawienia firmy', hint: 'Konfiguracja TachoScan / VDO / FMS' },
        { label: 'Pliki', hint: 'Kopia importu ręcznego w bibliotece' },
      ],
    },
    weeklyPlanner: {
      title: 'Plan tygodnia',
      summary: 'Widok 7 dni — które kursy są aktywne danego dnia, z kierowcą i statusem.',
      steps: [
        {
          title: 'Przegląd tygodnia',
          description: 'Kolumny pon–niedz — kurs widoczny, gdy mieści się między załadunkiem a rozładunkiem.',
          action: 'Przewiń siatkę dni na ekranie',
        },
        {
          title: 'Edycja kursów',
          description: 'Daty i przypisania zmieniasz w module Kursy.',
          action: 'Menu → Kursy',
        },
      ],
      related: [{ label: 'Kursy', hint: 'Tworzenie i edycja zleceń' }],
    },
    invoicing: {
      title: 'Fakturowanie',
      summary: 'Eksport dostarczonych kursów do CSV, Fakturownia lub wFirma — moduł włączany w Ustawieniach.',
      steps: [
        {
          title: 'Włącz moduł',
          description: 'Integracja fakturowania jest domyślnie wyłączona — włącz w Ustawienia → Moduły.',
          action: 'Ustawienia firmy → Moduły i integracje → Integracja fakturowania',
        },
        {
          title: 'Konfiguracja NIP i terminu',
          description: 'Uzupełnij dane sprzedawcy i wybierz dostawcę eksportu.',
          action: 'Sekcja Konfiguracja na tym widoku',
        },
        {
          title: 'Eksport CSV',
          description: 'Pobierz plik z kursami o statusie dostarczony/rozliczony z frachtem PLN.',
          action: 'Przycisk „Eksportuj pozycje”',
        },
      ],
      related: [{ label: 'Kursy', hint: 'Status dostarczony przed fakturą' }],
    },
    driverPayroll: {
      title: 'Wynagrodzenia kierowców',
      summary: 'Stawki km / dzień / % frachtu — wyliczenie z raportów kabiny za wybrany okres.',
      steps: [
        {
          title: 'Ustaw stawkę',
          description: 'Dla każdego kierowcy wybierz model rozliczenia i zapisać.',
          action: 'Karta kierowcy → Zapisz stawkę',
        },
        {
          title: 'Zakres dat',
          description: 'Domyślnie bieżący tydzień — możesz zmienić od/do.',
          action: 'Pola dat u góry widoku',
        },
      ],
      related: [
        { label: 'Raporty', hint: 'Km i koszty z kabiny' },
        { label: 'Rozliczenia', hint: 'Marże i czas jazdy' },
      ],
    },
    settings: {
      title: 'Ustawienia firmy',
      summary: 'Dokumenty firmy, plan abonamentowy, mechanicy i weryfikatorzy awarii.',
      steps: [
        {
          title: 'Moduły i integracje',
          description: 'Włącz/wyłącz funkcje niezależnie od planu — fakturowanie, portal klienta, czat, marża per auto.',
          action: 'Sekcja „Moduły i integracje” → checkboxy',
        },
        {
          title: 'Plan abonamentowy',
          description: 'Starter / Business / Enterprise — włącza lub ukrywa moduły (GPS, giełda, ITD, tachograf).',
          action: 'Sekcja „Plan abonamentowy” → wybierz plan',
        },
        {
          title: 'Klucze API',
          description:
            'Trans.eu, Fakturownia, Webfleet, TachoScan, OpenAI — wpisz w „Klucze API”, zapisz i aktywuj.',
          action: 'Karta „Klucze API” → Przejdź do Klucze API',
        },
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
    integrations: {
      title: 'Klucze API i integracje',
      summary:
        'Jeden panel dla wszystkich kluczy: giełda, faktury, tachograf, GPS, OCR. Zapisz i aktywuj — moduły włączą się automatycznie.',
      steps: [
        {
          title: 'Wpisz klucze u dostawców',
          description: 'Trans.eu, Fakturownia, Webfleet, TachoScan, OpenAI — skopiuj z panelu partnera.',
          action: 'Uzupełnij sekcje → Zapisz i aktywuj',
        },
        {
          title: 'Test połączeń',
          description: 'Edge Function sprawdza każdy klucz i pokazuje prod / demo / błąd.',
          action: 'Przycisk „Test połączeń”',
        },
      ],
      related: [
        { label: 'Giełda', hint: 'Sync ofert po kluczach Trans.eu' },
        { label: 'Tachograf', hint: 'Import DDD po sync' },
        { label: 'Firma', hint: 'Moduły i plan abonamentu' },
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
      summary: 'Aktywny kurs, udostępnianie GPS, powiadomienia i szybkie akcje z kabiny.',
      steps: [
        {
          title: 'Zainstaluj aplikację (telefon)',
          description:
            'Dodaj skrót na ekran główny — szybszy dostęp z kabiny bez wpisywania adresu w przeglądarce.',
          action: 'Baner „Zainstaluj aplikację” u góry lub Safari → Udostępnij → Dodaj do ekranu początkowego',
        },
        {
          title: 'Udostępnij lokalizację (GPS)',
          description: 'Włącz GPS — biuro widzi pojazd na mapie bez dzwonienia. Działa w tle po zainstalowaniu PWA.',
          action: 'Przełącznik „Udostępnianie lokalizacji” na pulpicie Start',
        },
        {
          title: 'Powiadomienia',
          description: 'Dzwonek u góry — nowy kurs, przypomnienie o raporcie po 16:00. Włącz powiadomienia w przeglądarce.',
          action: 'Ikona dzwonka w nagłówku → lista wiadomości',
        },
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
      summary: 'Km, paliwo, myto, czas jazdy — raport przypina się do aktywnego kursu automatycznie.',
      steps: [
        {
          title: 'Kurs',
          description: 'System podpowiada aktywny kurs (w trasie / załadunek). Zmień z listy, jeśli trzeba.',
          action: 'Pole „Kurs” na górze formularza',
        },
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
    itd: {
      title: 'ITD — kontrola drogowa',
      summary: 'Alert do biura, mapa kontroli, instrukcja prawna i wysyłka protokołu po kontroli.',
      steps: [
        {
          title: 'Kontrola w toku — wyślij alert',
          description: 'Nie dzwonić do szefa w trakcie rozmowy z inspektorem — jeden przycisk powiadamia biuro.',
          action: 'Czerwona karta „Kontrola ITD w toku” → Wyślij alert',
        },
        {
          title: 'Sprawdź mapę ITD',
          description: 'Wagi, granice, zgłoszenia innych kierowców — unikaj hot-spotów jeśli możesz legalnie.',
          action: 'Sekcja „Gdzie stoi ITD”',
        },
        {
          title: 'Przeczytaj instrukcję',
          description: 'Dokumenty w kabinie, prawa podczas kontroli, tachograf 56 dni wstecz.',
          action: 'Sekcje instrukcji poniżej mapy',
        },
        {
          title: 'Po kontroli — wyślij wynik',
          description: 'Nr protokołu, mandat, nazwa pliku ze skanem — biuro archiwizuje.',
          action: '„Dodaj wynik kontroli” na dole ekranu',
        },
      ],
      tips: ['Instrukcję edytuje właściciel/dyspozytor w panelu ITD biura.'],
    },
    profile: {
      title: 'Profil kierowcy',
      summary: 'Dane konta, przypisany pojazd, kontakt z dyspozytorem i wylogowanie.',
      steps: [
        {
          title: 'Sprawdź dane',
          description: 'Imię, rola, przypisany ciągnik/naczepa i numer telefonu dyspozytora.',
          action: 'Karta profilu na ekranie',
        },
        {
          title: 'Kontakt z biurem',
          description: 'Telefon i e-mail dyspozytora — bez szukania numeru w notesie.',
          action: 'Sekcja „Kontakt operacyjny” na profilu',
        },
        {
          title: 'Powiadomienia',
          description: 'Włącz powiadomienia przeglądarki, aby dostawać przypomnienia o raporcie i nowe kursy.',
          action: 'Przycisk „Włącz powiadomienia” na profilu',
        },
        {
          title: 'Wyloguj',
          description: 'Po zmianie na innym urządzeniu zawsze się wyloguj.',
          action: 'Przycisk „Wyloguj” na dole profilu',
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
    summary:
      'Zlecenia po weryfikacji biura — diagnoza, części, status naprawy. Opis widzi kierowca i biuro; koszt tylko właściciel.',
    steps: [
      {
        title: 'Wybierz zlecenie',
        description: 'Lista zleceń — kierowca, pojazd, opis usterki, zdjęcia.',
        action: 'Kliknij kartę na liście napraw',
      },
      {
        title: 'Opisz naprawę',
        description: 'Diagnoza, wymienione części i wykonane prace — widoczne u kierowcy i w biurze.',
        action: 'Sekcja „Opis naprawy” → Zapisz opis',
      },
      {
        title: 'Koszt (opcjonalnie)',
        description: 'Kwota naprawy — zobaczy tylko właściciel w panelu Awarie.',
        action: 'Pole „Koszt naprawy (zł)”',
      },
      {
        title: 'Status: w trakcie / naprawiony',
        description: '„W trakcie naprawy” lub „Naprawiony” — kierowca widzi status na pulpicie.',
        action: 'Przyciski statusu pod opisem naprawy',
      },
      {
        title: 'Termin i kontakt',
        description: 'Ustal wizytę lub poproś kierowcę o telefon.',
        action: 'Sekcja terminu / prośba o kontakt',
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
