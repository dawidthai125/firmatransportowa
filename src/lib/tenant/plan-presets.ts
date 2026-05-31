import type { SubscriptionPlan, TenantModules } from '@/lib/tenant/types'
import { DEFAULT_MODULES } from '@/lib/tenant/types'

export const PLAN_LABELS: Record<SubscriptionPlan, string> = {
  trial: 'Trial (wszystko)',
  starter: 'Starter',
  business: 'Business',
  enterprise: 'Enterprise',
}

export const PLAN_DESCRIPTIONS: Record<SubscriptionPlan, string> = {
  trial: 'Pełny dostęp — okres testowy / demo',
  starter: 'Kursy, flota, kierowcy, compliance, awarie — bez GPS i giełdy',
  business: 'GPS, giełda ładunków, moduł ITD — dla rosnącej firmy',
  enterprise: 'Wszystkie moduły, w tym import tachografu DDD',
}

/** Moduły przypisane do planu abonamentowego (SaaS v1.0). */
export function modulesForPlan(plan: SubscriptionPlan): TenantModules {
  switch (plan) {
    case 'starter':
      return {
        fleet: true,
        drivers: true,
        courses: true,
        compliance: true,
        gps: false,
        loadBoard: false,
        itd: false,
        tachographImport: false,
        repairs: true,
        courseStatusPing: true,
        courseDocuments: true,
        vehicleMargin: true,
        invoicing: false,
        rmpdSent: false,
        driverChat: true,
        driverPayroll: false,
        weeklyPlanner: true,
        clientPortal: false,
        ocrRateCon: false,
        eCmr: false,
        freightApiProd: true,
      }
    case 'business':
      return {
        fleet: true,
        drivers: true,
        courses: true,
        compliance: true,
        gps: true,
        loadBoard: true,
        itd: true,
        tachographImport: false,
        repairs: true,
        courseStatusPing: true,
        courseDocuments: true,
        vehicleMargin: true,
        invoicing: false,
        rmpdSent: true,
        driverChat: true,
        driverPayroll: false,
        weeklyPlanner: true,
        clientPortal: false,
        ocrRateCon: false,
        eCmr: false,
        freightApiProd: true,
      }
    case 'enterprise':
      return {
        ...DEFAULT_MODULES,
        tachographImport: true,
      }
    case 'trial':
    default:
      return {
        ...DEFAULT_MODULES,
        tachographImport: true,
      }
  }
}
