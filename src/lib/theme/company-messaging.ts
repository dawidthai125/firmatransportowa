import { COMPANY_BRANDING } from '@/config/branding'

/** Copy portalu w trybie „jedna firma” — bez SaaS / abonamentu */
export const COMPANY_PORTAL_TAGLINE =
  'Flota, kursy i raporty kierowców — wszystko w jednym miejscu'

export const COMPANY_OWNER_PROPS = [
  'Marże kursów i rozliczenia w czasie rzeczywistym',
  'Flota, dokumenty ITD i alerty przed kontrolą',
  'Awarie: od zgłoszenia kierowcy do warsztatu',
] as const

export const COMPANY_DRIVER_PROPS = [
  'Raport dnia z kabiny — km, paliwo, myto',
  'Kursy i trasy bez dzwonienia do biura',
  'Awaria? Zdjęcie i zgłoszenie w kilka minut',
] as const

export function companyPortalTitle(): string {
  return COMPANY_BRANDING.shortName
}

export function companyPortalSubtitle(): string {
  return COMPANY_BRANDING.portalSubtitle
}
