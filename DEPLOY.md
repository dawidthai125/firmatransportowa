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

## Frontend — Vercel

**Produkcja:** https://firmatransportowa.vercel.app

Deploy idzie **tylko** przez GitHub Action `deploy-vercel.yml` (token `VERCEL_TOKEN`).

W `vercel.json`:
- `git.deploymentEnabled: false` — Vercel **nie** buduje przy pushu z GitHub (unika podwójnego deployu)
- `github.silent: true` — brak komentarzy `vercel[bot]` na commitach (GitHub nie wysyła maili „Successfully deployed…”)

Jeśli maile nadal przychodzą po pushu:
1. Vercel → projekt → **Settings → Git** → **Disconnect** (projekt zostaje; deploy tylko z Actions)
2. GitHub → [Notification settings](https://github.com/settings/notifications) → wyłącz e-mail przy **Comments on Issues and Pull Requests**
3. Vercel → [Account notifications](https://vercel.com/account/settings/notifications) → wyłącz **Email** przy deploymentach

Pierwszy setup: zmienne środowiskowe w Vercel (patrz `SUPABASE-SETUP.md` krok 5).

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
