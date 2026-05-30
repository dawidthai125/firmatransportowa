# TransFlow — projekt roiainuiyqenfpkqixpv

**URL:** https://roiainuiyqenfpkqixpv.supabase.co  
**Project ref:** `roiainuiyqenfpkqixpv`

## Checklist wdrożenia

- [ ] **SQL** — SQL Editor → uruchom `supabase/migrations/20260530100000_init.sql`
- [ ] **Edge Function** — deploy `transflow-api` (GitHub Secrets lub CLI)
- [ ] **Test health:** `GET .../functions/v1/transflow-api/health` → `{"status":"ok"}`
- [ ] **Vercel** — zmienne `VITE_*` (ten sam publishable key)

## GitHub Secrets

| Secret | Wartość |
|--------|---------|
| `SUPABASE_ACCESS_TOKEN` | https://supabase.com/dashboard/account/tokens |
| `SUPABASE_PROJECT_REF` | `roiainuiyqenfpkqixpv` |

## CLI (lokalnie)

```bash
npx supabase login
npx supabase link --project-ref roiainuiyqenfpkqixpv
npx supabase db push
npx supabase functions deploy transflow-api --project-ref roiainuiyqenfpkqixpv
```

## Klucze API

- Frontend używa **publishable key** (`sb_publishable_...`) w `.env` jako `VITE_SUPABASE_ANON_KEY`
- Nagłówek `apikey` + `Authorization: Bearer` — patrz `src/lib/cloud-sync.ts`
- **Nie commituj** `.env` ani hasła Postgres
