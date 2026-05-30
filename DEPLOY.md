# Deploy TransFlow

## Auto-deploy (GitHub Actions — już skonfigurowane)

| Co | Workflow | Secret w GitHub |
|----|----------|-----------------|
| **Supabase** Edge Function | `deploy-supabase.yml` | ✅ `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF` |
| **Vercel** frontend | `deploy-vercel.yml` | ⚠️ brakuje `VERCEL_TOKEN` — patrz niżej |

### Jednorazowo: token Vercel (Ty, 1 min)

1. https://vercel.com/account/tokens → **Create** (classic token)
2. GitHub repo → **Settings → Secrets → Actions** → New secret:
   - Name: `VERCEL_TOKEN`
   - Value: wklej token

Po tym każdy `git push main` = deploy Vercel + Supabase (gdy zmieni się kod).

**Supabase Dashboard → Git:** nie jest wymagany — deploy idzie przez GitHub Actions do projektu `roiainuiyqenfpkqixpv`.

## Frontend — Vercel (ręcznie / pierwszy deploy)

**Produkcja:** https://firmatransportowa.vercel.app

1. Połącz repo GitHub z [Vercel](https://vercel.com) (opcjonalnie — auto-deploy przy push)
2. Ustaw zmienne środowiskowe (patrz `SUPABASE-SETUP.md` krok 5)
3. Każdy push na `main` → auto-deploy

Plik `vercel.json` — SPA rewrite na `index.html`.

## Backend — Supabase (osobny projekt)

- **NIE** wgdom — nowy projekt Supabase
- Edge Function: `transflow-api`
- Deploy: GitHub Action `.github/workflows/deploy-supabase.yml`

## Lokalny dev

```bash
cp .env.example .env   # uzupełnij NOWY projekt Supabase
npm install
npm run dev            # http://127.0.0.1:5174
```

## Checklist przed pilotem u firmy

- [ ] Nowy projekt Supabase utworzony
- [ ] SQL migration uruchomiony
- [ ] Edge Function zdeployowana (health OK)
- [ ] Vercel z zmiennymi VITE_*
- [ ] Test: edycja kursu na PC → odświeżenie na telefonie (ta sama firma)
