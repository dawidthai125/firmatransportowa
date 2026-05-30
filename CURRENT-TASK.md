# CURRENT-TASK — TransFlow

**Ostatnia sesja:** 2026-05-30 · **v0.5.0**

## Skończone ✅

- [x] v0.1–0.4 — layout, multi-tenant, kursy, kierowcy, flota, compliance, Supabase, Vercel
- [x] **v0.5 — Raport kierowcy + międzynarodowy:**
  - `docs/DOMAIN-TRANSPORT.md` — wymagania PL + wyjazdy za granicę (LR1, CMR, RMPD)
  - Kurs: scope kraj/UE/poza UE, kraje, CMR, EUR, wypis, RMPD
  - Demo kurs Wrocław → Berlin
  - Raport dzienny kierowcy (km, paliwo, myto PLN/EUR, koniec pracy)
  - Panel **Raporty** dla owner/dispatcher
  - Dokumenty firmy w **Firma** + alerty compliance (licencja, CKZ)

## Następne kroki (v0.6+)

1. Kalkulator 561/2006 + eksport CSV
2. Auth Supabase (email/hasło)
3. PWA + GPS / ETA
4. Integracja RMPD/SENT (przypomnienie)
