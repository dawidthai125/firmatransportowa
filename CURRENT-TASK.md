# CURRENT-TASK — TransFlow / Tajski-Trans

**Ostatnia sesja:** 2026-05-30 · **v0.10.0**

## Skończone ✅

- [x] v0.9.0 — asystent pomocy (`panel-help.ts`)
- [x] v0.9.1 — PWA kierowcy (manifest, SW, baner instalacji)
- [x] **v0.10.0 — Supabase Auth + RLS + mapa GPS:**
  - Tabela `tenant_members` + RLS + trigger powiązania auth.users
  - Logowanie emailem przez Supabase (fallback demo `demo2026`)
  - Edge Function: JWT → dostęp tylko do kluczy swojego tenant
  - Cloud sync wysyła JWT zamiast samego anon key
  - Mapa floty (Leaflet/OSM) na pulpicie właściciela/dyspozytora

## Następne kroki

1. **Uruchomić migrację SQL** w Supabase (`20260530200000_auth_tenant_members.sql`)
2. Telemetria GPS z PWA kierowcy (geolocation API)
3. v1.0 — portal sprzedaży abonamentów (tryb `saas`)

## Zasady

- Nowa funkcja → `src/lib/help/panel-help.ts`
- Sync: LWW per rekord; z Auth — JWT + RLS na Edge API
