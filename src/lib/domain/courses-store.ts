import type { Course } from '@/lib/domain/course'
import { readTenantData, writeTenantData } from '@/lib/tenant/storage'

export function loadCourses(tenantId: string): Course[] {
  const raw = readTenantData<Course[]>(tenantId, 'courses', [])
  return raw.map(normalizeCourse)
}

function normalizeCourse(c: Course): Course {
  return {
    ...c,
    scope: c.scope ?? 'domestic',
    loadCountry: c.loadCountry ?? 'PL',
    unloadCountry: c.unloadCountry ?? 'PL',
  }
}

export function saveCourses(tenantId: string, courses: Course[]): void {
  writeTenantData(tenantId, 'courses', courses)
}

export function upsertCourse(tenantId: string, course: Course): Course[] {
  const courses = loadCourses(tenantId)
  const idx = courses.findIndex((c) => c.id === course.id)
  const next = [...courses]
  if (idx >= 0) next[idx] = course
  else next.unshift(course)
  saveCourses(tenantId, next)
  return next
}

export function deleteCourse(tenantId: string, courseId: string): Course[] {
  const next = loadCourses(tenantId).filter((c) => c.id !== courseId)
  saveCourses(tenantId, next)
  return next
}

export function seedDemoCourses(tenantId: string): Course[] {
  const existing = loadCourses(tenantId)
  if (existing.length > 0) return existing

  const now = new Date().toISOString()
  const demo: Course[] = [
    {
      id: 'course-demo-001',
      tenantId,
      reference: 'K/2026/001',
      status: 'in_transit',
      scope: 'domestic',
      shipper: 'Fabryka Mebli Sp. z o.o.',
      consignee: 'Market Bud Sp. z o.o.',
      cargo: 'Palety mebli — 22 epal',
      weightKg: 18400,
      adr: false,
      loadCity: 'Wrocław',
      unloadCity: 'Warszawa',
      loadCountry: 'PL',
      unloadCountry: 'PL',
      plannedKm: 350,
      freightPln: 4200,
      routeCostsPln: 980,
      loadAt: new Date(Date.now() - 86400000).toISOString(),
      unloadAt: new Date(Date.now() + 3600000).toISOString(),
      notes: 'Rozładunek do 14:00',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'course-demo-002',
      tenantId,
      reference: 'K/2026/002',
      status: 'planned',
      scope: 'domestic',
      shipper: 'ChemTrans Logistics',
      consignee: 'Zakłady Chemiczne Poznań',
      cargo: 'Substancje ADR kl. 3',
      weightKg: 12000,
      adr: true,
      loadCity: 'Gdańsk',
      unloadCity: 'Poznań',
      loadCountry: 'PL',
      unloadCountry: 'PL',
      plannedKm: 280,
      freightPln: 5800,
      routeCostsPln: 1200,
      loadAt: new Date(Date.now() + 86400000 * 2).toISOString(),
      unloadAt: new Date(Date.now() + 86400000 * 3).toISOString(),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'course-demo-003',
      tenantId,
      reference: 'K/2026/INT-01',
      status: 'planned',
      scope: 'international_eu',
      shipper: 'AutoParts Wrocław',
      consignee: 'Logistik GmbH Berlin',
      cargo: 'Części samochodowe — 18 palet',
      weightKg: 15200,
      adr: false,
      loadCity: 'Wrocław',
      unloadCity: 'Berlin',
      loadCountry: 'PL',
      unloadCountry: 'DE',
      plannedKm: 340,
      freightPln: 0,
      freightEur: 1450,
      routeCostsPln: 600,
      tollEur: 85,
      cmrNumber: 'CMR/2026/004521',
      licenseExtractNo: 'WYP/2026/12',
      loadAt: new Date(Date.now() + 86400000).toISOString(),
      unloadAt: new Date(Date.now() + 86400000 * 2).toISOString(),
      notes: 'Myto DE — winieta w pojeździe',
      createdAt: now,
      updatedAt: now,
    },
  ]

  saveCourses(tenantId, demo)
  return demo
}
