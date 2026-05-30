import { fireAutomation } from '@/lib/automation/bridge'
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
  fireAutomation(tenantId, 'course.saved', { course })
  if (course.scope !== 'domestic') {
    fireAutomation(tenantId, 'course.international', { course })
  }
  return next
}

export function deleteCourse(tenantId: string, courseId: string): Course[] {
  const next = loadCourses(tenantId).filter((c) => c.id !== courseId)
  saveCourses(tenantId, next)
  return next
}

const DEMO_UA_COURSE: Course = {
  id: 'course-demo-004',
  tenantId: 'tenant-demo-001',
  reference: 'K/2026/UA-01',
  status: 'planned',
  scope: 'international_third',
  shipper: 'TransCargo Lublin',
  consignee: 'Logistics UA Lviv',
  cargo: 'Części AGD — 20 palet',
  weightKg: 16800,
  adr: false,
  loadCity: 'Lublin',
  unloadCity: 'Lwów',
  loadCountry: 'PL',
  unloadCountry: 'UA',
  plannedKm: 420,
  freightPln: 0,
  freightEur: 980,
  routeCostsPln: 450,
  cmrNumber: 'CMR/2026/009812',
  licenseExtractNo: 'WYP/2026/08',
  rmpdRegistered: false,
  loadAt: new Date(Date.now() + 86400000).toISOString(),
  unloadAt: new Date(Date.now() + 86400000 * 2).toISOString(),
  notes: 'Demo — brak RMPD, alert na pulpicie',
  createdAt: '',
  updatedAt: '',
}

export function seedDemoCourses(tenantId: string): Course[] {
  const existing = loadCourses(tenantId)
  if (existing.length > 0) {
    if (!existing.some((c) => c.id === 'course-demo-004')) {
      const now = new Date().toISOString()
      const ua = { ...DEMO_UA_COURSE, tenantId, createdAt: now, updatedAt: now }
      const next = [...existing, ua]
      saveCourses(tenantId, next)
      return next
    }
    return existing
  }

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
      driverId: 'driver-demo-001',
      vehicleId: 'vehicle-demo-001',
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
      driverId: 'driver-demo-002',
      vehicleId: 'vehicle-demo-002',
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
    { ...DEMO_UA_COURSE, tenantId, createdAt: now, updatedAt: now },
  ]

  saveCourses(tenantId, demo)
  return demo
}
