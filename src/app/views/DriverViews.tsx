import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/Card'
import { Button } from '@/app/components/ui/Button'
import { COURSE_STATUS_LABELS } from '@/lib/domain/course'
import { loadCourses, seedDemoCourses } from '@/lib/domain/courses-store'
import { MapPin, Route, FileText } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { Course } from '@/lib/domain/course'

interface DriverHomeViewProps {
  tenantId: string
}

export function DriverHomeView({ tenantId }: DriverHomeViewProps) {
  const [activeCourse, setActiveCourse] = useState<Course | null>(null)

  useEffect(() => {
    seedDemoCourses(tenantId)
    const courses = loadCourses(tenantId)
    const active = courses.find((c) => c.status === 'in_transit' || c.status === 'loading')
    setActiveCourse(active ?? null)
  }, [tenantId])
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Dzień dobry</h1>
        <p className="text-sm text-muted-foreground">Panel kierowcy — mobile first</p>
      </div>

      <Card className={activeCourse ? 'border-primary/30 bg-primary/5' : ''}>
        <CardHeader>
          <CardTitle className="text-base">
            {activeCourse ? activeCourse.reference : 'Brak aktywnego kursu'}
          </CardTitle>
          <CardDescription>
            {activeCourse
              ? `${COURSE_STATUS_LABELS[activeCourse.status]} · ${activeCourse.loadCity} → ${activeCourse.unloadCity}`
              : 'Dyspozytor przypisze zlecenie'}
          </CardDescription>
        </CardHeader>
        {activeCourse && (
          <CardContent className="text-sm text-muted-foreground">{activeCourse.cargo}</CardContent>
        )}
      </Card>

      <div className="grid gap-3">
        <QuickAction icon={Route} title="Moje kursy" desc="Lista zleceń na dziś" />
        <QuickAction icon={FileText} title="Raport dzienny" desc="Km, koszty, postoje" />
        <QuickAction icon={MapPin} title="Udostępnij lokalizację" desc="Moduł GPS — wkrótce" />
      </div>

      <Button className="w-full" size="lg" variant="secondary" disabled>
        Kończę pracę (wkrótce)
      </Button>
    </div>
  )
}

function QuickAction({
  icon: Icon,
  title,
  desc,
}: {
  icon: typeof Route
  title: string
  desc: string
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <Icon className="h-8 w-8 shrink-0 text-primary" />
        <div>
          <p className="font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">{desc}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export function DriverReportView() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Raport dzienny</h1>
      <Card>
        <CardContent className="p-4 text-sm text-muted-foreground">
          Kierowca zgłosi: trasy, km, paliwo, opłaty drogowe, postoje, uwagi. Dane trafiają do
          rozliczenia w panelu właściciela.
        </CardContent>
      </Card>
    </div>
  )
}

export function DriverCoursesView() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Moje kursy</h1>
      <Card>
        <CardContent className="p-4 text-sm text-muted-foreground">Brak przypisanych kursów.</CardContent>
      </Card>
    </div>
  )
}

export function DriverProfileView() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Profil</h1>
      <Card>
        <CardContent className="p-4 text-sm text-muted-foreground">
          Uprawnienia, ważność dokumentów, przypisany pojazd.
        </CardContent>
      </Card>
    </div>
  )
}
