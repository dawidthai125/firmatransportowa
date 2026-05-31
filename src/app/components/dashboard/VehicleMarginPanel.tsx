import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/Card'
import { buildVehicleMarginRows, type VehicleMarginRow } from '@/lib/domain/vehicle-margin'
import { loadCourses, seedDemoCourses } from '@/lib/domain/courses-store'
import { loadDailyReports, seedDemoDailyReports } from '@/lib/domain/daily-reports-store'
import { loadVehicles, seedDemoVehicles } from '@/lib/domain/vehicles-store'
import { useCloudSyncRefreshKeys } from '@/lib/sync/useCloudSyncRefresh'
import { cn } from '@/lib/utils'
import { TrendingDown, TrendingUp, Truck } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

interface VehicleMarginPanelProps {
  tenantId: string
}

export function VehicleMarginPanel({ tenantId }: VehicleMarginPanelProps) {
  const [rows, setRows] = useState<VehicleMarginRow[]>([])

  const refresh = useCallback(() => {
    seedDemoCourses(tenantId)
    seedDemoVehicles(tenantId)
    seedDemoDailyReports(tenantId)
    const courses = loadCourses(tenantId)
    const vehicles = loadVehicles(tenantId)
    const reports = loadDailyReports(tenantId)
    setRows(buildVehicleMarginRows(vehicles, courses, reports))
  }, [tenantId])

  useEffect(() => {
    refresh()
  }, [refresh])

  useCloudSyncRefreshKeys(tenantId, ['courses', 'vehicles', 'daily-reports'], refresh)

  if (rows.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Truck className="h-4 w-4 text-primary" />
          Marża per pojazd
        </CardTitle>
        <CardDescription>Fracht vs koszty planowane i z raportów kabiny</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {rows.map((r) => {
          const positive = r.actualMarginPln >= 0
          return (
            <div
              key={r.vehicleId}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-sm"
            >
              <div>
                <span className="font-semibold">{r.registration}</span>
                <span className="ml-2 text-muted-foreground">
                  {r.courseCount} kursów · fracht {r.freightPln.toLocaleString('pl-PL')} zł
                </span>
              </div>
              <span
                className={cn(
                  'inline-flex items-center gap-1 text-xs font-medium',
                  positive ? 'text-success' : 'text-danger',
                )}
              >
                {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                Marża: {r.actualMarginPln.toLocaleString('pl-PL')} zł
              </span>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
