import { Button } from '@/app/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/Card'
import { Input, Label, Select } from '@/app/components/ui/Input'
import { COURSE_STATUS_LABELS } from '@/lib/domain/course'
import {
  createEmptyDailyReport,
  dailyReportTotalCosts,
} from '@/lib/domain/daily-report'
import {
  checkDailyDrivingLimit,
  formatDrivingHours,
} from '@/lib/domain/driving-time'
import {
  getTodayReportForDriver,
  upsertDailyReport,
} from '@/lib/domain/daily-reports-store'
import { loadCourses, seedDemoCourses } from '@/lib/domain/courses-store'
import { CheckCircle2, FileText, Fuel, MapPin, Route, AlertTriangle } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import type { Course } from '@/lib/domain/course'
import type { DailyReport } from '@/lib/domain/daily-report'

interface DriverHomeViewProps {
  tenantId: string
  driverName?: string
  onOpenReport?: () => void
}

export function DriverHomeView({ tenantId, driverName, onOpenReport }: DriverHomeViewProps) {
  const [activeCourse, setActiveCourse] = useState<Course | null>(null)
  const [shiftEnded, setShiftEnded] = useState(false)

  useEffect(() => {
    seedDemoCourses(tenantId)
    const courses = loadCourses(tenantId)
    const active = courses.find((c) => c.status === 'in_transit' || c.status === 'loading')
    setActiveCourse(active ?? null)
    if (driverName) {
      const today = getTodayReportForDriver(tenantId, driverName)
      setShiftEnded(today?.shiftEnded ?? false)
    }
  }, [tenantId, driverName])

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
              ? `${COURSE_STATUS_LABELS[activeCourse.status]} · ${activeCourse.loadCity} (${activeCourse.loadCountry}) → ${activeCourse.unloadCity} (${activeCourse.unloadCountry})`
              : 'Dyspozytor przypisze zlecenie'}
          </CardDescription>
        </CardHeader>
        {activeCourse && (
          <CardContent className="text-sm text-muted-foreground">{activeCourse.cargo}</CardContent>
        )}
      </Card>

      <div className="grid gap-3">
        <QuickAction icon={Route} title="Moje kursy" desc="Lista zleceń — zakładka Kursy" />
        <QuickAction
          icon={FileText}
          title="Raport dzienny"
          desc="Km, paliwo, myto PLN/EUR"
          onClick={onOpenReport}
        />
        <QuickAction icon={MapPin} title="Udostępnij lokalizację" desc="Moduł GPS — wkrótce" />
      </div>

      <Button
        className="w-full"
        size="lg"
        variant={shiftEnded ? 'secondary' : 'default'}
        onClick={onOpenReport}
      >
        {shiftEnded ? 'Zmiana zakończona dziś' : 'Wypełnij raport dzienny'}
      </Button>
    </div>
  )
}

function QuickAction({
  icon: Icon,
  title,
  desc,
  onClick,
}: {
  icon: typeof Route
  title: string
  desc: string
  onClick?: () => void
}) {
  return (
    <Card className={onClick ? 'cursor-pointer active:scale-[0.99]' : ''} onClick={onClick}>
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

interface DriverReportViewProps {
  tenantId: string
  driverName: string
}

export function DriverReportView({ tenantId, driverName }: DriverReportViewProps) {
  const [report, setReport] = useState<DailyReport | null>(null)
  const [saved, setSaved] = useState(false)
  const [courses, setCourses] = useState<Course[]>([])

  const init = useCallback(() => {
    seedDemoCourses(tenantId)
    setCourses(loadCourses(tenantId))
    const existing = getTodayReportForDriver(tenantId, driverName)
    if (existing) {
      setReport(existing)
      setSaved(existing.shiftEnded)
      return
    }
    const now = new Date().toISOString()
    setReport({
      ...createEmptyDailyReport(tenantId, driverName),
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    })
  }, [tenantId, driverName])

  useEffect(() => {
    init()
  }, [init])

  function patch(partial: Partial<DailyReport>) {
    if (!report) return
    setReport({ ...report, ...partial })
    setSaved(false)
  }

  function handleSave(endShift = false) {
    if (!report) return
    const now = new Date().toISOString()
    const savedReport: DailyReport = {
      ...report,
      updatedAt: now,
      shiftEnded: endShift ? true : report.shiftEnded,
      shiftEndedAt: endShift ? now : report.shiftEndedAt,
    }
    upsertDailyReport(tenantId, savedReport)
    setReport(savedReport)
    setSaved(true)
  }

  if (!report) return null

  const totalCosts = dailyReportTotalCosts(report)
  const drivingCheck = checkDailyDrivingLimit(report.drivingMinutes ?? 0)

  return (
    <div className="space-y-4 pb-6">
      <div>
        <h1 className="text-xl font-semibold">Raport dzienny</h1>
        <p className="text-sm text-muted-foreground">
          {report.date} · {driverName}
          {saved && (
            <span className="ml-2 inline-flex items-center gap-1 text-success">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Zapisano
            </span>
          )}
        </p>
      </div>

      {(drivingCheck.status !== 'ok' || drivingCheck.continuousRisk) && (
        <Card className="border-warning/40 bg-warning/5">
          <CardContent className="flex items-start gap-2 p-4 text-sm">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
            <div>
              {drivingCheck.status === 'exceeded' && (
                <p className="font-medium text-danger">
                  Przekroczono limit {formatDrivingHours(drivingCheck.limitMinutes)} jazdy dziennie
                </p>
              )}
              {drivingCheck.status === 'warning' && (
                <p className="font-medium text-warning">
                  Pozostało {drivingCheck.remainingMinutes} min do limitu dziennej jazdy
                </p>
              )}
              {drivingCheck.continuousRisk && (
                <p className="text-muted-foreground">
                  Powyżej 4,5 h jazdy — wymagana przerwa 45 min (561/2006)
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="space-y-3 p-4">
          <Field label="Kurs (opcjonalnie)">
            <Select
              value={report.courseId ?? ''}
              onChange={(e) => {
                const course = courses.find((c) => c.id === e.target.value)
                patch({
                  courseId: course?.id,
                  courseReference: course?.reference,
                })
              }}
            >
              <option value="">— bez przypisania —</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.reference} · {c.loadCity} → {c.unloadCity}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Przejechane km">
            <Input
              type="number"
              inputMode="numeric"
              value={report.kmDriven || ''}
              onChange={(e) => patch({ kmDriven: Number(e.target.value) || 0 })}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Paliwo (l)">
              <Input
                type="number"
                value={report.fuelLiters ?? ''}
                onChange={(e) =>
                  patch({ fuelLiters: e.target.value ? Number(e.target.value) : undefined })
                }
              />
            </Field>
            <Field label="Koszt paliwa (zł)">
              <Input
                type="number"
                value={report.fuelCostPln ?? ''}
                onChange={(e) =>
                  patch({ fuelCostPln: e.target.value ? Number(e.target.value) : undefined })
                }
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Myto / opłaty (zł)">
              <Input
                type="number"
                value={report.tollPln ?? ''}
                onChange={(e) =>
                  patch({ tollPln: e.target.value ? Number(e.target.value) : undefined })
                }
              />
            </Field>
            <Field label="Myto (EUR)">
              <Input
                type="number"
                value={report.tollEur ?? ''}
                onChange={(e) =>
                  patch({ tollEur: e.target.value ? Number(e.target.value) : undefined })
                }
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Parking (zł)">
              <Input
                type="number"
                value={report.parkingPln ?? ''}
                onChange={(e) =>
                  patch({ parkingPln: e.target.value ? Number(e.target.value) : undefined })
                }
              />
            </Field>
            <Field label="Inne koszty (zł)">
              <Input
                type="number"
                value={report.otherCostsPln ?? ''}
                onChange={(e) =>
                  patch({ otherCostsPln: e.target.value ? Number(e.target.value) : undefined })
                }
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Jazda (min)">
              <Input
                type="number"
                value={report.drivingMinutes ?? ''}
                onChange={(e) =>
                  patch({ drivingMinutes: e.target.value ? Number(e.target.value) : undefined })
                }
              />
            </Field>
            <Field label="Postój / załadunek (min)">
              <Input
                type="number"
                value={report.restMinutes ?? ''}
                onChange={(e) =>
                  patch({ restMinutes: e.target.value ? Number(e.target.value) : undefined })
                }
              />
            </Field>
          </div>

          <Field label="Przekroczenia granicy (np. PL→DE)">
            <Input
              value={report.borderCrossings ?? ''}
              onChange={(e) => patch({ borderCrossings: e.target.value })}
              placeholder="Świecko → Frankfurt (Oder)"
            />
          </Field>

          <Field label="Uwagi">
            <Input
              value={report.notes ?? ''}
              onChange={(e) => patch({ notes: e.target.value })}
            />
          </Field>

          {totalCosts > 0 && (
            <p className="flex items-center gap-2 text-sm">
              <Fuel className="h-4 w-4 text-muted-foreground" />
              Koszty łącznie: <strong>{totalCosts.toLocaleString('pl-PL')} zł</strong>
            </p>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2">
        <Button className="w-full" size="lg" onClick={() => handleSave(false)}>
          Zapisz raport
        </Button>
        <Button
          className="w-full"
          size="lg"
          variant="secondary"
          onClick={() => handleSave(true)}
          disabled={report.shiftEnded}
        >
          {report.shiftEnded ? 'Zmiana zakończona' : 'Kończę pracę'}
        </Button>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
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
