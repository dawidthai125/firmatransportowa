# CURRENT-TASK — TransFlow / Tajski-Trans

**Ostatnia sesja:** 2026-05-30 · **v0.12.0**

## Skończone ✅

- [x] v0.11.0 — profil kierowcy, GPS PWA, wyjątki na pulpicie
- [x] **v0.12.0 — giełda ładunków + moduł ITD:**
  - Giełda ładunków (właściciel + dyspozytor): agregacja Trans.eu, TimoCom, Teleroute, 123cargo, Transporeon, e-mail, sieć partnerska
  - Filtry branżowe: nadwozie, stawka/km, płatność, ADR, kabotaż, baza, koretarz, ocena zleceniodawcy
  - ITD: instrukcja kierowcy (edycja owner / częściowa dispatcher), alert kontroli, wyniki + protokół, mapa punktów kontroli

## Następne kroki

1. Integracja API giełd (Trans.eu / TimoCom) — obecnie demo + leady
2. Upload plików protokołu ITD (obecnie nazwa pliku)
3. Web Push (VAPID)
4. v1.0 — portal SaaS

## Zasady

- Nowa funkcja → `src/lib/help/panel-help.ts`
- Instrukcja ITD oparta na przepisach GITD — nie „omijanie kontroli”, tylko prawa i procedury
