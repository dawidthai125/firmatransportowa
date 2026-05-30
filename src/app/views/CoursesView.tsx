import { Button } from '@/app/components/ui/Button'
import { Card, CardContent } from '@/app/components/ui/Card'
import { Input, Label, Select } from '@/app/components/ui/Input'
import type { Course, CourseStatus } from '@/lib/domain/course'
import {
  COURSE_STATUS_COLORS,
  COURSE_STATUS_LABELS,
  courseMargin,
  createEmptyCourse,
} from '@/lib/domain/course'
import {
  deleteCourse,
  loadCourses,
  seedDemoCourses,
  upsertCourse,
} from '@/lib/domain/courses-store'
import { cn } from '@/lib/utils'
import { AlertTriangle, MapPin, Pencil, Plus, Route, Trash2, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

interface CoursesViewProps {
  tenantId: string
  readOnly?: boolean
}

export function CoursesView({ tenantId, readOnly = false }: CoursesViewProps) {
  const [courses, setCourses] = useState<Course[]>([])
  const [editing, setEditing] = useState<Course | null>(null)
  const [isNew, setIsNew] = useState(false)

  const refresh = useCallback(() => {
    seedDemoCourses(tenantId)
    setCourses(loadCourses(tenantId))
  }, [tenantId])

  useEffect(() => {
    refresh()
  }, [refresh])

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

  function handleSave() {
    if (!editing) return
    const saved = {
      ...editing,
      updatedAt: new Date().toISOString(),
      reference: editing.reference || `K/${new Date().getFullYear()}/${String(courses.length + 1).padStart(3, '0')}`,
    }
    setCourses(upsertCourse(tenantId, saved))
    closeForm()
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

      {courses.length === 0 ? (
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
        />
      )}
    </div>
  )
}

function CourseCard({
  course,
  onEdit,
  onDelete,
  readOnly,
}: {
  course: Course
  onEdit: () => void
  onDelete: () => void
  readOnly: boolean
}) {
  const margin = courseMargin(course)

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
              {course.adr && (
                <span className="flex items-center gap-1 rounded-full bg-danger/15 px-2 py-0.5 text-xs font-medium text-danger">
                  <AlertTriangle className="h-3 w-3" />
                  ADR
                </span>
              )}
            </div>

            <p className="text-sm text-muted-foreground">{course.cargo}</p>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                {course.loadCity} → {course.unloadCity}
              </span>
              {course.plannedKm && <span>{course.plannedKm} km</span>}
            </div>

            <div className="flex flex-wrap gap-3 text-sm">
              <span>
                Fracht: <strong className="text-foreground">{course.freightPln.toLocaleString('pl-PL')} zł</strong>
              </span>
              {course.routeCostsPln != null && (
                <span>
                  Koszty: <strong>{course.routeCostsPln.toLocaleString('pl-PL')} zł</strong>
                </span>
              )}
              <span className={margin >= 0 ? 'text-success' : 'text-danger'}>
                Marża: <strong>{margin.toLocaleString('pl-PL')} zł</strong>
              </span>
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
}: {
  course: Course
  isNew: boolean
  onChange: (c: Course) => void
  onSave: () => void
  onClose: () => void
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
            <Field label="Koszty trasy (zł)">
              <Input
                type="number"
                value={course.routeCostsPln ?? ''}
                onChange={(e) => patch({ routeCostsPln: e.target.value ? Number(e.target.value) : undefined })}
              />
            </Field>
          </div>

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
          <Button className="flex-1" onClick={onSave}>
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
