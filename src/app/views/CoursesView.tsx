import { useInitialCloudSyncDone } from '@/app/CloudLoader'
import { Button } from '@/app/components/ui/Button'
import { Card, CardContent } from '@/app/components/ui/Card'
import { CloudSyncPlaceholder } from '@/app/components/ui/CloudSyncPlaceholder'
import { Input, Label, Select } from '@/app/components/ui/Input'
import {
  COURSE_TOLL_FIELD_LABEL,
  formatCourseTollEur,
} from '@/lib/domain/daily-report-format'
import {
  COURSE_SCOPE_LABELS,
  COURSE_STATUS_COLORS,
  COURSE_STATUS_LABELS,
  courseFreightDisplay,
  courseMargin,
  courseRouteLabel,
  createEmptyCourse,
  type Course,
  type CourseScope,
  type CourseStatus,
} from '@/lib/domain/course'
import {
  deleteCourse,
  loadCourses,
  seedDemoCourses,
  upsertCourse,
} from '@/lib/domain/courses-store'
import {
  buildInternationalCourseAlerts,
  courseNeedsInternationalCheck,
} from '@/lib/domain/international-compliance'
import {
  buildCourseSettlementSummaries,
  type CourseSettlementSummary,
} from '@/lib/domain/course-settlement'
import { loadDailyReports, seedDemoDailyReports } from '@/lib/domain/daily-reports-store'
import { EditConflictBanner } from '@/app/components/sync/EditConflictBanner'
import { useCloudSyncRefreshKeys } from '@/lib/sync/useCloudSyncRefresh'
import { useSyncedEditGuard } from '@/lib/sync/useSyncedEditGuard'
import { cn } from '@/lib/utils'
import { AlertTriangle, Globe, MapPin, Pencil, Plus, Route, Trash2, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

interface CoursesViewProps {
  tenantId: string
  readOnly?: boolean
}

export function CoursesView({ tenantId, readOnly = false }: CoursesViewProps) {
  const cloudReady = useInitialCloudSyncDone()
  const [courses, setCourses] = useState<Course[]>([])
  const [settlements, setSettlements] = useState<Map<string, CourseSettlementSummary>>(new Map())
  const [editing, setEditing] = useState<Course | null>(null)
  const [isNew, setIsNew] = useState(false)

  const refresh = useCallback(() => {
    seedDemoCourses(tenantId)
    seedDemoDailyReports(tenantId)
    const loaded = loadCourses(tenantId)
    const reports = loadDailyReports(tenantId)
    const sums = buildCourseSettlementSummaries(loaded, reports)
    setCourses(loaded)
    setSettlements(new Map(sums.map((s) => [s.courseId, s])))
  }, [tenantId])

  useEffect(() => {
    refresh()
  }, [refresh])

  useCloudSyncRefreshKeys(tenantId, ['courses', 'daily-reports'], refresh)

  const { conflict, reloadFromStore, guardSave } = useSyncedEditGuard(
    tenantId,
    'courses',
    editing,
    setEditing,
    isNew,
    'Ten kurs',
  )

  function openNew() {
    const base = createEmptyCourse(tenantId)
    const now = new Date().toISOString()
    setEditing({
      ...base,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    })
    setIsNew(true)
  }

  function openEdit(course: Course) {
    setEditing({ ...course })
    setIsNew(false)
  }

  function closeForm() {
    setEditing(null)
    setIsNew(false)
  }

  function saveCourse(force = false) {
    if (!editing) return
    if (!force && !guardSave()) return
    const saved = {
      ...editing,
      updatedAt: new Date().toISOString(),
      reference: editing.reference || `K/${new Date().getFullYear()}/${String(courses.length + 1).padStart(3, '0')}`,
    }
    setCourses(upsertCourse(tenantId, saved))
    closeForm()
  }

  function handleSave() {
    saveCourse(false)
  }

  function handleDelete(id: string) {
    if (!confirm('Usunąć ten kurs?')) return
    setCourses(deleteCourse(tenantId, id))
    if (editing?.id === id) closeForm()
  }

  const activeCount = courses.filter((c) => ['planned', 'loading', 'in_transit'].includes(c.status)).length

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Kursy i zlecenia</h1>
          <p className="text-sm text-muted-foreground">
            {courses.length} zleceń · {activeCount} aktywnych
          </p>
        </div>
        {!readOnly && (
          <Button onClick={openNew} className="gap-2">
            <Plus className="h-4 w-4" />
            Nowy kurs
          </Button>
        )}
      </div>

      {!cloudReady ? (
        <CloudSyncPlaceholder />
      ) : courses.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            Brak kursów. Dodaj pierwsze zlecenie transportowe.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              settlement={settlements.get(course.id)}
              onEdit={() => openEdit(course)}
              onDelete={() => handleDelete(course.id)}
              readOnly={readOnly}
            />
          ))}
        </div>
      )}

      {editing && (
        <CourseForm
          course={editing}
          isNew={isNew}
          onChange={setEditing}
          onSave={handleSave}
          onClose={closeForm}
          conflict={conflict}
          onReloadConflict={() => reloadFromStore(() => loadCourses(tenantId))}
          onForceSave={() => saveCourse(true)}
        />
      )}
    </div>
  )
}

function CourseCard({
  course,
  settlement,
  onEdit,
  onDelete,
  readOnly,
}: {
  course: Course
  settlement?: CourseSettlementSummary
  onEdit: () => void
  onDelete: () => void
  readOnly: boolean
}) {
  const margin = courseMargin(course)
  const isInternational = course.scope !== 'domestic'
  const intlIssues = courseNeedsInternationalCheck(course)
    ? buildInternationalCourseAlerts(course.tenantId, [course])
    : []

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Route className="h-4 w-4 shrink-0 text-primary" />
              <span className="font-semibold">{course.reference}</span>
              <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', COURSE_STATUS_COLORS[course.status])}>
                {COURSE_STATUS_LABELS[course.status]}
              </span>
              <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                {isInternational && <Globe className="h-3 w-3" />}
                {COURSE_SCOPE_LABELS[course.scope]}
              </span>
              {course.adr && (
                <span className="flex items-center gap-1 rounded-full bg-danger/15 px-2 py-0.5 text-xs font-medium text-danger">
                  <AlertTriangle className="h-3 w-3" />
                  ADR
                </span>
              )}
              {intlIssues.map((issue) => (
                <span
                  key={issue.id}
                  className={cn(
                    'flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                    issue.severity === 'critical'
                      ? 'bg-danger/15 text-danger'
                      : 'bg-warning/15 text-warning',
                  )}
                >
                  <AlertTriangle className="h-3 w-3" />
                  {issue.issue === 'missing_rmpd' ? 'RMPD' : issue.issue === 'missing_cmr' ? 'CMR' : 'Wypis'}
                </span>
              ))}
            </div>

            <p className="text-sm text-muted-foreground">{course.cargo}</p>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                {courseRouteLabel(course)}
              </span>
              {course.plannedKm && <span>{course.plannedKm} km</span>}
            </div>

            {course.cmrNumber && (
              <p className="text-xs text-muted-foreground">CMR: {course.cmrNumber}</p>
            )}

            <div className="flex flex-wrap gap-3 text-sm">
              <span>
                Fracht: <strong className="text-foreground">{courseFreightDisplay(course)}</strong>
              </span>
              {course.tollEur != null && course.tollEur > 0 && (
                <span>{formatCourseTollEur(course.tollEur)}</span>
              )}
              {course.routeCostsPln != null && (
                <span>
                  Koszty: <strong>{course.routeCostsPln.toLocaleString('pl-PL')} zł</strong>
                </span>
              )}
              {margin != null && (
                <span className={margin >= 0 ? 'text-success' : 'text-danger'}>
                  Marża plan: <strong>{margin.toLocaleString('pl-PL')} zł</strong>
                </span>
              )}
              {settlement && settlement.reportDays > 0 && (
                <span
                  className={
                    (settlement.actualMarginPln ?? 0) >= (settlement.plannedMarginPln ?? 0)
                      ? 'text-success'
                      : 'text-warning'
                  }
                >
                  Z raportów:{' '}
                  <strong>
                    {settlement.reportKm} km · {settlement.reportCostsPln.toLocaleString('pl-PL')} zł
                    {settlement.actualMarginPln != null &&
                      ` · marża ${settlement.actualMarginPln.toLocaleString('pl-PL')} zł`}
                  </strong>
                </span>
              )}
            </div>
          </div>

          {!readOnly && (
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={onEdit} aria-label="Edytuj">
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={onDelete} aria-label="Usuń">
                <Trash2 className="h-4 w-4 text-danger" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function CourseForm({
  course,
  isNew,
  onChange,
  onSave,
  onClose,
  conflict = false,
  onReloadConflict,
  onForceSave,
}: {
  course: Course
  isNew: boolean
  onChange: (c: Course) => void
  onSave: () => void
  onClose: () => void
  conflict?: boolean
  onReloadConflict?: () => void
  onForceSave?: () => void
}) {
  function patch(partial: Partial<Course>) {
    onChange({ ...course, ...partial })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4">
      <Card className="max-h-[92dvh] w-full max-w-lg overflow-hidden sm:rounded-lg">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="font-semibold">{isNew ? 'Nowy kurs' : 'Edycja kursu'}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="scroll-area max-h-[calc(92dvh-120px)] space-y-3 p-4">
          {conflict && onReloadConflict && (
            <EditConflictBanner
              onReload={onReloadConflict}
              onForceSave={onForceSave}
            />
          )}
          <Field label="Numer / referencja">
            <Input value={course.reference} onChange={(e) => patch({ reference: e.target.value })} placeholder="K/2026/003" />
          </Field>

          <Field label="Status">
            <Select value={course.status} onChange={(e) => patch({ status: e.target.value as CourseStatus })}>
              {Object.entries(COURSE_STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Zakres">
            <Select
              value={course.scope}
              onChange={(e) => patch({ scope: e.target.value as CourseScope })}
            >
              {Object.entries(COURSE_SCOPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nadawca">
              <Input value={course.shipper} onChange={(e) => patch({ shipper: e.target.value })} />
            </Field>
            <Field label="Odbiorca">
              <Input value={course.consignee} onChange={(e) => patch({ consignee: e.target.value })} />
            </Field>
          </div>

          <Field label="Ładunek">
            <Input value={course.cargo} onChange={(e) => patch({ cargo: e.target.value })} />
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Załadunek — miasto">
              <Input value={course.loadCity} onChange={(e) => patch({ loadCity: e.target.value })} />
            </Field>
            <Field label="Rozładunek — miasto">
              <Input value={course.unloadCity} onChange={(e) => patch({ unloadCity: e.target.value })} />
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Kraj załadunku">
              <Input
                value={course.loadCountry}
                onChange={(e) => patch({ loadCountry: e.target.value.toUpperCase().slice(0, 2) })}
                placeholder="PL"
              />
            </Field>
            <Field label="Kraj rozładunku">
              <Input
                value={course.unloadCountry}
                onChange={(e) => patch({ unloadCountry: e.target.value.toUpperCase().slice(0, 2) })}
                placeholder="DE"
              />
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Km plan">
              <Input
                type="number"
                value={course.plannedKm ?? ''}
                onChange={(e) => patch({ plannedKm: e.target.value ? Number(e.target.value) : undefined })}
              />
            </Field>
            <Field label="Fracht (zł)">
              <Input
                type="number"
                value={course.freightPln}
                onChange={(e) => patch({ freightPln: Number(e.target.value) || 0 })}
              />
            </Field>
            <Field label="Fracht (EUR)">
              <Input
                type="number"
                value={course.freightEur ?? ''}
                onChange={(e) => patch({ freightEur: e.target.value ? Number(e.target.value) : undefined })}
              />
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Koszty trasy (zł)">
              <Input
                type="number"
                value={course.routeCostsPln ?? ''}
                onChange={(e) => patch({ routeCostsPln: e.target.value ? Number(e.target.value) : undefined })}
              />
            </Field>
            <Field label={COURSE_TOLL_FIELD_LABEL}>
              <Input
                type="number"
                value={course.tollEur ?? ''}
                onChange={(e) => patch({ tollEur: e.target.value ? Number(e.target.value) : undefined })}
              />
            </Field>
          </div>

          {course.scope !== 'domestic' && (
            <>
              <Field label="Numer CMR">
                <Input
                  value={course.cmrNumber ?? ''}
                  onChange={(e) => patch({ cmrNumber: e.target.value || undefined })}
                />
              </Field>
              <Field label="Wypis z licencji wspólnotowej">
                <Input
                  value={course.licenseExtractNo ?? ''}
                  onChange={(e) => patch({ licenseExtractNo: e.target.value || undefined })}
                />
              </Field>
            </>
          )}

          {course.scope === 'international_third' && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={course.rmpdRegistered ?? false}
                onChange={(e) => patch({ rmpdRegistered: e.target.checked })}
                className="h-4 w-4 rounded border-border"
              />
              Zgłoszono w RMPD / SENT (PUESC)
            </label>
          )}

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={course.adr}
              onChange={(e) => patch({ adr: e.target.checked })}
              className="h-4 w-4 rounded border-border"
            />
            Transport ADR (materiały niebezpieczne)
          </label>

          <Field label="Uwagi">
            <Input value={course.notes ?? ''} onChange={(e) => patch({ notes: e.target.value })} />
          </Field>
        </div>

        <div className="flex gap-2 border-t border-border p-4">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Anuluj
          </Button>
          <Button className="flex-1" onClick={onSave} disabled={conflict}>
            Zapisz
          </Button>
        </div>
      </Card>
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
