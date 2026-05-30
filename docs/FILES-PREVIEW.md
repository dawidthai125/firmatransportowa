# Podgląd plików — TransFlow

Każdy typ pliku ma **dedykowany viewer** w aplikacji. Eksport i import otwierają podgląd zamiast natychmiastowego pobierania — stamtąd można **pobrać**, **wydrukować** (HTML/PDF) lub **zapisać do biblioteki**.

## Viewery

| Typ | Rozszerzenia | Viewer |
|-----|--------------|--------|
| CSV | `.csv` | Tabela z przewijaniem |
| PDF | `.pdf` | iframe (natywny podgląd przeglądarki) |
| Obraz | `.png`, `.jpg`, `.webp`, `.gif` | Podgląd z zoom |
| Tekst | `.txt`, `.log` | Monospace |
| JSON | `.json` | Sformatowany JSON |
| HTML | `.html` | iframe + druk |
| Binarny | `.ddd`, `.xlsx`, `.doc` | Info + pobieranie |

## Gdzie w UI

- **Rozliczenia** — eksport CSV / PDF / HTML → podgląd
- **Pliki** — biblioteka firmy + import (CMR, skany, CSV)
- Modal globalny (`FilePreviewProvider`) — dostępny z całej aplikacji

## Sync

Pliki w bibliotece (`ft-{tenantId}-files`) synchronizują się przez Supabase KV (max ~512 KB na plik w dev).

## v0.7+

- Supabase Storage dla dużych PDF / skanów
- Podgląd e-CMR z podpisem
- Import tachografu DDD z metadanymi
