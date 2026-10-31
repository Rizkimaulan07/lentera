import { Badge } from '@/components/ui/badge'
import {
  ATTENDANCE_STATUS_META,
  JOURNAL_STATUS_META,
  LEAVE_STATUS_META,
} from '@/lib/constants'
import type { AttendanceStatus, JournalStatus, LeaveStatus } from '@/types'
import { cn } from '@/lib/utils'

export function AttendanceBadge({
  status,
  className,
}: {
  status: AttendanceStatus
  className?: string
}) {
  const meta = ATTENDANCE_STATUS_META[status]
  return (
    <Badge className={cn(meta.badge, className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
      {meta.label}
    </Badge>
  )
}

export function LeaveBadge({ status }: { status: LeaveStatus }) {
  const meta = LEAVE_STATUS_META[status]
  return <Badge className={meta.badge}>{meta.label}</Badge>
}

export function JournalBadge({ status }: { status: JournalStatus }) {
  const meta = JOURNAL_STATUS_META[status]
  return <Badge className={meta.badge}>{meta.label}</Badge>
}
