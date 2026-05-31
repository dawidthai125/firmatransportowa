import { DriverLocationShare } from '@/app/components/driver/DriverLocationShare'
import { Button } from '@/app/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/Card'
import { DriverRepairsStatus } from '@/app/components/DriverRepairsStatus'
import { Input, Label, Select } from '@/app/components/ui/Input'
import { COURSE_STATUS_LABELS } from '@/lib/domain/course'
import {
  createEmptyDailyReport,
  dailyReportTotalCosts,
} from '@/lib/domain/daily-report'
import {
  TOLL_FIELD_HINT,
  TOLL_FIELD_LABEL_EUR,
  TOLL_FIELD_LABEL_PLN,
} from '@/lib/domain/daily-report-format'
import {
  checkDailyDrivingLimit,
  formatDrivingHours,
} from '@/lib/domain/driving-time'
import {
  getTodayReportForDriver,
  upsertDailyReportGuarded,
} from '@/lib/domain/daily-reports-store'
import { StaleRecordSaveError, staleSaveMessage } from '@/lib/sync/guarded-save'
import { loadCourses, seedDemoCourses } from '@/lib/domain/courses-store'
import { activeCourseForDriver } from '@/lib/domain/course-settlement'
import { findDriverByDisplayName, resolveDriverVehicle } from '@/lib/domain/driver-profile'
import {
  buildInternationalCourseAlerts,
  courseNeedsInternationalCheck,
} from '@/lib/domain/international-compliance'
import { syncDriverReminders } from '@/lib/notifications/driver-reminders'
import { useCloudSyncRefreshKeys } from '@/lib/sync/useCloudSyncRefresh'
import { EditConflictBanner } from '@/app/components/sync/EditConflictBanner'
import {
  checkRecordStale,
  confirmSaveOverStaleRecord,
} from '@/lib/sync/record-conflict'
import { seedDemoCompanyDocuments, loadTenantSettingsData } from '@/lib/domain/tenant-settings'
import { expiryStatus, EXPIRY_STATUS_COLORS, formatExpiryDate } from '@/lib/domain/compliance'
import { isPushSubscribed, subscribeAppPush } from '@/lib/notifications/app-notify'
import { ensureNotificationPermission } from '@/lib/notifications/web-notify'
import { cn } from '@/lib/utils'
import { AlertTriangle, CheckCircle2, FileText, Fuel, Phone, Route, Truck, User, Wrench } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { Course } from '@/lib/domain/course'
import type { DailyReport } from '@/lib/domain/daily-report'

interface DriverHomeViewProps {
  tenantId: string
  driverName?: string
  onOpenReport?: () => void
  onOpenIssue?: () => void
  onOpenCourses?: () => void
}

export function DriverHomeView({
  tenantId,
  driverName,
  onOpenReport,
  onOpenIssue,
  onOpenCourses,
}: DriverHomeViewProps) {
  const [activeCourse, setActiveCourse] = useState<Course | null>(null)
  const [shiftEnded, setShiftEnded] = useState(false)
  const [vehicleReg, setVehicleReg] = useState<string | undefined>()
  const [vehicleId, setVehicleId] = useState<string | undefined>()
  const [intlWarnings, setIntlWarnings] = useState<string[]>([])

  const refreshHome = useCallback(() => {
    seedDemoCourses(tenantId)
    const courses = loadCourses(tenantId)
    const active = courses.find((c) => c.status === 'in_transit' || c.status === 'loading')
    setActiveCourse(active ?? null)
    if (active && courseNeedsInternationalCheck(active)) {
      setIntlWarnings(
        buildInternationalCourseAlerts(tenantId, [active]).map((a) => a.label),
      )
    } else {
      setIntlWarnings([])
    }
    if (driverName) {
      const today = getTodayReportForDriver(tenantId, driverName)
      setShiftEnded(today?.shiftEnded ?? false)
      syncDriverReminders(tenantId, driverName)
      const driver = findDriverByDisplayName(tenantId, driverName)
      const vehicle = driver ? resolveDriverVehicle(tenantId, driver) : undefined
      setVehicleReg(vehicle?.registration)
      setVehicleId(vehicle?.id)
    }
  }, [tenantId, driverName])

  useEffect(() => {
    refreshHome()
  }, [refreshHome])

  useCloudSyncRefreshKeys(tenantId, ['courses', 'daily-reports'], refreshHome)

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Dzień dobry{driverName ? `, ${driverName.split(' ')[0]}` : ''} — wszystko do trasy i raportu
        w telefonie, bez papieru po powrocie do bazy
      </p>

      {driverName && <DriverRepairsStatus tenantId={tenantId} driverName={driverName} compact />}

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
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>{activeCourse.cargo}</p>
            {activeCourse.unloadAt && (
              <p className="text-xs">
                Rozładunek plan:{' '}
                {new Date(activeCourse.unloadAt).toLocaleString('pl-PL', {
                  dateStyle: 'short',
                  timeStyle: 'short',
                })}
              </p>
            )}
            {intlWarnings.length > 0 && (
              <div className="rounded-md border border-warning/40 bg-warning/10 p-2 text-xs text-warning">
                <p className="font-medium">Uwaga — dokumenty międzynarodowe</p>
                <ul className="mt-1 list-inside list-disc">
                  {intlWarnings.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      <div className="grid gap-3">
        <QuickAction
          icon={Wrench}
          title="Zgłoś awarię"
          desc="Ciężarówka stoi? Zdjęcie + opis — biuro widzi od razu"
          onClick={onOpenIssue}
        />
        <QuickAction icon={Route} title="Moje kursy" desc="Trasa, załadunek, CMR — bez dzwonienia" onClick={onOpenCourses} />
        <QuickAction
          icon={FileText}
          title="Raport dzienny"
          desc="Km, paliwo, opłaty drogowe — wypełnij w kabinie"
          onClick={onOpenReport}
        />
      </div>

      {driverName && (
        <DriverLocationShare
          tenantId={tenantId}
          driverName={driverName}
          vehicleId={vehicleId}
          registration={vehicleReg}
          courseRef={activeCourse?.reference}
        />
      )}

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
  const [reportConflict, setReportConflict] = useState(false)
  const [courses, setCourses] = useState<Course[]>([])
  const baselineUpdatedAt = useRef<string | undefined>(undefined)

  const init = useCallback(() => {
    seedDemoCourses(tenantId)
    const loadedCourses = loadCourses(tenantId)
    setCourses(loadedCourses)
    const existing = getTodayReportForDriver(tenantId, driverName)
    if (existing) {
      setReport(existing)
      setSaved(existing.shiftEnded)
      baselineUpdatedAt.current = existing.serverSavedAt ?? existing.updatedAt
      setReportConflict(false)
      return
    }
    const driver = findDriverByDisplayName(tenantId, driverName)
    const suggested = activeCourseForDriver(tenantId, driverName, loadedCourses)
    const now = new Date().toISOString()
    setReport({
      ...createEmptyDailyReport(tenantId, driverName, driver?.id),
      id: crypto.randomUUID(),
      courseId: suggested?.id,
      courseReference: suggested?.reference,
      createdAt: now,
      updatedAt: now,
    })
    baselineUpdatedAt.current = now
    setReportConflict(false)
  }, [tenantId, driverName])

  const refreshFromCloud = useCallback(() => {
    seedDemoCourses(tenantId)
    setCourses(loadCourses(tenantId))
    const existing = getTodayReportForDriver(tenantId, driverName)
    if (!existing) return
    if (!saved) {
      const stale = checkRecordStale(
        tenantId,
        'daily-reports',
        existing.id,
        baselineUpdatedAt.current,
      )
      setReportConflict(stale.isStale)
      return
    }
    setReport(existing)
    setSaved(existing.shiftEnded)
    baselineUpdatedAt.current = existing.updatedAt
    setReportConflict(false)
  }, [tenantId, driverName, saved])

  useEffect(() => {
    init()
  }, [init])

  useCloudSyncRefreshKeys(tenantId, ['daily-reports', 'courses'], refreshFromCloud)

  function patch(partial: Partial<DailyReport>) {
    if (!report) return
    setReport({ ...report, ...partial })
    setSaved(false)
  }

  async function handleSave(endShift = false, force = false) {
    if (!report) return
    if (
      !force &&
      reportConflict &&
      !confirmSaveOverStaleRecord('Twój raport dzienny')
    ) {
      return
    }
    const savedReport: DailyReport = {
      ...report,
      shiftEnded: endShift ? true : report.shiftEnded,
      shiftEndedAt: endShift ? new Date().toISOString() : report.shiftEndedAt,
    }
    try {
      await upsertDailyReportGuarded(tenantId, savedReport, {
        baselineUpdatedAt: baselineUpdatedAt.current,
        force,
      })
      const fresh = getTodayReportForDriver(tenantId, driverName)
      if (fresh) {
        setReport(fresh)
        baselineUpdatedAt.current = fresh.serverSavedAt ?? fresh.updatedAt
      }
      setSaved(true)
      setReportConflict(false)
    } catch (e) {
      if (e instanceof StaleRecordSaveError) {
        window.alert(staleSaveMessage())
        setReportConflict(true)
      } else {
        throw e
      }
    }
  }

  function reloadReport() {
    const existing = getTodayReportForDriver(tenantId, driverName)
    if (!existing) return
    setReport(existing)
    setSaved(existing.shiftEnded)
    baselineUpdatedAt.current = existing.serverSavedAt ?? existing.updatedAt
    setReportConflict(false)
  }

  if (!report) return null

  const totalCosts = dailyReportTotalCosts(report)
  const drivingCheck = checkDailyDrivingLimit(report.drivingMinutes ?? 0)
  const driverCourses = courses.filter((c) => {
    const driver = findDriverByDisplayName(tenantId, driverName)
    return (
      ['planned', 'loading', 'in_transit'].includes(c.status) &&
      (!driver || !c.driverId || c.driverId === driver.id)
    )
  })

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
        <p className="mt-1 text-xs text-muted-foreground">
          Kwoty w zł — brutto (zapłacone). Opłaty w EUR nie wchodzą w „Koszty łącznie”.
        </p>
      </div>

      {reportConflict && (
        <EditConflictBanner
          onReload={reloadReport}
          onForceSave={() => handleSave(false, true)}
        />
      )}

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
            {report.courseReference && !report.courseId && (
              <p className="mb-1 text-xs text-muted-foreground">
                Przypisano po referencji: {report.courseReference}
              </p>
            )}
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
              {driverCourses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.reference} · {c.loadCity} → {c.unloadCity}
                </option>
              ))}
              {courses
                .filter(
                  (c) =>
                    !driverCourses.some((d) => d.id === c.id) &&
                    ['planned', 'loading', 'in_transit'].includes(c.status),
                )
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.reference} · (inny kierowca)
                  </option>
                ))}
            </Select>
            {report.courseId && (
              <p className="mt-1 text-xs text-success">
                Raport trafi do rozliczenia kursu — biuro zobaczy km i koszty przy zleceniu.
              </p>
            )}
          </Field>

          <Field label="Przejechane km">
            <Input
              type="number"
              inputMode="numeric"
              value={report.kmDriven || ''}
              onChange={(e) => patch({ kmDriven: Number(e.target.value) || 0 })}
            />
          </Field>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label={TOLL_FIELD_LABEL_PLN} hint={TOLL_FIELD_HINT}>
              <Input
                type="number"
                value={report.tollPln ?? ''}
                onChange={(e) =>
                  patch({ tollPln: e.target.value ? Number(e.target.value) : undefined })
                }
              />
            </Field>
            <Field label={TOLL_FIELD_LABEL_EUR}>
              <Input
                type="number"
                value={report.tollEur ?? ''}
                onChange={(e) =>
                  patch({ tollEur: e.target.value ? Number(e.target.value) : undefined })
                }
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
              Koszty łącznie (zł): <strong>{totalCosts.toLocaleString('pl-PL')} zł</strong>
            </p>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2">
        <Button className="w-full" size="lg" onClick={() => handleSave(false)} disabled={reportConflict}>
          Zapisz raport
        </Button>
        <Button
          className="w-full"
          size="lg"
          variant="secondary"
          onClick={() => handleSave(true)}
          disabled={reportConflict || report.shiftEnded}
        >
          {report.shiftEnded ? 'Zmiana zakończona' : 'Kończę pracę'}
        </Button>
      </div>
    </div>
  )
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {children}
    </div>
  )
}

export function DriverProfileView({ tenantId, driverName }: { tenantId: string; driverName: string }) {
  const driver = findDriverByDisplayName(tenantId, driverName)
  const vehicle = driver ? resolveDriverVehicle(tenantId, driver) : undefined
  seedDemoCompanyDocuments(tenantId)
  const ops = loadTenantSettingsData(tenantId).operationsContact

  if (!driver) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">Profil</h1>
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">
            Nie znaleziono kartoteki kierowcy dla {driverName}.
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-6">
      <div>
        <h1 className="text-xl font-semibold">Profil kierowcy</h1>
        <p className="text-sm text-muted-foreground">
          Dokumenty, pojazd i kontakt do biura — wszystko bez dzwonienia do szefa
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4" />
            {driverName}
          </CardTitle>
          <CardDescription>
            Kategoria {driver.licenseCategory}
            {driver.adrCertified ? ' · ADR' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {driver.phone && (
            <p>
              Telefon:{' '}
              <a href={`tel:${driver.phone.replace(/\s/g, '')}`} className="text-primary underline">
                {driver.phone}
              </a>
            </p>
          )}
        </CardContent>
      </Card>

      {vehicle && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Truck className="h-4 w-4" />
              Przypisany pojazd
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p className="font-semibold">{vehicle.registration}</p>
            <p className="text-muted-foreground">
              {vehicle.brand} {vehicle.model} · {vehicle.odometerKm?.toLocaleString('pl-PL')} km
            </p>
          </CardContent>
        </Card>
      )}

      {ops && (
        <Card className="border-primary/25">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Phone className="h-4 w-4 text-primary" />
              Dyspozytornia (nie szef)
            </CardTitle>
            <CardDescription>Operacje, kursy, awarie — pierwszy kontakt</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="font-medium">{ops.dispatcherName}</p>
            <a
              href={`tel:${ops.dispatcherPhone.replace(/\s/g, '')}`}
              className="inline-flex items-center gap-2 text-primary underline"
            >
              <Phone className="h-4 w-4" />
              {ops.dispatcherPhone}
            </a>
            {ops.dispatcherEmail && (
              <p className="text-muted-foreground">{ops.dispatcherEmail}</p>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Powiadomienia PWA</CardTitle>
          <CardDescription>Alerty o kursie, raporcie i ITD — także gdy app jest w tle</CardDescription>
        </CardHeader>
        <CardContent>
          <PushSubscribeButton />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dokumenty</CardTitle>
          <CardDescription>CKZ, prawo jazdy, badania — ważność</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {driver.documents.map((doc) => {
            const status = expiryStatus(doc.expiresAt)
            return (
              <div
                key={doc.label}
                className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm"
              >
                <span>{doc.label}</span>
                <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', EXPIRY_STATUS_COLORS[status])}>
                  {formatExpiryDate(doc.expiresAt)}
                </span>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}

function PushSubscribeButton() {
  const [subscribed, setSubscribed] = useState(isPushSubscribed())
  const [msg, setMsg] = useState<string | null>(null)

  async function enable() {
    const perm = await ensureNotificationPermission()
    if (perm !== 'granted') {
      setMsg('Brak zgody na powiadomienia w przeglądarce')
      return
    }
    const ok = await subscribeAppPush()
    setSubscribed(ok || isPushSubscribed())
    setMsg(ok ? 'Powiadomienia w tle włączone' : 'Tryb demo — bez VAPID key')
  }

  return (
    <div className="space-y-2">
      <Button variant="outline" size="sm" onClick={() => void enable()} disabled={subscribed}>
        {subscribed ? 'Powiadomienia aktywne' : 'Włącz powiadomienia push'}
      </Button>
      {msg && <p className="text-xs text-muted-foreground">{msg}</p>}
    </div>
  )
}
