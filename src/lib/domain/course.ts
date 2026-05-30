export type CourseStatus =
  | 'planned'
  | 'loading'
  | 'in_transit'
  | 'delivered'
  | 'completed'
  | 'cancelled'

export interface Course {
  id: string
  tenantId: string
  /** Numer zlecenia / referencja */
  reference: string
  status: CourseStatus
  /** Nadawca */
  shipper: string
  /** Odbiorca */
  consignee: string
  /** Opis ładunku */
  cargo: string
  /** Waga w kg */
  weightKg?: number
  /** Transport ADR */
  adr: boolean
  /** Miasto załadunku */
  loadCity: string
  /** Miasto rozładunku */
  unloadCity: string
  /** Planowane km */
  plannedKm?: number
  /** Fracht (przychód) PLN */
  freightPln: number
  /** Koszty trasy PLN */
  routeCostsPln?: number
  /** Termin załadunku ISO */
  loadAt: string
  /** Termin rozładunku ISO */
  unloadAt: string
  /** ID kierowcy (opcjonalnie) */
  driverId?: string
  /** ID pojazdu (opcjonalnie) */
  vehicleId?: string
  notes?: string
  createdAt: string
  updatedAt: string
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
    shipper: '',
    consignee: '',
    cargo: '',
    adr: false,
    loadCity: '',
    unloadCity: '',
    freightPln: 0,
    loadAt: now.toISOString().slice(0, 16),
    unloadAt: tomorrow.toISOString().slice(0, 16),
  }
}

export function courseMargin(course: Course): number {
  const costs = course.routeCostsPln ?? 0
  return course.freightPln - costs
}
