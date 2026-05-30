import type { ItdPlaybookSection } from '@/lib/domain/itd-types'

/** Domyślna instrukcja ITD — kontrola drogowa GITD, rozporządzenie MSWiA, 561/2006 */
export function defaultItdPlaybook(): ItdPlaybookSection[] {
  return [
    {
      id: 'pb-stop',
      kind: 'legal',
      title: '1. Zatrzymanie — zachowanie kierowcy',
      order: 1,
      items: [
        'Zatrzymaj pojazd bezpiecznie — nie uciekaj, nie blokuj ruchu dłużej niż trzeba.',
        'Inspektor ITD podaje stopień, imię, nazwisko i przyczynę zatrzymania.',
        'Inspektor okazuje legitymację służbową — możesz poprosić o chwilę na weryfikację.',
        'Mów spokojnie, odpowiadaj zwięźle. Nie podpisuj niczego, czego nie rozumiesz.',
        'Natychmiast użyj w aplikacji: ITD → „Kontrola w toku” — biuro zostanie powiadomione.',
      ],
    },
    {
      id: 'pb-docs',
      kind: 'checklist',
      title: '2. Dokumenty obowiązkowe w kabinie',
      order: 2,
      items: [
        'Dowód osobisty lub paszport.',
        'Prawo jazdy kat. C/C+E z ważnym kodem 95.',
        'Dowód rejestracyjny ciągnika i naczepy/przycepy.',
        'Polisa OC — w wersji elektronicznej lub papierowej.',
        'Licencja / zezwolenie + wypis (jeśli wymagany na kursie).',
        'Dokumenty przewozowe: CMR, list przewozowy (zależnie od kursu).',
        'Karta kierowcy + wydruki z tachografu (min. 28 dni; kontrola do 56 dni wstecz od 31.12.2024).',
        'Instrukcja obsługi tachografu w języku zrozumiałym dla kontrolującego.',
        'Przy ADR: certyfikat kierowcy ADR, pisemne instrukcje przewozu, oznakowanie.',
      ],
    },
    {
      id: 'pb-tacho',
      kind: 'legal',
      title: '3. Tachograf i czas pracy (561/2006)',
      order: 3,
      items: [
        'Od 31.12.2024 inspektor może analizować aktywność z ostatnich 56 dni.',
        'Sczytanie karty kierowcy — max co 28 dni.',
        'Nie manipuluj tachografem — grozi kara karna.',
        'Wyjaśnij luki prawdą: awaria karty, wymiana pojazdu — wskaż dowody jeśli masz.',
        'Przerwy zgodne z limitami: 4,5 h jazdy → przerwa 45 min.',
      ],
    },
    {
      id: 'pb-rights',
      kind: 'legal',
      title: '4. Twoje prawa podczas kontroli',
      order: 4,
      items: [
        'Masz prawo do protokołu kontroli — przeczytaj przed podpisem.',
        'Przy zatrzymaniu dokumentów — inspektor wydaje pokwitowanie.',
        'Możesz zgłosić zastrzeżenia w protokole na piśmie.',
        'Nie musisz przyznawać się do winy — opisuj fakty.',
        'Po nałożeniu kary — zapisz numer protokołu, kwotę, podstawę prawną.',
        'Masz prawo do środków odwoławczych — termin liczy się od doręczenia decyzji.',
      ],
    },
    {
      id: 'pb-tech',
      kind: 'checklist',
      title: '5. Stan techniczny pojazdu',
      order: 5,
      items: [
        'Hamulce, oświetlenie, ogumienie, plomby tachografu.',
        'Masa i nacisk osi — przy przekroczeniu grozi mandat.',
        'Mocowanie ładunku — pasy, narożniki, plomby.',
      ],
    },
    {
      id: 'pb-after',
      kind: 'company',
      title: '6. Po kontroli — obowiązki wobec firmy',
      order: 6,
      items: [
        'W ciągu 2 h prześlij w aplikacji wynik: skan protokołu, mandat.',
        'Jeśli pojazd zatrzymany — zadzwoń do dyspozytora, nie ruszaj bez zgody.',
        'Zanotuj numer protokołu, miejsce, godzinę, imię inspektora.',
      ],
    },
    {
      id: 'pb-contact',
      kind: 'company',
      title: '7. Kontakt w sytuacji awaryjnej',
      order: 7,
      items: [
        'Dyspozytor operacyjny — numer w zakładce Profil.',
        'Alert „Kontrola ITD” — właściciel dostaje powiadomienie natychmiast.',
      ],
    },
  ]
}
