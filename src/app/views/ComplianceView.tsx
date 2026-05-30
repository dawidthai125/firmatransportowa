import { Card, CardContent } from '@/app/components/ui/Card'
import {
  buildCompanyComplianceAlerts,
  buildComplianceAlerts,
  EXPIRY_STATUS_COLORS,
  formatExpiryDate,
} from '@/lib/domain/compliance'
import { loadDrivers, seedDemoDrivers } from '@/lib/domain/drivers-store'
import { seedDemoCompanyDocuments, loadTenantSettingsData } from '@/lib/domain/tenant-settings'
import { loadVehicles, seedDemoVehicles } from '@/lib/domain/vehicles-store'
import { seedDemoTenantIfEmpty } from '@/lib/tenant/demo-data'
import { cn } from '@/lib/utils'
import { AlertTriangle, Building2, ShieldCheck, Truck, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { ComplianceAlert } from '@/lib/domain/compliance'

interface ComplianceViewProps {
  tenantId: string
  tenantName?: string
}

export function ComplianceView({ tenantId, tenantName }: ComplianceViewProps) {
  const [alerts, setAlerts] = useState<ComplianceAlert[]>([])

  useEffect(() => {
    seedDemoDrivers(tenantId)
    seedDemoVehicles(tenantId)
    seedDemoCompanyDocuments(tenantId)

    const drivers = loadDrivers(tenantId)
    const vehicles = loadVehicles(tenantId)
    const companyDocs = loadTenantSettingsData(tenantId).companyDocuments

    const tenants = seedDemoTenantIfEmpty()
    const tenant = tenants.find((t) => t.id === tenantId)
    const name = tenantName ?? tenant?.name ?? 'Firma'

    const driverVehicleAlerts = buildComplianceAlerts(tenantId, drivers, vehicles)
    const companyAlerts = buildCompanyComplianceAlerts(tenantId, name, companyDocs)

    setAlerts([...driverVehicleAlerts, ...companyAlerts].sort((a, b) => a.daysLeft - b.daysLeft))
  }, [tenantId, tenantName])

  const expired = alerts.filter((a) => a.status === 'expired')
  const warning = alerts.filter((a) => a.status === 'warning')

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Zgodność i dokumenty</h1>
        <p className="text-sm text-muted-foreground">
          {alerts.length} alertów · {expired.length} wygasłych · {warning.length} wkrótce wygasa
        </p>
      </div>

      {alerts.length === 0 ? (
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
