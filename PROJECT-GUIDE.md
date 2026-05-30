# TransFlow — PROJECT GUIDE

> **Jak działa ten projekt?** Pełna architektura → [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)

**Produkcja:** (dev) · **Stack:** React/Vite · docelowo Supabase + Vercel + PWA

---

## Cel produktu

System dla **małych i średnich firm transportowych** (TSL):
- **Właściciel** — koszty, flota, alerty, rentowność
- **Dyspozytor** — kursy, przypisania, operacje
- **Kierowca** (mobile) — raport dzienny, kursy, koniec pracy

Model biznesowy: **SaaS multi-tenant** — każda firma to osobny tenant (abonament, moduły).

---

## Role i widoki

| Rola | Shell | Widoki |
|------|-------|--------|
| `owner` | AdminShell | Pulpit, **Funkcje**, Kursy, Giełda, Flota, … |
| `dispatcher` | AdminShell | Pulpit, **Funkcje**, Kursy, Giełda, Flota, … |
| `driver` | DriverShell | Start, Kursy, Raport, Awaria, ITD, Profil |
| `mechanic` | MechanicShell | Naprawy |

**Katalog wszystkich funkcji:** `src/lib/catalog/app-features.ts` + zakładka admin **Funkcje** + `docs/SYSTEM-OVERVIEW.md`

---

## Multi-tenant — zasada

1. **Tenant** — firma klienta (`id`, `slug`, `plan`, `modules`)
2. **Dane** — klucze `ft-{tenantId}-{key}` w localStorage (dev)
3. **Logowanie** — kod firmy + rola (docelowo: email/hasło + tenant)
4. **Abonament** — `TenantModules` włącza/wyłącza moduły w UI

Demo: kod **`DEMO-TRANS`**

---

## Struktura katalogów

```
src/
  app/
    App.tsx           # routing po roli
    LoginScreen.tsx
    shells/           # AdminShell, DriverShell
    views/            # widoki placeholder
    components/
  lib/
    tenant/           # types, context, storage
    auth/             # session
    navigation.ts
  styles/
docs/
```

---

## Powiązane dokumenty

| Plik | Rola |
|------|------|
| [`AGENTS.md`](AGENTS.md) | Jak pracować nad projektem |
| [`CURRENT-TASK.md`](CURRENT-TASK.md) | Gdzie skończyliśmy |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Architektura SaaS + transport |

Wzorzec dokumentacji: repozytorium **wgdom**.
