# CURRENT-TASK — TransFlow / Tajski-Trans

**Ostatnia sesja:** 2026-05-30 · **v0.9.1**

## Skończone ✅

- [x] v0.8.4 — branding Tajski-Trans (tryb company, ukryty SaaS)
- [x] v0.8.5 — naprawa zdjęć tła portalu
- [x] v0.9.0 — asystent pomocy w każdym panelu (`panel-help.ts`)
- [x] **v0.9.1 — PWA dla kierowcy:**
  - Manifest + ikony (192/512, maskable, apple-touch)
  - Service worker (Workbox, cache assetów + Unsplash + Supabase network-first)
  - Baner instalacji (Android + instrukcja iOS Safari)
  - Wskaźnik offline w panelu kierowcy
  - Auto-update SW w produkcji

## Następne kroki (plan)

1. **Supabase Auth + RLS** — prawdziwe logowanie zamiast demo
2. **GPS / mapa floty** — lokalizacja pojazdów na pulpicie
3. v1.0 — portal sprzedaży abonamentów (tryb `saas`)

## Zasady

- **Nowa funkcja** → uzupełnij `src/lib/help/panel-help.ts`
- **Sync:** najświeższy rekord wygrywa (LWW), nie cały plik z jednej przeglądarki
