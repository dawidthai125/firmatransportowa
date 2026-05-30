import { OperationsExceptionsPanel } from '@/app/components/dashboard/OperationsExceptionsPanel'
import { FleetMapPanel } from '@/app/components/fleet/FleetMapPanel'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/Card'
import { buildComplianceAlerts, buildCompanyComplianceAlerts } from '@/lib/domain/compliance'
import { loadCourses, seedDemoCourses } from '@/lib/domain/courses-store'
import { loadDrivers, seedDemoDrivers } from '@/lib/domain/drivers-store'
import { loadDailyReports, seedDemoDailyReports } from '@/lib/domain/daily-reports-store'
import { buildDrivingTimeAlerts } from '@/lib/domain/driving-time'
import type { FleetPosition } from '@/lib/domain/fleet-position'
import {
  loadFleetPositions,
  seedDemoFleetPositions,
  tickFleetSimulation,
} from '@/lib/domain/fleet-positions-store'
import { hasLiveDriverPositions } from '@/lib/gps/driver-gps'
import { seedDemoCompanyDocuments, loadTenantSettingsData } from '@/lib/domain/tenant-settings'
import { loadVehicles, seedDemoVehicles } from '@/lib/domain/vehicles-store'
import {
  buildOperationsExceptions,
  type OperationException,
} from '@/lib/operations/dashboard-exceptions'
import { useCloudSyncRefresh } from '@/lib/sync/useCloudSyncRefresh'
import type { AdminView } from '@/lib/navigation'
import type { Tenant } from '@/lib/tenant/types'
import { AlertTriangle, Clock, Route, Truck, Users } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

interface DashboardViewProps {
  tenant: Tenant
  onNavigate?: (view: AdminView) => void
}

export function DashboardView({ tenant, onNavigate }: DashboardViewProps) {
  const gpsEnabled = tenant.settings.modules.gps
  const [stats, setStats] = useState({
    active: 0,
    total: 0,
    margin: 0,
    compliance: 0,
    driving: 0,
  })
  const [fleetPositions, setFleetPositions] = useState<FleetPosition[]>([])
  const [exceptions, setExceptions] = useState<OperationException[]>([])
  const [liveGps, setLiveGps] = useState(false)

  const refreshStats = useCallback(() => {
    seedDemoCourses(tenant.id)
    seedDemoDrivers(tenant.id)
    seedDemoVehicles(tenant.id)
    seedDemoDailyReports(tenant.id)
    seedDemoCompanyDocuments(tenant.id)

    const courses = loadCourses(tenant.id)
    const drivers = loadDrivers(tenant.id)
    const vehicles = loadVehicles(tenant.id)
    const reports = loadDailyReports(tenant.id)
    const companyDocs = loadTenantSettingsData(tenant.id).companyDocuments

    const active = courses.filter((c) => ['planned', 'loading', 'in_transit'].includes(c.status)).length
    const margin = courses.reduce((s, c) => s + c.freightPln - (c.routeCostsPln ?? 0), 0)
    const compliance =
      buildComplianceAlerts(tenant.id, drivers, vehicles).length +
      buildCompanyComplianceAlerts(tenant.id, tenant.name, companyDocs).length
    const driving = buildDrivingTimeAlerts(tenant.id, reports).length

    setStats({ active, total: courses.length, margin, compliance, driving })
    setExceptions(buildOperationsExceptions(tenant.id, tenant.name, gpsEnabled))
  }, [tenant.id, tenant.name, gpsEnabled])

  const refreshFleet = useCallback(() => {
    if (!gpsEnabled) return
    const live = hasLiveDriverPositions(tenant.id)
    setLiveGps(live)
    if (live) {
      setFleetPositions(loadFleetPositions(tenant.id))
    } else {
      setFleetPositions(tickFleetSimulation(tenant.id))
    }
  }, [tenant.id, gpsEnabled])

  useEffect(() => {
    refreshStats()
    if (gpsEnabled) {
      seedDemoFleetPositions(tenant.id)
      refreshFleet()
    }
  }, [refreshStats, refreshFleet, gpsEnabled])

  useCloudSyncRefresh(tenant.id, 'fleet-positions', () => {
    refreshFleet()
    refreshStats()
  })

  const PLACEHOLDER_STATS = [
    { label: 'Aktywne kursy', value: String(stats.active), icon: Route, tone: 'text-primary' },
    { label: 'Wszystkie zlecenia', value: String(stats.total), icon: Truck, tone: 'text-accent-foreground' },
    { label: 'Marża łącznie', value: `${stats.margin.toLocaleString('pl-PL')} zł`, icon: Users, tone: 'text-success' },
    { label: 'Alerty compliance', value: String(stats.compliance), icon: AlertTriangle, tone: 'text-warning' },
  ]

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        {tenant.name} · 5 minut rano na wyjątki, reszta dnia bez mikrozarządzania
      </p>

      {onNavigate && (
        <OperationsExceptionsPanel exceptions={exceptions} onNavigate={onNavigate} />
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {PLACEHOLDER_STATS.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <stat.icon className={`h-8 w-8 shrink-0 ${stat.tone}`} />
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className={stats.driving > 0 ? 'border-warning/40' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-warning" />
              Czas jazdy (561/2006)
            </CardTitle>
            <CardDescription>
              {stats.driving > 0
                ? `${stats.driving} alertów — sprawdź moduł Rozliczenia`
                : 'Brak przekroczeń w raportach kierowców'}
            </CardDescription>
          </CardHeader>
          {stats.driving > 0 && (
            <CardContent className="text-sm text-warning">
              Kierowcy zbliżają się do limitu 9 h jazdy dziennie lub go przekroczyli.
            </CardContent>
          )}
        </Card>

        <Card className={gpsEnabled ? 'lg:col-span-2' : ''}>
          <CardHeader>
            <CardTitle>Flota na mapie</CardTitle>
            <CardDescription>
              {gpsEnabled
                ? liveGps
                  ? 'Pozycje z telefonów kierowców (PWA) · na żywo'
                  : 'Demo — włącz GPS u kierowcy, aby zobaczyć pozycje na żywo'
                : 'Moduł GPS wyłączony w ustawieniach planu'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {gpsEnabled ? (
              <FleetMapPanel positions={fleetPositions} onRefresh={refreshFleet} />
            ) : (
              <p className="text-sm text-muted-foreground">
                Włącz moduł GPS w planie abonamentu, aby zobaczyć mapę floty.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
