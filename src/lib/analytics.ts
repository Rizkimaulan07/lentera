import { getDay, subDays } from 'date-fns'
import type {
  ActivityAttendance,
  ActivityType,
  AppData,
  Attendance,
  AttendanceStatus,
  Participant,
} from '@/types'
import { dateKey, formatDate, summarizeAttendance } from '@/lib/utils'

export function recentWorkdays(workDays: number[], count: number) {
  const dates: Date[] = []
  let cursor = new Date()
  let guard = 0
  while (dates.length < count && guard < 60) {
    if (workDays.includes(getDay(cursor))) dates.unshift(cursor)
    cursor = subDays(cursor, 1)
    guard += 1
  }
  return dates
}

export function participantRecords(data: AppData, participantId: string) {
  return data.attendances
    .filter((item) => item.participantId === participantId)
    .sort((a, b) => b.date.localeCompare(a.date))
}

export function todayAttendance(data: AppData, participantId: string) {
  const key = dateKey(new Date())
  return data.attendances.find(
    (item) => item.participantId === participantId && item.date === key,
  )
}

export function participantsForSupervisor(data: AppData, supervisorId: string) {
  return data.participants.filter((item) => item.supervisorId === supervisorId)
}

export function participantsForTeacher(data: AppData, teacherId: string) {
  return data.participants.filter((item) => item.teacherId === teacherId)
}

/**
 * Peserta yang benar-benar sedang menjalani PKL: akun aktif dan berada pada
 * periode PKL yang sedang aktif.
 */
export function activePklParticipants(data: AppData) {
  const activePeriodIds = new Set(
    data.periods.filter((period) => period.active).map((period) => period.id),
  )
  return data.participants.filter((participant) => {
    const account = data.users.find((user) => user.id === participant.userId)
    return Boolean(account?.active) && activePeriodIds.has(participant.periodId)
  })
}

export function trendForParticipants(
  data: AppData,
  participantIds: string[],
  days = 7,
) {
  const dates = recentWorkdays(data.settings.workDays, days)
  return dates.map((date) => {
    const key = formatDate(date, 'yyyy-MM-dd')
    const records = data.attendances.filter(
      (item) => item.date === key && participantIds.includes(item.participantId),
    )
    const summary = summarizeAttendance(records)
    return {
      date: key,
      label: formatDate(date, 'EEE'),
      fullLabel: formatDate(date, 'd MMM'),
      hadir: summary.present,
      terlambat: summary.late,
      izin: summary.leave + summary.sick,
      alpa: summary.absent,
      total: records.length,
      rate: summary.rate,
    }
  })
}

export function statusDistribution(records: Attendance[]) {
  const counts: Record<AttendanceStatus, number> = {
    present: 0,
    late: 0,
    absent: 0,
    leave: 0,
    sick: 0,
  }
  records.forEach((record) => {
    counts[record.status] += 1
  })
  return counts
}

export function activityRecapForParticipant(
  data: AppData,
  participantId: string,
) {
  return data.activities
    .filter((activity) => activity.active)
    .map((activity) => {
      const records = data.activityAttendances.filter(
        (item) =>
          item.activityId === activity.id && item.participantId === participantId,
      )
      return recapFromRecords(activity.id, activity.name, activity.type, records)
    })
}

export function activityRecapAll(data: AppData, participantIds?: string[]) {
  return data.activities
    .filter((activity) => activity.active)
    .map((activity) => {
      const records = data.activityAttendances.filter(
        (item) =>
          item.activityId === activity.id &&
          (!participantIds || participantIds.includes(item.participantId)),
      )
      return recapFromRecords(activity.id, activity.name, activity.type, records)
    })
}

function recapFromRecords(
  id: string,
  name: string,
  type: ActivityType,
  records: ActivityAttendance[],
) {
  const present = records.filter((item) => item.status === 'present').length
  const total = records.length
  return {
    id,
    name,
    type,
    present,
    total,
    rate: total ? Math.round((present / total) * 100) : 0,
  }
}

export function participantStats(data: AppData, participant: Participant) {
  const records = participantRecords(data, participant.id)
  const summary = summarizeAttendance(records)
  return { records, summary }
}

export function lowAttendanceParticipants(
  data: AppData,
  participants: Participant[],
  threshold = 80,
) {
  return participants
    .map((participant) => ({
      participant,
      summary: summarizeAttendance(participantRecords(data, participant.id)),
    }))
    .filter((item) => item.summary.total > 0 && item.summary.rate < threshold)
    .sort((a, b) => a.summary.rate - b.summary.rate)
}

export function lateRanking(data: AppData, participants: Participant[]) {
  return participants
    .map((participant) => {
      const records = participantRecords(data, participant.id)
      const summary = summarizeAttendance(records)
      return { participant, late: summary.late, rate: summary.rate }
    })
    .filter((item) => item.late > 0)
    .sort((a, b) => b.late - a.late)
    .slice(0, 5)
}

export function divisionDistribution(data: AppData) {
  return data.divisions
    .map((division) => ({
      name: division.name,
      value: data.participants.filter((item) => item.divisionId === division.id)
        .length,
    }))
    .filter((item) => item.value > 0)
}
