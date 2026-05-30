# TransFlow — przewodnik developera

**Autor systemu:** Dawid Thai Thanh

## START HERE

```text
1. AGENTS.md
2. PROJECT-GUIDE.md
3. docs/ARCHITECTURE.md
4. docs/SUPABASE-ARCHITECTURE.md   ← sync, klucze, Edge API
5. SUPABASE-SETUP.md               ← setup NOWEGO projektu (NIE wgdom)
6. CURRENT-TASK.md
```

## Zasady

- **Multi-tenant od początku** — każda firma izolowana (`tenantId`, scoped storage)
- **Nie mieszaj domeny transportu z wgdom** — inne encje: kurs, flota, kierowca (nie „robota”)
- **Mobile-first dla kierowcy** — touch 44px, font input 16px
- Wzorzec tech z wgdom: offline-first, sync chmura (docelowo Supabase)

## Komendy

```bash
npm run dev      # http://127.0.0.1:5174
npm run build
```

## Demo login

- Kod firmy: `DEMO-TRANS`
- Role: owner / dispatcher / driver

## Supabase

- **Osobny projekt** — NIE wgdom (limit / inna tabela KV)
- Setup: `SUPABASE-SETUP.md`
- Sync: `docs/SUPABASE-ARCHITECTURE.md`
- Nie zmieniaj merge w `cloud-sync.ts` bez przeczytania docs
