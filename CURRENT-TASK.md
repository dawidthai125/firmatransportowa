# CURRENT-TASK — TransFlow / Tajski-Trans

**Ostatnia sesja:** 2026-05-30 · **v0.11.0**

## Skończone ✅

- [x] v0.10.0 — Supabase Auth + RLS + mapa GPS (Leaflet)
- [x] **v0.11.0 — profil kierowcy, GPS z PWA, wyjątki na pulpicie:**
  - Profil kierowcy: pojazd, dokumenty, kontakt z dyspozytorem, powiadomienia
  - Udostępnianie GPS z telefonu (Geolocation API) → mapa w biurze
  - Panel „Wymaga uwagi dziś” na pulpicie właściciela/dyspozytora
  - Skrzynka powiadomień kierowcy (nowy kurs, przypomnienie o raporcie po 16:00)
  - Pomoc zaktualizowana (`panel-help.ts`)

## Następne kroki

1. **Uruchomić migrację SQL** w Supabase (`20260530200000_auth_tenant_members.sql`)
2. Test end-to-end: kierowca włącza GPS → pozycja na mapie w biurze
3. Web Push (VAPID) — obecnie Notification API + inbox lokalny
4. v1.0 — portal sprzedaży abonamentów (tryb `saas`)

## Zasady

- Nowa funkcja → `src/lib/help/panel-help.ts`
- Sync: LWW per rekord; z Auth — JWT + RLS na Edge API
