# Deploy TransFlow

## Frontend — Vercel

1. Połącz repo GitHub z [Vercel](https://vercel.com)
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
