import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/Card'
import {
  COURSE_SCOPE_LABELS,
  COURSE_STATUS_LABELS,
  courseRouteLabel,
} from '@/lib/domain/course'
import { CourseTrackingBadge, loadCourseForTracking } from '@/app/components/course/RmpdSentChecklist'
import { CalendarRange, MapPin } from 'lucide-react'

interface ClientTrackingViewProps {
  token: string
  tenantId: string
  tenantName: string
}

export function ClientTrackingView({ token, tenantId, tenantName }: ClientTrackingViewProps) {
  const course = loadCourseForTracking(tenantId, token)

  if (!course) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background p-6">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            Link śledzenia wygasł lub jest nieprawidłowy.
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-background p-4 sm:p-8">
      <div className="mx-auto max-w-lg space-y-4">
        <div className="text-center">
          <p className="text-xs text-muted-foreground">{tenantName}</p>
          <h1 className="text-xl font-semibold">Śledzenie przesyłki</h1>
          <p className="text-sm text-muted-foreground">{course.reference}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-2 text-base">
              Status
              <CourseTrackingBadge course={course} />
            </CardTitle>
            <CardDescription>{COURSE_SCOPE_LABELS[course.scope]}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              {courseRouteLabel(course)}
            </p>
            <p className="text-muted-foreground">{course.cargo}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CalendarRange className="h-3.5 w-3.5" />
              Załadunek: {new Date(course.loadAt).toLocaleString('pl-PL')}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CalendarRange className="h-3.5 w-3.5" />
              Rozładunek: {new Date(course.unloadAt).toLocaleString('pl-PL')}
            </div>
            {course.statusUpdatedAt && (
              <p className="rounded-md bg-muted/50 px-3 py-2 text-xs">
                Ostatnia aktualizacja:{' '}
                {new Date(course.statusUpdatedAt).toLocaleString('pl-PL')} —{' '}
                {COURSE_STATUS_LABELS[course.status]}
              </p>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Widok tylko do odczytu · portal klienta
        </p>
      </div>
    </div>
  )
}
