import type { Course } from '@/lib/domain/course'
import type { DailyReport } from '@/lib/domain/daily-report'
import { dailyReportTotalCosts } from '@/lib/domain/daily-report'
import type { ClientMarginSummary, DriverWeeklySummary } from '@/lib/domain/settlements'
import { defaultMimeForKind } from '@/lib/files/detect-kind'
import type { PreviewableFile } from '@/lib/files/types'
import { buildSimplePdf } from '@/lib/files/pdf-builder'

function escapeCsv(value: string | number | boolean | undefined | null): string {
  if (value == null) return ''
  const s = String(value)
  if (s.includes('"') || s.includes(',') || s.includes('\n') || s.includes(';')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function rowsToCsv(rows: (string | number | boolean | null | undefined)[][]): string {
  const bom = '\uFEFF'
  return bom + rows.map((row) => row.map(escapeCsv).join(';')).join('\r\n')
}

function csvFile(filename: string, label: string, rows: (string | number | boolean | null | undefined)[][]): PreviewableFile {
  const textContent = rowsToCsv(rows)
  return {
    filename,
    kind: 'csv',
    mimeType: defaultMimeForKind('csv'),
    textContent,
    source: 'export',
    createdAt: new Date().toISOString(),
    label,
    sizeBytes: new TextEncoder().encode(textContent).length,
  }
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

export function buildDailyReportsCsvFile(reports: DailyReport[], tenantSlug: string): PreviewableFile {
  const header = [
    'Data', 'Kierowca', 'Kurs', 'Km', 'Paliwo_l', 'Paliwo_zl', 'Myto_zl', 'Myto_EUR',
    'Parking_zl', 'Inne_zl', 'Koszty_lacznie_zl', 'Jazda_min', 'Postoj_min', 'Granica',
    'Koniec_pracy', 'Uwagi',
  ]
  const rows = reports.map((r) => [
    r.date, r.driverName, r.courseReference ?? '', r.kmDriven,
    r.fuelLiters ?? '', r.fuelCostPln ?? '', r.tollPln ?? '', r.tollEur ?? '',
    r.parkingPln ?? '', r.otherCostsPln ?? '', dailyReportTotalCosts(r),
    r.drivingMinutes ?? '', r.restMinutes ?? '', r.borderCrossings ?? '',
    r.shiftEnded ? 'tak' : 'nie', r.notes ?? '',
  ])
  return csvFile(
    `transflow-raporty-${tenantSlug}-${todayIso()}.csv`,
    'Eksport raportów dziennych',
    [header, ...rows],
  )
}

export function buildWeeklySummariesCsvFile(
  summaries: DriverWeeklySummary[],
  tenantSlug: string,
  weekStart: string,
): PreviewableFile {
  const header = ['Tydzien_od', 'Kierowca', 'Dni_raportow', 'Km_lacznie', 'Jazda_min', 'Koszty_zl', 'Dni_koniec_pracy']
  const rows = summaries.map((s) => [
    weekStart, s.driverName, s.daysReported, s.totalKm, s.totalDrivingMinutes, s.totalCostsPln, s.shiftEndedDays,
  ])
  return csvFile(
    `transflow-tydzien-${tenantSlug}-${weekStart}.csv`,
    `Podsumowanie tygodnia od ${weekStart}`,
    [header, ...rows],
  )
}

export function buildCoursesCsvFile(courses: Course[], tenantSlug: string): PreviewableFile {
  const header = ['Referencja', 'Status', 'Zakres', 'Nadawca', 'Odbiorca', 'Trasa', 'Fracht_PLN', 'Fracht_EUR', 'Koszty_PLN', 'CMR']
  const rows = courses.map((c) => [
    c.reference, c.status, c.scope, c.shipper, c.consignee,
    `${c.loadCity} (${c.loadCountry}) → ${c.unloadCity} (${c.unloadCountry})`,
    c.freightPln, c.freightEur ?? '', c.routeCostsPln ?? '', c.cmrNumber ?? '',
  ])
  return csvFile(
    `transflow-kursy-${tenantSlug}-${todayIso()}.csv`,
    'Eksport kursów',
    [header, ...rows],
  )
}

export function buildClientMarginsCsvFile(summaries: ClientMarginSummary[], tenantSlug: string): PreviewableFile {
  const header = ['Nadawca', 'Liczba_kursow', 'Fracht_PLN', 'Fracht_EUR', 'Koszty_PLN', 'Marza_PLN']
  const rows = summaries.map((s) => [s.shipper, s.courseCount, s.freightPln, s.freightEur, s.costsPln, s.marginPln])
  return csvFile(
    `transflow-marze-${tenantSlug}-${todayIso()}.csv`,
    'Marże per klient',
    [header, ...rows],
  )
}

export function buildSettlementPdfFile(
  tenantName: string,
  summaries: DriverWeeklySummary[],
  weekStart: string,
): PreviewableFile {
  const lines = [
    `TransFlow — podsumowanie tygodnia`,
    `Firma: ${tenantName}`,
    `Tydzień od: ${weekStart}`,
    `Wygenerowano: ${new Date().toLocaleString('pl-PL')}`,
    '',
    ...summaries.flatMap((s) => [
      `${s.driverName}: ${s.totalKm} km, koszty ${s.totalCostsPln} PLN`,
    ]),
  ]
  const blob = buildSimplePdf(lines)
  const filename = `transflow-tydzien-${weekStart}.pdf`
  return {
    filename,
    kind: 'pdf',
    mimeType: 'application/pdf',
    blob,
    source: 'export',
    createdAt: new Date().toISOString(),
    label: `PDF — tydzień ${weekStart}`,
    sizeBytes: blob.size,
  }
}

export function buildSettlementHtmlFile(
  tenantName: string,
  summaries: DriverWeeklySummary[],
  clientMargins: ClientMarginSummary[],
  weekStart: string,
): PreviewableFile {
  const html = `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="utf-8"/>
  <title>TransFlow — rozliczenie ${weekStart}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 900px; margin: 2rem auto; padding: 0 1rem; color: #111; }
    h1 { font-size: 1.25rem; }
    table { width: 100%; border-collapse: collapse; margin: 1rem 0; font-size: 0.875rem; }
    th, td { border: 1px solid #ccc; padding: 0.5rem; text-align: left; }
    th { background: #f4f4f5; }
    @media print { body { margin: 0; } }
  </style>
</head>
<body>
  <h1>TransFlow — rozliczenie tygodnia</h1>
  <p><strong>${tenantName}</strong> · tydzień od ${weekStart}</p>
  <h2>Kierowcy</h2>
  <table>
    <thead><tr><th>Kierowca</th><th>Dni</th><th>Km</th><th>Jazda (min)</th><th>Koszty (zł)</th></tr></thead>
    <tbody>
      ${summaries.filter((s) => s.daysReported > 0).map((s) => `
        <tr><td>${s.driverName}</td><td>${s.daysReported}</td><td>${s.totalKm}</td><td>${s.totalDrivingMinutes}</td><td>${s.totalCostsPln}</td></tr>
      `).join('')}
    </tbody>
  </table>
  <h2>Marże klientów</h2>
  <table>
    <thead><tr><th>Nadawca</th><th>Kursy</th><th>Marża PLN</th></tr></thead>
    <tbody>
      ${clientMargins.map((m) => `
        <tr><td>${m.shipper}</td><td>${m.courseCount}</td><td>${m.marginPln}</td></tr>
      `).join('')}
    </tbody>
  </table>
  <p style="color:#666;font-size:0.75rem">Wygenerowano ${new Date().toLocaleString('pl-PL')} · TransFlow</p>
</body>
</html>`

  return {
    filename: `transflow-rozliczenie-${weekStart}.html`,
    kind: 'html',
    mimeType: defaultMimeForKind('html'),
    textContent: html,
    source: 'export',
    createdAt: new Date().toISOString(),
    label: `Raport HTML — tydzień ${weekStart}`,
    sizeBytes: new TextEncoder().encode(html).length,
  }
}
