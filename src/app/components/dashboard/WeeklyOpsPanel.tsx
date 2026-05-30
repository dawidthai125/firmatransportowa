import { Button } from '@/app/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/Card'
import {
  buildCourseSettlementSummaries,
  buildWeeklyOpsSummary,
  courseCostOverruns,
  type CourseSettlementSummary,
} from '@/lib/domain/course-settlement'
import type { Course } from '@/lib/domain/course'
import type { DailyReport } from '@/lib/domain/daily-report'
import type { AdminView } from '@/lib/navigation'
import { cn } from '@/lib/utils'
import { CalendarRange, TrendingDown, TrendingUp } from 'lucide-react'

interface WeeklyOpsPanelProps {
  courses: Course[]
  reports: DailyReport[]
  onNavigate?: (view: AdminView) => void
}

export function WeeklyOpsPanel({ courses, reports, onNavigate }: WeeklyOpsPanelProps) {
  const week = buildWeeklyOpsSummary(courses, reports)
  const settlements = buildCourseSettlementSummaries(courses, reports)
  const overruns = courseCostOverruns(settlements)
  const topActive = settlements
    .filter((s) => ['planned', 'loading', 'in_transit'].includes(s.status) && s.reportDays > 0)
    .slice(0, 3)

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarRange className="h-4 w-4 text-primary" />
            Ten tydzień — operacje
          </CardTitle>
          <CardDescription>
            Od {week.weekStart} · raporty kierowców vs aktywne kursy
          </CardDescription>
        </div>
        {onNavigate && (
          <Button variant="secondary" size="sm" onClick={() => onNavigate('settlements')}>
            Rozliczenia
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <MiniStat label="Raporty" value={String(week.reportCount)} />
          <MiniStat label="Km łącznie" value={`${week.totalKm.toLocaleString('pl-PL')} km`} />
          <MiniStat
            label="Koszty z raportów"
            value={`${week.totalCostsPln.toLocaleString('pl-PL')} zł`}
          />
          <MiniStat
            label="Kursy z raportami"
            value={`${week.coursesWithReports} / ${week.activeCourses} aktyw.`}
          />
        </div>

        {topActive.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Aktywne kursy — koszty z kabiny</p>
            {topActive.map((s) => (
              <CourseSettlementRow key={s.courseId} summary={s} />
            ))}
          </div>
        )}

        {overruns.length > 0 && (
          <div className="rounded-lg border border-warning/40 bg-warning/5 p-3 text-sm">
            <p className="flex items-center gap-1 font-medium text-warning">
              <TrendingDown className="h-4 w-4" />
              {overruns.length} kursów — koszty wyższe niż plan
            </p>
            <ul className="mt-1 list-inside list-disc text-xs text-muted-foreground">
              {overruns.slice(0, 3).map((s) => (
                <li key={s.courseId}>
                  {s.reference}: {s.variancePln?.toLocaleString('pl-PL')} zł vs plan
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-muted/50 px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  )
}

function CourseSettlementRow({ summary: s }: { summary: CourseSettlementSummary }) {
  const positive = (s.actualMarginPln ?? 0) >= (s.plannedMarginPln ?? 0)
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-sm">
      <div>
        <span className="font-medium">{s.reference}</span>
        <span className="ml-2 text-muted-foreground">
          {s.reportKm} km · {s.reportCostsPln.toLocaleString('pl-PL')} zł z raportów
        </span>
      </div>
      {s.actualMarginPln != null && (
        <span
          className={cn(
            'inline-flex items-center gap-1 text-xs font-medium',
            positive ? 'text-success' : 'text-warning',
          )}
        >
          {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          Marża rzecz.: {s.actualMarginPln.toLocaleString('pl-PL')} zł
        </span>
      )}
    </div>
  )
}
