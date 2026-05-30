# TransFlow — roadmap produktu

> Priorytety dla małej/średniej polskiej firmy TSL (kraj + wyjazdy za granicę).

## ✅ v0.1–0.4 — Fundament

- Multi-tenant SaaS, role, layout
- Kursy, kierowcy, flota, compliance alerty
- Supabase + Vercel + GitHub Actions

## ✅ v0.5 — Raport kierowcy + międzynarodowy (obecna)

- [x] `docs/DOMAIN-TRANSPORT.md` — wiedza branżowa
- [x] Kurs: scope kraj/UE/poza UE, CMR, kraje, opłaty EUR
- [x] Raport dzienny kierowcy (km, paliwo, myto, koniec pracy)
- [x] Panel raportów dla właściciela/dyspozytora
- [x] Dokumenty firmy: licencja wspólnotowa, CKZ (compliance)

## 🔜 v0.6 — Czas pracy i rozliczenia

- Kalkulator 561/2006 (ostrzeżenia przed przekroczeniem)
- Podsumowanie tygodnia kierowcy
- Marża per kurs / per klient
- Eksport CSV dla księgowości

## 🔜 v0.7 — Auth i bezpieczeństwo

- Supabase Auth (email/hasło per użytkownik)
- RLS / prawdziwe tenant isolation w DB
- PIN kierowcy (jak wgdom worker)

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
