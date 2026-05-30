# CURRENT-TASK — TransFlow

**Ostatnia sesja:** 2026-05-30 · **v0.8.2**

## Skończone ✅

- [x] v0.8.1 — spójność modułu awarii, status u kierowcy
- [x] **v0.8.2 — Bezpieczny sync wielu użytkowników:**
  - Merge LWW per rekord (`updatedAt`) — kierowcy, kursy, awarie, flota
  - Push read-modify-write (pobierz chmurę → scal → zapisz)
  - Pull nigdy nie nadpisuje ślepo lokalnych danych
  - Envelope `{ v, updatedAt, payload }` w localStorage/KV
  - Pull przy powrocie do karty (visibility)
  - UI odświeża się po merge (`useCloudSyncRefresh`)

## Następne kroki

1. PWA na telefon kierowcy
2. Supabase Auth + RLS
3. GPS / mapa floty

## Sync — zasada

Wielu adminów/kierowców/mechaników: **najświeższy rekord wygrywa**, nie cały plik z jednej przeglądarki.
