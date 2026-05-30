# CURRENT-TASK — TransFlow

**Ostatnia sesja:** 2026-05-30 · **v0.4.0**

## Skończone ✅

- [x] v0.1–0.3 — layout, multi-tenant, kursy, kierowcy, flota, compliance
- [x] **v0.4 — Supabase (osobny projekt, NIE wgdom):**
  - Tabela `kv_store_transflow` + migracja SQL
  - Edge Function `transflow-api` (batch-get / batch-set)
  - `cloud-sync.ts` — pull przy starcie, push debounce 2s
  - CloudLoader + badge statusu w headerze
  - Vercel `vercel.json` + `DEPLOY.md`
  - GitHub Action deploy Supabase
  - Docs: `SUPABASE-SETUP.md`, `docs/SUPABASE-ARCHITECTURE.md`, reguła Cursor

## Wymaga działania użytkownika 🔧

1. **Nowy projekt Supabase** (supabase.com → New project)
2. Uruchomić SQL z `supabase/migrations/20260530100000_init.sql`
3. GitHub Secrets: `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`
4. `.env` lokalnie z `.env.example`
5. **Vercel** — import repo + zmienne `VITE_*`

## Następne kroki (dev)

1. Raport dzienny kierowcy
2. Auth Supabase (email/hasło)
3. PWA + domena produkcyjna
