# CURRENT-TASK — TransFlow

**Ostatnia sesja:** 2026-05-30 · **v0.7.1**

## Skończone ✅

- [x] v0.7.0 — podgląd plików, biblioteka, auth demo
- [x] **v0.7.1 — Automatyzacja in-app:**
  - Silnik reguł (`src/lib/automation/`)
  - Dzwonek powiadomień w headerze
  - Moduł **Automatyzacje** (włącz/wyłącz reguły)
  - Auto: compliance daily, weekly CSV, alerty 561/2006, CMR/RMPD, sync po końcu zmiany
  - Webhook stub w `transflow-api`
  - `docs/AUTOMATION.md`

## Następne kroki

1. Supabase Auth + email z backendu (Resend)
2. pg_cron — przypomnienia w chmurze gdy nikt nie otworzy app
3. Cursor Automations — deploy/ops (szablony w docs)
