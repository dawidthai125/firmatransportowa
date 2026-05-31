import type { Course } from '@/lib/domain/course'

export function mapsUrlToUnload(course: Course): string {
  const dest = encodeURIComponent(
    `${course.unloadCity}, ${course.unloadCountry}`,
  )
  const origin = encodeURIComponent(`${course.loadCity}, ${course.loadCountry}`)
  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}&travelmode=driving`
}

export function mapsUrlToLoad(course: Course): string {
  const dest = encodeURIComponent(`${course.loadCity}, ${course.loadCountry}`)
  return `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=driving`
}

export function courseShareTextForDriver(course: Course): string {
  const lines = [
    `Kurs ${course.reference}`,
    `${course.loadCity} (${course.loadCountry}) → ${course.unloadCity} (${course.unloadCountry})`,
    course.cargo,
    course.unloadAt
      ? `Rozładunek: ${new Date(course.unloadAt).toLocaleString('pl-PL')}`
      : '',
    course.cmrNumber ? `CMR: ${course.cmrNumber}` : '',
    mapsUrlToUnload(course),
  ]
  return lines.filter(Boolean).join('\n')
}
