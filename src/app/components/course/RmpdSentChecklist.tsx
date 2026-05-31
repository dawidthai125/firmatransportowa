import { Button } from '@/app/components/ui/Button'
import { Input } from '@/app/components/ui/Input'
import type { Course } from '@/lib/domain/course'
import { COURSE_STATUS_COLORS, COURSE_STATUS_LABELS } from '@/lib/domain/course'
import { loadCourses, seedDemoCourses, upsertCourseGuarded } from '@/lib/domain/courses-store'
import { ensureTrackingToken } from '@/lib/domain/weekly-planner'
import { cn } from '@/lib/utils'
import { Copy, ExternalLink, ShieldCheck } from 'lucide-react'

interface RmpdSentChecklistProps {
  tenantId: string
  course: Course
  onUpdated: (course: Course) => void
}

export function RmpdSentChecklist({ tenantId, course, onUpdated }: RmpdSentChecklistProps) {
  if (course.scope === 'domestic') return null

  async function patch(partial: Partial<Course>) {
    const now = new Date().toISOString()
    const updated = { ...course, ...partial, updatedAt: now, rmpdCheckedAt: now }
    await upsertCourseGuarded(tenantId, updated)
    onUpdated(updated)
  }

  return (
    <div className="space-y-2 rounded-lg border border-warning/30 bg-warning/5 p-3 text-sm">
      <p className="flex items-center gap-1.5 font-medium">
        <ShieldCheck className="h-4 w-4 text-warning" />
        RMPD / SENT — checklista
      </p>
      <CheckboxRow
        label="RMPD zarejestrowany (kurs poza UE)"
        checked={course.rmpdRegistered ?? false}
        onChange={(v) => patch({ rmpdRegistered: v })}
      />
      <CheckboxRow
        label="SENT zarejestrowany"
        checked={course.sentRegistered ?? false}
        onChange={(v) => patch({ sentRegistered: v })}
      />
      {course.cmrNumber && (
        <p className="text-xs text-muted-foreground">CMR: {course.cmrNumber}</p>
      )}
      {course.rmpdCheckedAt && (
        <p className="text-xs text-muted-foreground">
          Ostatnia weryfikacja: {new Date(course.rmpdCheckedAt).toLocaleString('pl-PL')}
        </p>
      )}
    </div>
  )
}

interface ClientTrackingLinkProps {
  tenantId: string
  course: Course
  onUpdated: (course: Course) => void
}

export function ClientTrackingLink({ tenantId, course, onUpdated }: ClientTrackingLinkProps) {
  const token = course.trackingToken ?? ensureTrackingToken(course)
  const url = `${window.location.origin}${window.location.pathname}#track/${token}`

  async function togglePublic(enabled: boolean) {
    const now = new Date().toISOString()
    const updated: Course = {
      ...course,
      trackingPublic: enabled,
      trackingToken: token,
      updatedAt: now,
    }
    await upsertCourseGuarded(tenantId, updated)
    onUpdated(updated)
  }

  function copyLink() {
    void navigator.clipboard.writeText(url)
  }

  return (
    <div className="space-y-2 rounded-lg border border-border p-3 text-sm">
      <p className="font-medium">Portal klienta — link śledzenia</p>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={course.trackingPublic ?? false}
          onChange={(e) => togglePublic(e.target.checked)}
        />
        Udostępnij klientowi (read-only)
      </label>
      {course.trackingPublic && (
        <div className="flex flex-wrap items-center gap-2">
          <Input readOnly value={url} className="text-xs" />
          <Button size="sm" variant="secondary" className="gap-1" onClick={copyLink}>
            <Copy className="h-3.5 w-3.5" />
            Kopiuj
          </Button>
          <a href={url} target="_blank" rel="noreferrer">
            <Button size="sm" variant="ghost" className="gap-1">
              <ExternalLink className="h-3.5 w-3.5" />
              Podgląd
            </Button>
          </a>
        </div>
      )}
    </div>
  )
}

/** Prosty wiersz checkbox — jeśli CheckboxRow nie istnieje, użyj inline */
function CheckboxRow({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex items-center gap-2">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  )
}

export function CourseTrackingBadge({ course }: { course: Course }) {
  return (
    <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', COURSE_STATUS_COLORS[course.status])}>
      {COURSE_STATUS_LABELS[course.status]}
    </span>
  )
}

// Re-export for Settings - seed demo not needed here
export function loadCourseForTracking(tenantId: string, token: string): Course | undefined {
  seedDemoCourses(tenantId)
  return loadCourses(tenantId).find((c) => c.trackingPublic && c.trackingToken === token)
}
