import * as React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  CalendarDays,
  Clock3,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge, type BadgeProps } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { ActivityIcon } from '@/components/shared/activity-icon'
import { useAuth } from '@/providers/auth-provider'
import { useData } from '@/providers/data-provider'
import {
  buildScheduleReminders,
  type ReminderKind,
  type ScheduleReminder,
} from '@/lib/reminders'
import {
  cn,
  dateKey,
  getParticipantByUserId,
} from '@/lib/utils'

const NOTIFIED_KEY = 'lentera.reminders.v1'

const TONE_STYLES: Record<
  ReminderKind | 'none',
  { box: string; icon: string; badge: BadgeProps['variant'] }
> = {
  meal: {
    box: 'border-amber-500/30 bg-gradient-to-r from-amber-500/[0.14] via-orange-500/[0.08] to-card shadow-sm shadow-amber-500/10',
    icon: 'bg-amber-500 text-white',
    badge: 'warning',
  },
  sports: {
    box: 'border-emerald-500/25 bg-emerald-500/[0.07]',
    icon: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    badge: 'success',
  },
  dhuha: {
    box: 'border-violet-500/25 bg-violet-500/[0.07]',
    icon: 'bg-violet-500/15 text-violet-600 dark:text-violet-400',
    badge: 'info',
  },
  'check-in': {
    box: 'border-sky-500/25 bg-sky-500/[0.07]',
    icon: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
    badge: 'info',
  },
  'check-out': {
    box: 'border-sky-500/25 bg-sky-500/[0.07]',
    icon: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
    badge: 'info',
  },
  none: {
    box: 'border-border/70 bg-card',
    icon: 'bg-muted text-muted-foreground',
    badge: 'secondary',
  },
}

function ReminderIcon({
  kind,
  className,
}: {
  kind: ReminderKind
  className?: string
}) {
  if (kind === 'check-in' || kind === 'check-out') {
    return <Clock3 className={className} />
  }
  return <ActivityIcon type={kind} className={className} />
}

function reminderTimeLabel(reminder: ScheduleReminder) {
  if (reminder.kind === 'check-out') {
    return `Mulai ${reminder.startTime} WIB`
  }
  return `${reminder.startTime}–${reminder.endTime} WIB`
}

function useClock(intervalMs = 30_000) {
  const [now, setNow] = React.useState(() => new Date())
  React.useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), intervalMs)
    return () => window.clearInterval(interval)
  }, [intervalMs])
  return now
}

function readNotified(date: string) {
  try {
    const raw = localStorage.getItem(NOTIFIED_KEY)
    if (!raw) return new Set<string>()
    const parsed = JSON.parse(raw) as { date?: string; ids?: string[] }
    if (parsed.date !== date || !Array.isArray(parsed.ids)) return new Set<string>()
    return new Set(parsed.ids)
  } catch {
    return new Set<string>()
  }
}

function writeNotified(date: string, ids: Set<string>) {
  try {
    localStorage.setItem(
      NOTIFIED_KEY,
      JSON.stringify({ date, ids: [...ids] }),
    )
  } catch {
    // Notifikasi tetap tampil meski localStorage tidak tersedia.
  }
}

export function ScheduleReminderBanner() {
  const { user } = useAuth()
  const { data } = useData()
  const now = useClock()

  if (!user) return null

  const participant = getParticipantByUserId(data.participants, user.id)
  const reminder = buildScheduleReminders(
    data,
    participant,
    user.role,
    now,
  )[0]
  const tone = TONE_STYLES[reminder?.kind ?? 'none']
  const isLive = Boolean(reminder?.live)
  const liveLabel = isLive
    ? reminder?.kind === 'check-in' || reminder?.kind === 'check-out'
      ? 'Pengingat'
      : 'Berlangsung'
    : 'Berikutnya'

  return (
    <div
      className={cn(
        'no-print mb-4 overflow-hidden rounded-2xl border px-4 py-3 transition-colors sm:mb-5',
        tone.box,
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
              tone.icon,
            )}
          >
            {reminder ? (
              <ReminderIcon kind={reminder.kind} className="h-5 w-5" />
            ) : (
              <CalendarDays className="h-5 w-5" />
            )}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-extrabold">
                {reminder?.title ?? 'Tidak ada pengingat aktif'}
              </p>
              {reminder ? (
                <Badge variant={tone.badge}>{liveLabel}</Badge>
              ) : (
                <Badge variant="secondary">Tenang</Badge>
              )}
              {reminder ? (
                <Badge variant="secondary" className="font-mono text-[10px]">
                  <Clock3 className="h-3 w-3" />
                  {reminderTimeLabel(reminder)}
                </Badge>
              ) : null}
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
              {reminder?.description ??
                'Semua agenda hari ini sudah selesai. Pantau jadwal kegiatan rutin untuk pengingat berikutnya.'}
            </p>
          </div>
        </div>
        <Link
          to={reminder?.href ?? '/activities'}
          className={buttonVariants({
            variant:
              reminder?.kind === 'meal' && reminder.live ? 'default' : 'outline',
            size: 'sm',
            className: 'shrink-0',
          })}
        >
          {reminder ? (
            <ReminderIcon kind={reminder.kind} className="h-3.5 w-3.5" />
          ) : (
            <CalendarDays className="h-3.5 w-3.5" />
          )}
          {reminder?.actionLabel ?? 'Lihat jadwal'}
        </Link>
      </div>
    </div>
  )
}

export function ScheduleReminderToasts() {
  const { user } = useAuth()
  const { data } = useData()
  const navigate = useNavigate()

  React.useEffect(() => {
    if (!user) return
    const participant = getParticipantByUserId(data.participants, user.id)

    const check = () => {
      const now = new Date()
      const date = dateKey(now)
      const reminders = buildScheduleReminders(
        data,
        participant,
        user.role,
        now,
      ).filter((reminder) => reminder.live && !reminder.finished)
      const notified = readNotified(date)
      let changed = false

      reminders.slice(0, 2).forEach((reminder) => {
        if (notified.has(reminder.id)) return
        notified.add(reminder.id)
        changed = true

        const options = {
          description: reminder.description,
          duration: reminder.kind === 'meal' ? 12_000 : 9_000,
          action: {
            label: reminder.actionLabel,
            onClick: () => navigate(reminder.href),
          },
        }

        if (reminder.id === 'check-in-late') {
          toast.warning(reminder.title, options)
        } else if (reminder.kind === 'meal') {
          toast.info(reminder.title, options)
        } else if (
          reminder.kind === 'check-in' ||
          reminder.kind === 'check-out'
        ) {
          toast.info(reminder.title, options)
        } else {
          toast.success(reminder.title, options)
        }
      })

      if (changed) writeNotified(date, notified)
    }

    check()
    const interval = window.setInterval(check, 30_000)
    return () => window.clearInterval(interval)
  }, [data, navigate, user])

  return null
}
