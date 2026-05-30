# TransFlow — przewodnik developera / agenta AI

**Autor systemu:** Dawid Thai Thanh

## START HERE (kolejność obowiązkowa)

```text
1. docs/SYSTEM-OVERVIEW.md          ← mapa całego systemu (CZYTAJ NAJPIERW)
2. src/lib/catalog/app-features.ts  ← rejestr funkcji (aktualizuj przy każdej zmianie)
3. PROJECT-GUIDE.md
4. docs/ARCHITECTURE.md
5. docs/SUPABASE-ARCHITECTURE.md
6. CURRENT-TASK.md
```

## Zasady

- **Multi-tenant od początku** — każda firma izolowana (`tenantId`, scoped storage)
- **Katalog funkcji** — każda nowa/usunięta funkcja → wpis w `src/lib/catalog/app-features.ts` + widok „Funkcje” w adminie
- **Nie mieszaj domeny transportu z innymi projektami** — encje: kurs, flota, kierowca
- **Mobile-first dla kierowcy** — touch 44px, font input 16px, PWA
- Wzorzec: offline-first, sync Supabase KV + Edge `transflow-api`

## Dodajesz funkcję?

1. Wpis w `src/lib/catalog/app-features.ts`
2. Widok → `navigation.ts` + `App.tsx` + `panel-help.ts`
3. Dane → `TenantDataKey` + store + merge-strategy
4. `npm run build`

## Komendy

```bash
npm run dev      # http://127.0.0.1:5174
npm run build
```

## Demo login

- Kod firmy: `DEMO-TRANS`
- Role: owner / dispatcher / driver / mechanic
- Hasło demo: `demo2026`

## Supabase

- Osobny projekt (nie inne repozytoria)
- Setup: `SUPABASE-SETUP.md`
- Sync: `docs/SUPABASE-ARCHITECTURE.md`
