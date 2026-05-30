import { buildComplianceAlerts } from '@/lib/domain/compliance'
import { loadCourses, seedDemoCourses } from '@/lib/domain/courses-store'
import { loadDrivers, seedDemoDrivers } from '@/lib/domain/drivers-store'
import { loadVehicles, seedDemoVehicles } from '@/lib/domain/vehicles-store'
import type { Tenant } from '@/lib/tenant/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/Card'
import { AlertTriangle, Clock, Route, Truck, Users } from 'lucide-react'
import { useEffect, useState } from 'react'

interface DashboardViewProps {
  tenant: Tenant
}

export function DashboardView({ tenant }: DashboardViewProps) {
  const [stats, setStats] = useState({ active: 0, total: 0, margin: 0, compliance: 0 })

  useEffect(() => {
    seedDemoCourses(tenant.id)
    seedDemoDrivers(tenant.id)
    seedDemoVehicles(tenant.id)
    const courses = loadCourses(tenant.id)
    const drivers = loadDrivers(tenant.id)
    const vehicles = loadVehicles(tenant.id)
    const active = courses.filter((c) => ['planned', 'loading', 'in_transit'].includes(c.status)).length
    const margin = courses.reduce((s, c) => s + c.freightPln - (c.routeCostsPln ?? 0), 0)
    const compliance = buildComplianceAlerts(tenant.id, drivers, vehicles).length
    setStats({ active, total: courses.length, margin, compliance })
  }, [tenant.id])

  const PLACEHOLDER_STATS = [
    { label: 'Aktywne kursy', value: String(stats.active), icon: Route, tone: 'text-primary' },
    { label: 'Wszystkie zlecenia', value: String(stats.total), icon: Truck, tone: 'text-accent-foreground' },
    { label: 'Marża łącznie', value: `${stats.margin.toLocaleString('pl-PL')} zł`, icon: Users, tone: 'text-success' },
    { label: 'Alerty compliance', value: String(stats.compliance), icon: AlertTriangle, tone: 'text-warning' },
  ]
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Pulpit</h1>
        <p className="text-sm text-muted-foreground">
          {tenant.name} · plan {tenant.plan} · moduły wg abonamentu
        </p>
      </div>

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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-warning" />
              Wymaga uwagi
            </CardTitle>
            <CardDescription>Dokumenty, serwisy, czasy pracy — moduł w budowie</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Tu pojawią się alerty: wygasające uprawnienia ADR, przeglądy, przekroczenia czasu jazdy.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dziś w firmie</CardTitle>
            <CardDescription>Podgląd operacyjny dla właściciela / dyspozytora</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Mapa floty, status kursów i ETA — kolejna faza rozwoju (moduł GPS).
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
