import { Card, CardContent } from '@/app/components/ui/Card'
import {
  buildCompanyComplianceAlerts,
  buildComplianceAlerts,
  EXPIRY_STATUS_COLORS,
  formatExpiryDate,
} from '@/lib/domain/compliance'
import { loadCourses, seedDemoCourses } from '@/lib/domain/courses-store'
import { loadDrivers, seedDemoDrivers } from '@/lib/domain/drivers-store'
import {
  buildInternationalCourseAlerts,
  INTERNATIONAL_ISSUE_HINTS,
  PUESC_RMPD_URL,
} from '@/lib/domain/international-compliance'
import { seedDemoCompanyDocuments, loadTenantSettingsData } from '@/lib/domain/tenant-settings'
import { loadVehicles, seedDemoVehicles } from '@/lib/domain/vehicles-store'
import { seedDemoTenantIfEmpty } from '@/lib/tenant/demo-data'
import { cn } from '@/lib/utils'
import { AlertTriangle, Building2, ExternalLink, Globe, ShieldCheck, Truck, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { ComplianceAlert } from '@/lib/domain/compliance'
import type { InternationalCourseAlert } from '@/lib/domain/international-compliance'

interface ComplianceViewProps {
  tenantId: string
  tenantName?: string
}

export function ComplianceView({ tenantId, tenantName }: ComplianceViewProps) {
  const [alerts, setAlerts] = useState<ComplianceAlert[]>([])
  const [intlAlerts, setIntlAlerts] = useState<InternationalCourseAlert[]>([])

  useEffect(() => {
    seedDemoDrivers(tenantId)
    seedDemoVehicles(tenantId)
    seedDemoCompanyDocuments(tenantId)
    seedDemoCourses(tenantId)

    const drivers = loadDrivers(tenantId)
    const vehicles = loadVehicles(tenantId)
    const companyDocs = loadTenantSettingsData(tenantId).companyDocuments
    const courses = loadCourses(tenantId)

    const tenants = seedDemoTenantIfEmpty()
    const tenant = tenants.find((t) => t.id === tenantId)
    const name = tenantName ?? tenant?.name ?? 'Firma'

    const driverVehicleAlerts = buildComplianceAlerts(tenantId, drivers, vehicles)
    const companyAlerts = buildCompanyComplianceAlerts(tenantId, name, companyDocs)

    setAlerts([...driverVehicleAlerts, ...companyAlerts].sort((a, b) => a.daysLeft - b.daysLeft))
    setIntlAlerts(buildInternationalCourseAlerts(tenantId, courses))
  }, [tenantId, tenantName])

  const expired = alerts.filter((a) => a.status === 'expired')
  const warning = alerts.filter((a) => a.status === 'warning')

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Zgodność i dokumenty</h1>
        <p className="text-sm text-muted-foreground">
          {alerts.length} alertów dokumentów ({expired.length} wygasłych, {warning.length} wkrótce)
          {intlAlerts.length > 0 ? ` · ${intlAlerts.length} kursów międzynarodowych` : ''}
        </p>
      </div>

      {intlAlerts.length > 0 && (
        <div className="space-y-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Globe className="h-4 w-4 text-primary" />
            Kursy międzynarodowe — CMR / RMPD
          </h2>
          {intlAlerts.map((alert) => (
            <Card
              key={alert.id}
              className={cn(alert.severity === 'critical' && 'border-danger/40')}
            >
              <CardContent className="flex flex-wrap items-start gap-3 p-4">
                <AlertTriangle
                  className={cn(
                    'h-5 w-5 shrink-0',
                    alert.severity === 'critical' ? 'text-danger' : 'text-warning',
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {alert.courseRef} · {alert.label}
                  </p>
                  <p className="text-sm text-muted-foreground">{alert.route}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {INTERNATIONAL_ISSUE_HINTS[alert.issue]}
                    {alert.daysUntilLoad >= 0
                      ? ` · załadunek za ${alert.daysUntilLoad} dni`
                      : ' · załadunek w przeszłości'}
                  </p>
                  {alert.issue === 'missing_rmpd' && (
                    <a
                      href={PUESC_RMPD_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      Portal PUESC (RMPD)
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {alerts.length === 0 && intlAlerts.length === 0 ? (
        <Card>
          <CardContent className="flex items-center gap-3 p-6 text-success">
            <ShieldCheck className="h-8 w-8" />
            <div>
              <p className="font-medium">Wszystkie dokumenty ważne</p>
              <p className="text-sm text-muted-foreground">
                Kierowcy, pojazdy i firma (licencja, CKZ)
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <Card
              key={alert.id}
              className={cn(alert.status === 'expired' && 'border-danger/40')}
            >
              <CardContent className="flex flex-wrap items-center gap-3 p-4">
                {alert.entityType === 'driver' ? (
                  <User className="h-5 w-5 shrink-0 text-primary" />
                ) : alert.entityType === 'vehicle' ? (
                  <Truck className="h-5 w-5 shrink-0 text-primary" />
                ) : (
                  <Building2 className="h-5 w-5 shrink-0 text-primary" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{alert.documentLabel}</p>
                  <p className="text-sm text-muted-foreground">
                    {alert.entityType === 'driver'
                      ? 'Kierowca'
                      : alert.entityType === 'vehicle'
                        ? 'Pojazd'
                        : 'Firma'}
                    : {alert.entityName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Ważny do: {formatExpiryDate(alert.expiresAt)}
                    {alert.daysLeft < 0
                      ? ` · wygasł ${Math.abs(alert.daysLeft)} dni temu`
                      : ` · za ${alert.daysLeft} dni`}
                  </p>
                </div>
                <span
                  className={cn(
                    'flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium',
                    EXPIRY_STATUS_COLORS[alert.status],
                  )}
                >
                  {alert.status === 'expired' && <AlertTriangle className="h-3 w-3" />}
                  {alert.status === 'expired' ? 'Wygasł' : 'Wkrótce wygasa'}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
