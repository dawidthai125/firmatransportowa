# TransFlow — firma transportowa

> System zarządzania firmą transportową (SaaS multi-tenant).  
> Wzorowany na architekturze [wgdom](https://github.com/dawidthai125/wgdom), dostosowany do branży TSL.

**Status:** v0.4.0 — Supabase sync + Vercel ready

## Szybki start

```bash
cp .env.example .env   # NOWY projekt Supabase (nie wgdom!)
npm install
npm run dev
```

Pełna konfiguracja chmury: **[SUPABASE-SETUP.md](./SUPABASE-SETUP.md)**  
Deploy frontendu: **[DEPLOY.md](./DEPLOY.md)** (Vercel)

Aplikacja: http://127.0.0.1:5174

**Logowanie testowe:**
- Kod firmy: `DEMO-TRANS`
- Role: Właściciel / Dyspozytor / Kierowca

## Dokumentacja

| Plik | Opis |
|------|------|
| [PROJECT-GUIDE.md](./PROJECT-GUIDE.md) | Jak działa projekt |
| [AGENTS.md](./AGENTS.md) | Instrukcja dla agentów AI |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | Architektura techniczna |
| [CURRENT-TASK.md](./CURRENT-TASK.md) | Stan prac |

## Stack

React 19 · Vite 8 · TypeScript · Tailwind 4 · lucide-react

Docelowo (jak wgdom): Supabase · PWA · Capacitor · Vercel

## Multi-tenant (SaaS)

Każda firma = **tenant** z własnym kodem (`slug`), izolowanymi danymi (`ft-{tenantId}-*`) i planem abonamentowym (moduły włącz/wyłącz).

Na start: localStorage + firma demo. Produkcja: Supabase z `tenant_id` na każdym rekordzie + RLS.
