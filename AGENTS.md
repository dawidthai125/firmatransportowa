# TransFlow — instrukcja dla agentów AI

## START HERE

```text
1. AGENTS.md             ← ten plik
2. PROJECT-GUIDE.md      ← jak działa projekt
3. docs/ARCHITECTURE.md  ← architektura multi-tenant + transport
4. CURRENT-TASK.md       ← stan prac
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

## Kolejność rozwoju (Faza 1)

1. Model danych: `Course`, `Driver`, `Vehicle`, `DailyReport`
2. CRUD kursów + kartoteka floty/kierowców
3. Panel kierowcy — raport dzienny
4. Supabase + sync (wzorzec `cloud-sync.ts` z wgdom)
5. Compliance alerty (dokumenty, ADR)
