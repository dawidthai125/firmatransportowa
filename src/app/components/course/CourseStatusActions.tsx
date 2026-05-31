import { Button } from '@/app/components/ui/Button'
import {
  COURSE_STATUS_COLORS,
  COURSE_STATUS_LABELS,
  type Course,
  type CourseStatus,
} from '@/lib/domain/course'
import { upsertCourseGuarded } from '@/lib/domain/courses-store'
import { cn } from '@/lib/utils'
import { Loader2, Package, Truck, CheckCircle2 } from 'lucide-react'
import { useState } from 'react'

const DRIVER_STATUS_FLOW: { status: CourseStatus; label: string; icon: typeof Truck }[] = [
  { status: 'loading', label: 'Załadowany', icon: Package },
  { status: 'in_transit', label: 'W trasie', icon: Truck },
  { status: 'delivered', label: 'Dostarczony', icon: CheckCircle2 },
]

interface CourseStatusActionsProps {
  tenantId: string
  course: Course
  driverName: string
  onUpdated: (course: Course) => void
}

export function CourseStatusActions({
  tenantId,
  course,
  driverName,
  onUpdated,
}: CourseStatusActionsProps) {
  const [saving, setSaving] = useState<CourseStatus | null>(null)

  async function setStatus(status: CourseStatus) {
    if (course.status === status) return
    setSaving(status)
    try {
      const now = new Date().toISOString()
      const updated: Course = {
        ...course,
        status,
        statusUpdatedAt: now,
        statusUpdatedBy: driverName,
        updatedAt: now,
      }
      await upsertCourseGuarded(tenantId, updated)
      onUpdated(updated)
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="flex flex-wrap gap-2 pt-2">
      {DRIVER_STATUS_FLOW.map(({ status, label, icon: Icon }) => {
        const active = course.status === status
        const done =
          ['delivered', 'completed'].includes(course.status) &&
          ['loading', 'in_transit'].includes(status)
        return (
          <Button
            key={status}
            size="sm"
            variant={active ? 'default' : 'secondary'}
            disabled={saving !== null || done}
            className={cn('gap-1.5', active && COURSE_STATUS_COLORS[status])}
            onClick={() => setStatus(status)}
          >
            {saving === status ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Icon className="h-3.5 w-3.5" />
            )}
            {active ? COURSE_STATUS_LABELS[status] : label}
          </Button>
        )
      })}
    </div>
  )
}
