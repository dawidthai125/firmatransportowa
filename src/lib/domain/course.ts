import type { ECmrDocument } from '@/lib/domain/e-cmr'

export type CourseStatus =
  | 'planned'
  | 'loading'
  | 'in_transit'
  | 'delivered'
  | 'completed'
  | 'cancelled'

/** Załącznik do kursu — CMR, POD, inne */
export type CourseAttachmentKind = 'cmr' | 'pod' | 'other'

export interface CourseAttachment {
  id: string
  kind: CourseAttachmentKind
  name: string
  mimeType: string
  /** Data URL (demo) lub referencja do magazynu plików */
  dataUrl: string
  uploadedAt: string
  uploadedBy: string
}

/** Zakres geograficzny zlecenia */
export type CourseScope = 'domestic' | 'international_eu' | 'international_third'

export interface Course {
  id: string
  tenantId: string
  reference: string
  status: CourseStatus
  /** Krajowy / UE / poza UE (UA, TR…) */
  scope: CourseScope
  shipper: string
  consignee: string
  cargo: string
  weightKg?: number
  adr: boolean
  loadCity: string
  unloadCity: string
  /** Kod kraju ISO, np. PL, DE */
  loadCountry: string
  unloadCountry: string
  plannedKm?: number
  freightPln: number
  /** Fracht w EUR (często przy międzynarodowym) */
  freightEur?: number
  routeCostsPln?: number
  /** Myto / opłaty drogowe EUR */
  tollEur?: number
  /** Numer listu CMR */
  cmrNumber?: string
  /** Numer wypisu z licencji wspólnotowej (w kabinie) */
  licenseExtractNo?: string
  /** RMPD/SENT zarejestrowany (kraje spoza UE) */
  rmpdRegistered?: boolean
  /** SENT zarejestrowany (krajowy) */
  sentRegistered?: boolean
  /** Data ostatniej weryfikacji checklisty RMPD/SENT */
  rmpdCheckedAt?: string
  /** Zdjęcia CMR / POD */
  attachments?: CourseAttachment[]
  /** Ostatnia zmiana statusu z kabiny */
  statusUpdatedAt?: string
  statusUpdatedBy?: string
  /** Token publicznego śledzenia (portal klienta) */
  trackingToken?: string
  trackingPublic?: boolean
  /** Elektroniczny CMR (e-CMR) */
  eCmr?: ECmrDocument
  /** Faktura wystawiona (REST/CSV/API) */
  invoiceIssuedAt?: string
  /** Termin płatności od kontrahenta */
  paymentDueAt?: string
  /** Płatność otrzymana */
  paymentReceivedAt?: string
  loadAt: string
  unloadAt: string
  driverId?: string
  vehicleId?: string
  notes?: string
  createdAt: string
  updatedAt: string
  /** Czas zapisu w chmurze (UTC) */
  serverSavedAt?: string
}

export const COURSE_SCOPE_LABELS: Record<CourseScope, string> = {
  domestic: 'Kraj',
  international_eu: 'Międzynarodowy UE',
  international_third: 'Poza UE (AETR/RMPD)',
}

export const COURSE_STATUS_LABELS: Record<CourseStatus, string> = {
  planned: 'Zaplanowany',
  loading: 'Załadunek',
  in_transit: 'W trasie',
  delivered: 'Dostarczony',
  completed: 'Rozliczony',
  cancelled: 'Anulowany',
}

export const COURSE_STATUS_COLORS: Record<CourseStatus, string> = {
  planned: 'bg-muted text-muted-foreground',
  loading: 'bg-warning/15 text-warning',
  in_transit: 'bg-primary/15 text-primary',
  delivered: 'bg-accent text-accent-foreground',
  completed: 'bg-success/15 text-success',
  cancelled: 'bg-danger/15 text-danger',
}

export function createEmptyCourse(tenantId: string): Omit<Course, 'id' | 'createdAt' | 'updatedAt'> {
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)

  return {
    tenantId,
    reference: '',
    status: 'planned',
    scope: 'domestic',
    shipper: '',
    consignee: '',
    cargo: '',
    adr: false,
    loadCity: '',
    unloadCity: '',
    loadCountry: 'PL',
    unloadCountry: 'PL',
    freightPln: 0,
    loadAt: now.toISOString().slice(0, 16),
    unloadAt: tomorrow.toISOString().slice(0, 16),
  }
}

export function courseFreightDisplay(course: Course): string {
  if (course.freightPln > 0) {
    return `${course.freightPln.toLocaleString('pl-PL')} zł`
  }
  if (course.freightEur && course.freightEur > 0) {
    return `${course.freightEur.toLocaleString('pl-PL')} EUR`
  }
  return '—'
}

export function courseMargin(course: Course): number | null {
  const costs = course.routeCostsPln ?? 0
  if (course.freightPln > 0) return course.freightPln - costs
  return null
}

export function courseRouteLabel(course: Course): string {
  const from = `${course.loadCity} (${course.loadCountry})`
  const to = `${course.unloadCity} (${course.unloadCountry})`
  return `${from} → ${to}`
}
