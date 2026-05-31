import type { Course } from '@/lib/domain/course'
import { courseReadyForInvoicing } from '@/lib/domain/course-documents-readiness'
import type { InvoicingConfig } from '@/lib/domain/invoicing-config'

export interface InvoiceLine {
  courseId: string
  reference: string
  buyerName: string
  description: string
  netPln: number
  vatRate: number
  issueDate: string
  dueDate: string
}

function addDays(isoDate: string, days: number): string {
  const d = new Date(isoDate)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export function buildInvoiceLinesFromCourses(
  courses: Course[],
  config: InvoicingConfig,
): InvoiceLine[] {
  const today = new Date().toISOString().slice(0, 10)
  return courses
    .filter(courseReadyForInvoicing)
    .map((c) => ({
      courseId: c.id,
      reference: c.reference,
      buyerName: c.consignee || c.shipper,
      description: `Transport ${c.loadCity} → ${c.unloadCity} · ${c.cargo}`,
      netPln: c.freightPln,
      vatRate: config.defaultVatRate ?? 23,
      issueDate: today,
      dueDate: addDays(today, config.defaultPaymentDays),
    }))
}

export function exportInvoicesCsv(lines: InvoiceLine[], config: InvoicingConfig): string {
  const header = [
    'Numer_zlecenia',
    'Nabywca',
    'Opis',
    'Netto_PLN',
    'VAT_%',
    'Brutto_PLN',
    'Data_wystawienia',
    'Termin_platnosci',
    'Sprzedawca_NIP',
  ]
  const rows = lines.map((l) => {
    const gross = l.netPln * (1 + l.vatRate / 100)
    return [
      l.reference,
      l.buyerName,
      l.description,
      l.netPln.toFixed(2),
      String(l.vatRate),
      gross.toFixed(2),
      l.issueDate,
      l.dueDate,
      config.sellerNip ?? '',
    ]
  })
  return [header, ...rows].map((r) => r.map(escapeCsv).join(';')).join('\n')
}

/** Format zgodny z importem Fakturownia (uproszczony CSV) */
export function exportFakturowniaCsv(lines: InvoiceLine[], config: InvoicingConfig): string {
  const header = [
    'numer',
    'nabywca_nazwa',
    'pozycja_nazwa',
    'pozycja_ilosc',
    'pozycja_cena_netto',
    'pozycja_stawka_vat',
    'data_wystawienia',
    'termin_platnosci',
    'sprzedawca_nip',
  ]
  const rows = lines.map((l) => [
    `FT/${l.reference}`,
    l.buyerName,
    l.description,
    '1',
    l.netPln.toFixed(2),
    String(l.vatRate),
    l.issueDate,
    l.dueDate,
    config.sellerNip ?? '',
  ])
  return [header, ...rows].map((r) => r.map(escapeCsv).join(';')).join('\n')
}

export function exportWfirmaCsv(lines: InvoiceLine[], config: InvoicingConfig): string {
  const header = [
    'Numer_dokumentu',
    'Kontrahent',
    'Tresc',
    'Kwota_netto',
    'Stawka_VAT',
    'Data_sprzedazy',
    'Termin_platnosci',
    'NIP_sprzedawcy',
  ]
  const rows = lines.map((l) => [
    `WF/${l.reference}`,
    l.buyerName,
    l.description,
    l.netPln.toFixed(2),
    String(l.vatRate),
    l.issueDate,
    l.dueDate,
    config.sellerNip ?? '',
  ])
  return [header, ...rows].map((r) => r.map(escapeCsv).join(';')).join('\n')
}

function escapeCsv(value: string): string {
  if (value.includes(';') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
