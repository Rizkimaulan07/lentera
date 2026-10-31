import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import type {
  Attendance,
  AttendanceSummary,
  Participant,
  Role,
  User,
} from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`
}

export function dateKey(date: Date | string = new Date()) {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'yyyy-MM-dd')
}

export function todayKey() {
  return dateKey(new Date())
}

export function formatDate(date: string | Date, pattern = 'd MMM yyyy') {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, pattern, { locale: localeId })
}

export function formatDateTime(date: string | Date) {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'd MMM yyyy, HH:mm', { locale: localeId })
}

export function formatTime(date: string | Date) {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'HH:mm')
}

export function timeAgo(date: string) {
  try {
    return formatDistanceToNow(parseISO(date), { addSuffix: true, locale: localeId })
  } catch {
    return '-'
  }
}

export function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

export function todayLabel() {
  return format(new Date(), 'EEEE, d MMMM yyyy', { locale: localeId })
}

export const roleLabels: Record<Role, string> = {
  admin: 'Admin PKL',
  supervisor: 'Pembimbing Industri',
  teacher: 'Guru Pembimbing',
  participant: 'Peserta PKL',
}

export function getParticipantName(
  participant: Participant | undefined,
  users: User[],
) {
  if (!participant) return 'Peserta'
  return users.find((u) => u.id === participant.userId)?.name ?? 'Peserta'
}

export function getParticipantByUserId(
  participants: Participant[],
  userId: string,
) {
  return participants.find((p) => p.userId === userId)
}

export function summarizeAttendance(records: Attendance[]): AttendanceSummary {
  const summary = records.reduce(
    (acc, record) => {
      acc.total += 1
      if (record.status === 'present') acc.present += 1
      if (record.status === 'late') acc.late += 1
      if (record.status === 'absent') acc.absent += 1
      if (record.status === 'leave') acc.leave += 1
      if (record.status === 'sick') acc.sick += 1
      return acc
    },
    { total: 0, present: 0, late: 0, absent: 0, leave: 0, sick: 0 },
  )
  return {
    ...summary,
    rate: summary.total ? Math.round(((summary.present + summary.late) / summary.total) * 100) : 0,
  }
}

export function distanceInMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
) {
  const R = 6371000
  const toRad = (value: number) => (value * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
}

export function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value))
}

export function weightedScore(
  scores: Record<string, number>,
  components: { id: string; weight: number }[],
) {
  const totalWeight = components.reduce((sum, item) => sum + item.weight, 0)
  if (!totalWeight) return 0
  const total = components.reduce(
    (sum, item) => sum + (scores[item.id] ?? 0) * item.weight,
    0,
  )
  return Math.round((total / totalWeight) * 10) / 10
}

export function gradeFromScore(score: number) {
  if (score >= 90) return { letter: 'A', label: 'Sangat Baik' }
  if (score >= 80) return { letter: 'B', label: 'Baik' }
  if (score >= 70) return { letter: 'C', label: 'Cukup' }
  if (score >= 60) return { letter: 'D', label: 'Kurang' }
  return { letter: 'E', label: 'Sangat Kurang' }
}

export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const escape = (value: string | number) => {
    const text = String(value ?? '')
    return /[",\n;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
  }
  const content = rows.map((row) => row.map(escape).join(';')).join('\r\n')
  const blob = new Blob(['\uFEFF', content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (!hours) return `${rest} menit`
  if (!rest) return `${hours} jam`
  return `${hours} jam ${rest} menit`
}

export function safeFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
