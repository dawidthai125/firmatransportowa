import { isCompanyDeployment } from '@/config/branding'

/**
 * Otwarty dostęp do paneli bez logowania (okres testów).
 * Wyłącz: VITE_OPEN_TEST_ACCESS=false w Vercel / .env
 */
export function isOpenTestAccess(): boolean {
  const flag = import.meta.env.VITE_OPEN_TEST_ACCESS
  if (flag === 'false') return false
  if (flag === 'true') return true
  return isCompanyDeployment()
}
