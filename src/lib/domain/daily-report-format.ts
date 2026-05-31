/** Etykiety i formatowanie kosztów raportu dziennego — kwoty brutto (zapłacone przez kierowcę). */

export const TOLL_FIELD_LABEL_PLN = 'Opłaty drogowe (zł)'
export const TOLL_FIELD_LABEL_EUR = 'Opłaty drogowe (EUR)'
export const TOLL_FIELD_HINT =
  'Autostrady, winiety, promy — kwota brutto zapłacona przez kierowcę. Suma „Koszty łącznie” obejmuje tylko zł.'

export const COURSE_TOLL_FIELD_LABEL = 'Opłaty drogowe (EUR)'

export function formatDailyReportTollPln(amount: number): string {
  return `Opłaty drogowe: ${amount.toLocaleString('pl-PL')} zł`
}

export function formatDailyReportTollEur(amount: number): string {
  return `Opłaty drogowe: ${amount} EUR`
}

export function formatCourseTollEur(amount: number): string {
  return `Opłaty drogowe: ${amount} EUR`
}

export function formatDailyReportFuel(liters: number, costPln?: number): string {
  if (costPln != null && costPln > 0) {
    return `Paliwo: ${liters} l · ${costPln.toLocaleString('pl-PL')} zł`
  }
  return `Paliwo: ${liters} l`
}

export function formatDailyReportParking(amount: number): string {
  return `Parking: ${amount.toLocaleString('pl-PL')} zł`
}

export function formatDailyReportOtherCosts(amount: number): string {
  return `Inne koszty: ${amount.toLocaleString('pl-PL')} zł`
}
