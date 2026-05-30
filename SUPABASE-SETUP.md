# TransFlow — konfiguracja NOWEGO Supabase

> **WAŻNE:** Ten projekt używa **osobnego** Supabase.  
> **NIE** podłączaj projektu wgdom (limit stron / KV).

---

## Krok 1 — Utwórz projekt

1. [supabase.com/dashboard](https://supabase.com/dashboard) → **New project**
2. Nazwa np. `transflow-prod` lub `firmatransportowa`
3. Region: **Frankfurt** (eu-central-1) — blisko Polski
4. Zapisz hasło bazy (bezpieczne miejsce)

Po utworzeniu skopiuj **Project ID** (ref) z: Settings → General.

---

## Krok 2 — Tabela KV (baza danych)

W **SQL Editor** wklej i uruchom plik:

`supabase/migrations/20260530100000_init.sql`

Tworzy tabelę `kv_store_transflow` (osobna od `kv_store_0afb8820` w wgdom).

---

## Krok 3 — Edge Function `transflow-api`

### Opcja A — GitHub Actions (zalecane)

W repo GitHub → **Settings → Secrets → Actions**:

| Secret | Wartość |
|--------|---------|
| `SUPABASE_ACCESS_TOKEN` | [Account tokens](https://supabase.com/dashboard/account/tokens) |
| `SUPABASE_PROJECT_REF` | Project ID nowego projektu |

Push na `main` z folderem `supabase/functions/` uruchomi deploy.

### Opcja B — Lokalnie (CLI)

```bash
npm install -g supabase
supabase login
supabase functions deploy transflow-api --project-ref TWOJ_PROJECT_REF
```

Test:

```bash
curl https://TWOJ_PROJECT_REF.supabase.co/functions/v1/transflow-api/health
# → {"status":"ok","service":"transflow-api"}
```

---

## Krok 4 — Zmienne frontend (.env)

Skopiuj `.env.example` → `.env`:

```env
VITE_SUPABASE_PROJECT_ID=twoj-nowy-project-ref
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_SUPABASE_FUNCTION_SLUG=transflow-api
```

Anon key: Project Settings → API → `anon` `public`.

Restart dev server: `npm run dev`

---

## Krok 5 — Vercel (hosting frontendu)

1. [vercel.com](https://vercel.com) → **Add New Project**
2. Import repo `dawidthai125/firmatransportowa`
3. Framework: **Vite** (wykryje automatycznie)
4. **Environment Variables** (Production + Preview):

| Zmienna | Wartość |
|---------|---------|
| `VITE_SUPABASE_PROJECT_ID` | ten sam ref co wyżej |
| `VITE_SUPABASE_ANON_KEY` | anon key |
| `VITE_SUPABASE_FUNCTION_SLUG` | `transflow-api` |

5. Deploy → dostaniesz URL typu `firmatransportowa.vercel.app`

Opcjonalnie: własna domena w Vercel → Settings → Domains.

---

## Architektura chmury

```
Przeglądarka / Vercel SPA
        │
        ▼ batch-get / batch-set
Edge Function: transflow-api
        │
        ▼ service_role
Tabela: kv_store_transflow
  ├── ft-tenants-registry
  ├── ft-{tenantId}-courses
  ├── ft-{tenantId}-drivers
  └── ft-{tenantId}-vehicles
```

Sync: `src/lib/cloud-sync.ts` — pull przy starcie, push debounce 2s po zapisie.

---

## Rozwiązywanie problemów

| Problem | Rozwiązanie |
|---------|-------------|
| „Chmura niedostępna” | Sprawdź health URL, czy funkcja wdrożona |
| Dane nie syncują | DevTools → Network → batch-set 200? |
| 401 / CORS | Edge Function `verify_jwt = false` w config.toml |
| Pusty pull | Pierwszy push — zaloguj się, edytuj kurs, poczekaj 2s |

---

## Przyszłość (v1+)

- Auth Supabase (email/hasło per użytkownik)
- RLS na tabelach relacyjnych (gdy wyjdziemy poza KV)
- Storage na CMR / zdjęcia

Na razie KV wystarczy jak w wczesnym wgdom.
