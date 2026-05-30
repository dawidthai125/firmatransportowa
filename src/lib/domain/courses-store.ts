import type { Course } from '@/lib/domain/course'
import { readTenantData, writeTenantData } from '@/lib/tenant/storage'

export function loadCourses(tenantId: string): Course[] {
  return readTenantData<Course[]>(tenantId, 'courses', [])
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
      shipper: 'Fabryka Mebli Sp. z o.o.',
      consignee: 'Market Bud Sp. z o.o.',
      cargo: 'Palety mebli — 22 epal',
      weightKg: 18400,
      adr: false,
      loadCity: 'Wrocław',
      unloadCity: 'Warszawa',
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
      shipper: 'ChemTrans Logistics',
      consignee: 'Zakłady Chemiczne Poznań',
      cargo: 'Substancje ADR kl. 3',
      weightKg: 12000,
      adr: true,
      loadCity: 'Gdańsk',
      unloadCity: 'Poznań',
      plannedKm: 280,
      freightPln: 5800,
      routeCostsPln: 1200,
      loadAt: new Date(Date.now() + 86400000 * 2).toISOString(),
      unloadAt: new Date(Date.now() + 86400000 * 3).toISOString(),
      createdAt: now,
      updatedAt: now,
    },
  ]

  saveCourses(tenantId, demo)
  return demo
}
