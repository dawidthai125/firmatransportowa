# TransFlow — roadmap produktu

> Priorytety dla małej/średniej polskiej firmy TSL (kraj + wyjazdy za granicę).

## ✅ v0.1–0.4 — Fundament

- Multi-tenant SaaS, role, layout
- Kursy, kierowcy, flota, compliance alerty
- Supabase + Vercel + GitHub Actions

## ✅ v0.5 — Raport kierowcy + międzynarodowy

- [x] `docs/DOMAIN-TRANSPORT.md` — wiedza branżowa
- [x] Kurs: scope kraj/UE/poza UE, CMR, kraje, opłaty EUR
- [x] Raport dzienny kierowcy (km, paliwo, myto, koniec pracy)
- [x] Panel raportów dla właściciela/dyspozytora
- [x] Dokumenty firmy: licencja wspólnotowa, CKZ (compliance)

## ✅ v0.6 — Czas pracy i rozliczenia

- [x] Kalkulator 561/2006
- [x] Podsumowanie tygodnia kierowcy
- [x] Marża per klient
- [x] Eksport CSV

## ✅ v0.7 — Pliki + Auth + Automatyzacja

- [x] Viewery plików (CSV, PDF, HTML…)
- [x] Logowanie emailem (demo + Supabase Auth v0.10)
- [x] **Silnik automatyzacji** — reguły, powiadomienia, harmonogram
- [x] Supabase Auth + RLS (Edge API, migracja SQL)

## ✅ v0.8 — Operacje w terenie (w toku)

- [x] Moduł awarii: kierowca → weryfikacja → mechanik
- [x] Portal kafelkowy + motyw transportowy TSL
- [x] Powiadomienia automatyzacji dla całego flow awarii
- [x] Kierowca widzi status swoich zgłoszeń
- [x] PWA + instalacja na telefon (v0.9.1)
- [x] GPS / mapa floty — demo Leaflet (v0.10)
- [x] Telemetria GPS z PWA kierowcy (Geolocation API) — v0.11
- [x] Profil kierowcy, powiadomienia, wyjątki na pulpicie — v0.11
- [ ] Web Push (VAPID) — poza Notification API

## 🔜 v0.9 — Integracje branżowe

- Giełda ładunków (Trans.eu / ręczne leady)
- Import plików tachografu (DDD)
- RMPD/SENT — przypomnienie rejestracji

## 🔜 v1.0 — Produkt pod abonament

- Plany Starter / Business / Enterprise (moduły)
- Onboarding nowej firmy (self-service)
- Panel platform_admin (Ty jako sprzedawca SaaS)
