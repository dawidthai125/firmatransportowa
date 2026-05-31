import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/Card'
import {
  COURSE_STATUS_COLORS,
  COURSE_STATUS_LABELS,
  courseRouteLabel,
} from '@/lib/domain/course'
import { loadCourses, seedDemoCourses } from '@/lib/domain/courses-store'
import { buildWeeklyPlannerSlots } from '@/lib/domain/weekly-planner'
import { loadDrivers, seedDemoDrivers } from '@/lib/domain/drivers-store'
import { driverDisplayName } from '@/lib/domain/driver'
import { useCloudSyncRefreshKeys } from '@/lib/sync/useCloudSyncRefresh'
import { cn } from '@/lib/utils'
import { CalendarRange } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

interface WeeklyPlannerViewProps {
  tenantId: string
}

export function WeeklyPlannerView({ tenantId }: WeeklyPlannerViewProps) {
  const [slots, setSlots] = useState(() => buildWeeklyPlannerSlots([]))

  const refresh = useCallback(() => {
    seedDemoCourses(tenantId)
    seedDemoDrivers(tenantId)
    const courses = loadCourses(tenantId)
    setSlots(buildWeeklyPlannerSlots(courses))
  }, [tenantId])

  useEffect(() => {
    refresh()
  }, [refresh])

  useCloudSyncRefreshKeys(tenantId, ['courses', 'drivers'], refresh)

  const drivers = loadDrivers(tenantId)
  const nameById = new Map(drivers.map((d) => [d.id, driverDisplayName(d)]))

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Plan tygodnia</h1>
        <p className="text-sm text-muted-foreground">
          Kto, gdzie i kiedy — widok dyspozytora (Gantt-lite)
        </p>
      </div>

      <div className="grid gap-3 lg:grid-cols-7">
        {slots.map((slot) => (
          <Card key={slot.date} className={slot.courses.length > 0 ? 'border-primary/20' : ''}>
            <CardHeader className="p-3 pb-1">
              <CardTitle className="text-sm">{slot.label}</CardTitle>
              <CardDescription>{slot.courses.length} kursów</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 p-3 pt-0">
              {slot.courses.length === 0 ? (
                <p className="text-xs text-muted-foreground">—</p>
              ) : (
                slot.courses.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-md border border-border bg-muted/30 p-2 text-xs"
                  >
                    <p className="font-medium">{c.reference}</p>
                    <p className="text-muted-foreground">{courseRouteLabel(c)}</p>
                    {c.driverId && (
                      <p className="text-muted-foreground">{nameById.get(c.driverId)}</p>
                    )}
                    <span
                      className={cn(
                        'mt-1 inline-block rounded-full px-1.5 py-0.5 text-[10px] font-medium',
                        COURSE_STATUS_COLORS[c.status],
                      )}
                    >
                      {COURSE_STATUS_LABELS[c.status]}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarRange className="h-4 w-4" />
            Legenda
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          Kurs widoczny w dniu, gdy mieści się między datą załadunku a rozładunku.
        </CardContent>
      </Card>
    </div>
  )
}
