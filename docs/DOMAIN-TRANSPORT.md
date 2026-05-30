# TransFlow — domena transportu (Polska, mała/średnia firma TSL)

> **Dla AI i programistów.** Źródła: GITD, rozporządzenie 561/2006, Pakiet Mobilności, praktyka branży.  
> **Ostatnia aktualizacja:** 2026-05-30 · v0.5.0

---

## 1. Profil docelowy

**Mała/średnia firma transportowa w Polsce** (2–30 aut): właściciel + dyspozytor + kierowcy.  
Zakres: **kraj + UE + (opcjonalnie) kraje trzecie** (Ukraina, Turcja — AETR).

TransFlow musi wspierać oba tryby — krajowy i międzynarodowy — w jednym systemie multi-tenant.

---

## 2. Co firma MUSI mieć (formalnie)

### 2.1 Firma (przewoźnik)

| Dokument | Kraj | Międzynarodowy (UE) | Moduł TransFlow |
|----------|------|---------------------|-----------------|
| Zezwolenie na wykonywanie zawodu przewoźnika | Starosta / GITD | Wymagane przed licencją wspólnotową | Compliance — firma |
| Licencja krajowa (transport rzeczy >3,5t) | Starosta | — | Compliance |
| **Licencja wspólnotowa** (LR1, GITD) | — | UE, od 2,5t DMC (Pakiet Mobilności) | Compliance + kurs `scope` |
| **CKZ** — certyfikat kompetencji zawodowych | ITS egzamin | Wymagany | Compliance — firma |
| Baza eksploatacyjna (siedziba + parking) | Tak | Tak | Ustawienia firmy |
| Zdolność finansowa | 9000 EUR / 1. pojazd + 5000 EUR / kolejny | Tak | Info (przyszłość) |
| **Wypis z licencji** — 1 oryginał na pojazd | — | W kabinie przy transporcie międzynarodowym | Flota / kurs |

### 2.2 Pojazd

- Przegląd techniczny, OC/AC, legalizacja tachografu  
- Tachograf **inteligentny** gen. 2 (harmonogram wdrożenia UE)  
- ADR: zezwolenie na pojazd + oznakowanie (jeśli ładunek ADR)

### 2.3 Kierowca

| Dokument | Opis |
|----------|------|
| Prawo jazdy C / C+E | Kategoria |
| **Kod 95** | Kwalifikacja wstępna |
| **CPC** (szkolenie okresowe) | Co 5 lat |
| Karta kierowcy (tachograf) | Czas jazdy |
| Badania lekarskie / psychologiczne | Okresowo |
| **ADR** | Certyfikat kierowcy — ładunki niebezpieczne |

### 2.4 Czas pracy

| Obszar | Przepisy |
|--------|----------|
| UE | Rozporządzenie **561/2006** — max 9h jazdy/dzień, przerwa 45 min po 4,5h, odpoczynek 11h |
| Kraje trzecie (UA, TR…) | **AETR** — podobne limity, inne kontrole |
| Pakiet Mobilności | Kabotaż, powrót do bazy co 8 tygodni (ciężarówki), rejestracja przekroczeń granicy |

---

## 3. Transport międzynarodowy — co system musi obsłużyć

### 3.1 Kurs / zlecenie międzynarodowe

- **Zakres:** kraj / UE / poza UE  
- **Kraje:** załadunek i rozładunek (PL → DE → NL)  
- **CMR** — numer listu przewozowego (obowiązek przy transporcie międzynarodowym)  
- **Fracht** w EUR lub PLN, **opłaty drogowe** (myto DE, winiety AT/CH)  
- **RMPD / SENT** — rejestracja przewozu do/z krajów spoza UE (np. UA)  
- **Zezwolenia** — EKMT, zezwolenia dwustronne (poza UE) — flaga / numer  
- Przypisanie **wypisu z licencji wspólnotowej** do pojazdu

### 3.2 Dokumenty w kabinie (kontrola ITD / zagraniczna)

- Wypis z licencji wspólnotowej  
- CMR (lub e-CMR)  
- Karta kierowcy  
- Instrukcje ADR (jeśli dotyczy)

### 3.3 Kary (orientacyjnie — przypomnienie dla właściciela)

- Brak licencji wspólnotowej — do ~15 000 zł  
- Brak CMR — 500–4000 zł  
- Przekroczenie czasu jazdy — wysokie mandaty  

*(TransFlow: alerty compliance, nie doradztwo prawne.)*

### 2.5 Umowy i wyjazdy za granicę (praktyka małej firmy)

Typowa **mała firma z umowami międzynarodowymi** (2–10 aut) potrzebuje oprócz modułów operacyjnych:

| Obszar | Co firma robi | TransFlow |
|--------|---------------|-----------|
| **Licencja wspólnotowa + wypisy** | 1 oryginał wypisu na każdy pojazd w trasie UE | Flota + kurs (`licenseExtractNo`) |
| **CMR / e-CMR** | List przewozowy przy każdym przewozie międzynarodowym | Pole `cmrNumber` na kursie |
| **Fracht w EUR** | Rozliczenia z kontrahentami zagranicznymi | `freightEur`, myto EUR |
| **RMPD / SENT** | Od 2025 — zgłoszenie przewozu do/z krajów spoza UE (PUESC, formularz RMPD100) | Flaga `rmpdRegistered` (v0.5), API w v0.9 |
| **Czas pracy** | 561/2006 w UE, AETR poza UE | Raport minut jazdy (v0.5), kalkulator v0.6 |
| **Kabotaż / powrót do bazy** | Pakiet Mobilności — limity transportu w kraju obcym | Info + alerty (przyszłość) |
| **Zdolność finansowa** | 9000 EUR / 1. pojazd + 5000 EUR / kolejny (1071/2009) | Ustawienia firmy (info) |

**Źródła:** [biznes.gov.pl — LR1](https://www.biznes.gov.pl/pl/portal/ou1523), [GITD wniosek LR1](https://www.gov.pl/web/gitd/wniosek-lr1), RMPD w systemie SENT (PUESC).

---

## 4. Mapowanie na moduły TransFlow

| Potrzeba biznesowa | Moduł | Status v0.5 |
|--------------------|-------|-------------|
| Zlecenia / trasy / fracht | **Kursy** | ✅ + scope międzynarodowy |
| Kartoteka kierowców + dokumenty | **Kierowcy** | ✅ |
| Flota + wypisy + serwisy | **Flota** | ✅ |
| Alerty ważności | **Zgodność** | ✅ + docs firmy |
| Raport km/kosztów od kierowcy | **Raport dzienny** | ✅ v0.5 |
| Licencja / CKZ firmy | **Ustawienia firmy** | ✅ v0.5 |
| Czas jazdy 561/2006 kalkulator | Compliance | 🔜 v0.6 |
| GPS / ETA | GPS | 🔜 |
| Giełda ładunków | loadBoard | 🔜 |
| Import tachografu DDD | tachographImport | 🔜 |
| RMPD/SENT API | Integracja | 🔜 |

---

## 5. Słownik

| Termin | Znaczenie |
|--------|-----------|
| **TSL** | Transport, Spedycja, Logistyka |
| **CMR** | Międzynarodowy list przewozowy (Konwencja CMR) |
| **CKZ** | Certyfikat kompetencji zawodowych |
| **GITD** | Główny Inspektorat Transportu Drogowego |
| **Licencja wspólnotowa** | Uprawnienie do zarobkowego transportu międzynarodowego w UE |
| **Wypis** | Oryginał dokumentu przypisany do konkretnego pojazdu |
| **AETR** | Umowa o czasie pracy kierowców (kraje trzecie) |
| **RMPD** | Rejestr międzynarodowego przewozu drogowego (SENT) |
| **Kabotaż** | Transport w kraju obcym (nie będącym krajem rejestracji pojazdu) |

---

## 6. Różnica vs firma budowlana (wgdom)

| wgdom | TransFlow |
|-------|-----------|
| Robota = stały plac | Kurs = trasa + termin |
| Tygodniowy grafik | Czas jazdy + 561/2006 |
| Zdjęcia z budowy | CMR, raport km, myto |
| Przetargi BZP | Giełda ładunków / własne zlecenia |
| Inspektor na miejscu | Dyspozytor + mapa floty |

---

## 7. Źródła

- [GITD — wniosek LR1](https://www.gov.pl/web/gitd/wniosek-lr1)
- Rozporządzenie (WE) nr 561/2006
- Pakiet Mobilności UE (2019/2020, wdrożenie m.in. 2022 — busy 2,5–3,5t)
- Ustawa o transporcie drogowym (Dz.U. 2025 poz. 1490)
