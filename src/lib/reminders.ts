import { format, getDay } from 'date-fns'
import type { ActivityType, AppData, Participant, Role } from '@/types'
import { dateKey } from '@/lib/utils'

export type ReminderKind = ActivityType | 'check-in' | 'check-out'

export interface ScheduleReminder {
  id: string
  kind: ReminderKind
  title: string
  description: string
  startTime: string
  endTime: string
  live: boolean
  finished: boolean
  priority: number
  href: string
  actionLabel: string
}

interface SessionInput {
  id: string
  name: string
  type: ActivityType
  startTime: string
  endTime: string
}

/**
 * Menyusun pengingat jadwal hari ini: sesi kegiatan (olahraga, dhuha, ambil
 * makan), presensi masuk, dan presensi pulang. Pengingat yang sedang
 * berlangsung selalu diurutkan paling atas.
 */
export function buildScheduleReminders(
  data: AppData,
  participant: Participant | undefined,
  role: Role,
  now = new Date(),
): ScheduleReminder[] {
  const time = format(now, 'HH:mm')
  const day = getDay(now)
  const reminders: ScheduleReminder[] = []

  const activityLink = participant
    ? { href: '/my-qr', actionLabel: 'Tunjukkan QR' }
    : role === 'admin'
      ? { href: '/scan-peserta', actionLabel: 'Scan peserta' }
      : { href: '/activities', actionLabel: 'Lihat jadwal' }
  const attendanceLink = { href: '/my-qr', actionLabel: 'Tunjukkan QR' }

  const sessions: SessionInput[] = data.activities
    .filter((activity) => activity.active && activity.days.includes(day))
    .map((activity) => ({
      id: activity.id,
      name: activity.name,
      type: activity.type,
      startTime: activity.startTime,
      endTime: activity.endTime,
    }))

  // Pengingat istirahat tetap muncul meskipun admin belum menambahkan kegiatan
  // "ambil makan" pada data lama.
  if (!data.activities.some((activity) => activity.type === 'meal')) {
    sessions.push({
      id: 'break-default',
      name: 'Istirahat & ambil makan',
      type: 'meal',
      startTime: '12:00',
      endTime: '13:00',
    })
  }

  sessions.forEach((session) => {
    const live = time >= session.startTime && time <= session.endTime
    const finished = time > session.endTime
    const isMeal = session.type === 'meal'

    const title = isMeal
      ? live
        ? 'Waktunya istirahat & ambil makan'
        : `Istirahat & ambil makan pukul ${session.startTime}`
      : live
        ? `Sesi ${session.name} sedang berlangsung`
        : `Jadwal ${session.name}`

    const description = isMeal
      ? live
        ? `Ambil makan siang pukul ${session.startTime}–${session.endTime} WIB. Tunjukkan QR ke Koordinator PKL sebelum mengambil makanan.`
        : `Istirahat siang dan ambil makan pukul ${session.startTime}–${session.endTime} WIB.`
      : live
        ? `Tunjukkan QR ke Koordinator PKL untuk mencatat kehadiran ${session.name} pukul ${session.startTime}–${session.endTime} WIB.`
        : `Sesi ${session.name} dijadwalkan pukul ${session.startTime}–${session.endTime} WIB.`

    reminders.push({
      id: `activity-${session.id}`,
      kind: session.type,
      title,
      description,
      startTime: session.startTime,
      endTime: session.endTime,
      live,
      finished,
      priority: isMeal ? 0 : 1,
      ...activityLink,
    })
  })

  if (participant) {
    const record = data.attendances.find(
      (item) => item.participantId === participant.id && item.date === dateKey(now),
    )
    const onLeave = record?.status === 'leave' || record?.status === 'sick'
    const hasCheckIn = Boolean(record?.checkIn)
    const hasCheckOut = Boolean(record?.checkOut)

    if (!onLeave && !hasCheckIn) {
      if (time < data.settings.checkInStart) {
        reminders.push({
          id: 'check-in',
          kind: 'check-in',
          title: 'Presensi masuk belum dibuka',
          description: `Presensi masuk dibuka pukul ${data.settings.checkInStart} WIB. Batas terlambat ${data.settings.lateLimit} WIB.`,
          startTime: data.settings.checkInStart,
          endTime: data.settings.lateLimit,
          live: false,
          finished: false,
          priority: 2,
          ...attendanceLink,
        })
      } else if (time <= data.settings.lateLimit) {
        reminders.push({
          id: 'check-in',
          kind: 'check-in',
          title: 'Waktunya presensi masuk',
          description: `Tunjukkan QR pribadimu ke Koordinator PKL sebelum pukul ${data.settings.lateLimit} WIB.`,
          startTime: data.settings.checkInStart,
          endTime: data.settings.lateLimit,
          live: true,
          finished: false,
          priority: 2,
          ...attendanceLink,
        })
      } else {
        reminders.push({
          id: 'check-in-late',
          kind: 'check-in',
          title: 'Presensi masuk belum tercatat',
          description: `Kamu melewati batas ${data.settings.lateLimit} WIB. Segera tunjukkan QR pribadimu ke Koordinator PKL.`,
          startTime: data.settings.checkInStart,
          endTime: data.settings.lateLimit,
          live: true,
          finished: false,
          priority: 2,
          ...attendanceLink,
        })
      }
    }

    if (hasCheckIn && !hasCheckOut) {
      const checkOutReached = time >= data.settings.checkOutTime
      reminders.push({
        id: 'check-out',
        kind: 'check-out',
        title: checkOutReached
          ? 'Waktunya presensi pulang'
          : 'Presensi pulang nanti',
        description: checkOutReached
          ? `Jam pulang ${data.settings.checkOutTime} WIB. Tunjukkan QR pribadimu ke Koordinator PKL untuk mencatat presensi pulang.`
          : `Jangan lupa presensi pulang mulai pukul ${data.settings.checkOutTime} WIB.`,
        startTime: data.settings.checkOutTime,
        endTime: '23:59',
        live: checkOutReached,
        finished: false,
        priority: 2,
        ...attendanceLink,
      })
    }
  }

  const liveReminders = reminders
    .filter((reminder) => reminder.live && !reminder.finished)
    .sort((a, b) => a.priority - b.priority)
  const upcomingReminders = reminders
    .filter((reminder) => !reminder.live && !reminder.finished)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))

  return [...liveReminders, ...upcomingReminders]
}
