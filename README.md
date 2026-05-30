# TransFlow — firma transportowa

> System **wyłącznie dla firm TSL** — ułatwia pracę **właścicielowi** (flota, marże, compliance) i **kierowcy** (raport z kabiny, kurs, awaria).

**Autor:** Dawid Thai Thanh · **Status:** v0.17.2

## Szybki start

```bash
cp .env.example .env   # NOWY projekt Supabase (nie wgdom!)
npm install
npm run dev
```

**Demo:** https://firmatransportowa.vercel.app  
Kod firmy: `DEMO-TRANS` · hasło email: `demo2026`

| Rola | Email |
|------|-------|
| Właściciel | wlasciciel@demo-trans.pl |
| Dyspozytor | dyspozytor@demo-trans.pl |
| Kierowca | jan.kowalski@demo-trans.pl |
| Mechanik | mechanik@demo-trans.pl |

## Dokumentacja

| Plik | Opis |
|------|------|
| [PROJECT-GUIDE.md](./PROJECT-GUIDE.md) | Jak działa projekt |
| [docs/DOMAIN-TRANSPORT.md](./docs/DOMAIN-TRANSPORT.md) | Wymagania branży TSL |
| [CURRENT-TASK.md](./CURRENT-TASK.md) | Stan prac |

## Stack

React 19 · Vite 8 · TypeScript · Tailwind 4 · Supabase KV · Vercel
