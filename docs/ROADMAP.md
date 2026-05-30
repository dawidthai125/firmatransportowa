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

## ✅ v0.7 — Pliki + Auth (obecna)

- [x] Dedykowane viewery: CSV, PDF, obraz, tekst, JSON, HTML, binarny
- [x] Podgląd przed pobraniem + zapis do biblioteki
- [x] Moduł **Pliki** (import CMR/PDF/CSV)
- [x] Logowanie emailem (demo — hasło `demo2026`)
- [ ] Supabase Auth + RLS (w toku)

## 🔜 v0.8 — Operacje w terenie

- PWA + instalacja na telefon
- GPS / ETA (mapa floty)
- Powiadomienia push „czy zdąży na załadunek”

## 🔜 v0.9 — Integracje branżowe

- Giełda ładunków (Trans.eu / ręczne leady)
- Import plików tachografu (DDD)
- RMPD/SENT — przypomnienie rejestracji

## 🔜 v1.0 — Produkt pod abonament

- Plany Starter / Business / Enterprise (moduły)
- Onboarding nowej firmy (self-service)
- Panel platform_admin (Ty jako sprzedawca SaaS)
