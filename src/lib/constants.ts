import type {
  AttendanceStatus,
  JournalStatus,
  LeaveStatus,
  LeaveType,
  QrType,
  Role,
} from '@/types'

export const APP_NAME = 'LENTERA'
export const APP_TAGLINE = 'Len Internship Realtime Attendance'
export const DEMO_PASSWORD = 'lentera123'

export const DEMO_ACCOUNTS: {
  role: Role
  name: string
  username: string
  password: string
  hint: string
}[] = [
  {
    role: 'participant',
    name: 'Nabila Putri',
    username: 'nabila',
    password: DEMO_PASSWORD,
    hint: 'Peserta PKL · Digital',
  },
  {
    role: 'supervisor',
    name: 'Rina Kartika',
    username: 'rina',
    password: DEMO_PASSWORD,
    hint: 'Pembimbing Industri · Digital',
  },
  {
    role: 'teacher',
    name: 'Ahmad Fauzi',
    username: 'ahmad',
    password: DEMO_PASSWORD,
    hint: 'Guru Pembimbing · SMKN 1 Bandung',
  },
  {
    role: 'admin',
    name: 'Koordinator PKL',
    username: 'admin',
    password: DEMO_PASSWORD,
    hint: 'Admin sistem',
  },
]

export const ATTENDANCE_STATUS_META: Record<
  AttendanceStatus,
  { label: string; badge: string; dot: string; calendar: string }
> = {
  present: {
    label: 'Hadir',
    badge: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
    dot: 'bg-emerald-500',
    calendar: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  },
  late: {
    label: 'Terlambat',
    badge: 'bg-amber-500/14 text-amber-700 dark:text-amber-300 border-amber-500/25',
    dot: 'bg-amber-500',
    calendar: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
  },
  absent: {
    label: 'Alpa',
    badge: 'bg-rose-500/12 text-rose-700 dark:text-rose-300 border-rose-500/20',
    dot: 'bg-rose-500',
    calendar: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
  },
  leave: {
    label: 'Izin',
    badge: 'bg-sky-500/12 text-sky-700 dark:text-sky-300 border-sky-500/20',
    dot: 'bg-sky-500',
    calendar: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30',
  },
  sick: {
    label: 'Sakit',
    badge: 'bg-violet-500/12 text-violet-700 dark:text-violet-300 border-violet-500/20',
    dot: 'bg-violet-500',
    calendar: 'bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30',
  },
}

export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  sick: 'Sakit',
  family: 'Keperluan keluarga',
  school: 'Sekolah / kegiatan lain',
  other: 'Lainnya',
}

export const LEAVE_STATUS_META: Record<
  LeaveStatus,
  { label: string; badge: string }
> = {
  pending: {
    label: 'Menunggu',
    badge: 'bg-amber-500/14 text-amber-700 dark:text-amber-300 border-amber-500/25',
  },
  approved: {
    label: 'Disetujui',
    badge: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
  },
  rejected: {
    label: 'Ditolak',
    badge: 'bg-rose-500/12 text-rose-700 dark:text-rose-300 border-rose-500/20',
  },
}

export const JOURNAL_STATUS_META: Record<
  JournalStatus,
  { label: string; badge: string }
> = {
  pending: {
    label: 'Menunggu validasi',
    badge: 'bg-amber-500/14 text-amber-700 dark:text-amber-300 border-amber-500/25',
  },
  approved: {
    label: 'Disetujui',
    badge: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
  },
  revision: {
    label: 'Perlu revisi',
    badge: 'bg-rose-500/12 text-rose-700 dark:text-rose-300 border-rose-500/20',
  },
}

export const QR_TYPE_LABELS: Record<QrType, string> = {
  attendance: 'Presensi harian',
  sports: 'Olahraga',
  dhuha: 'Dhuha',
}

export const ACTIVITY_TYPE_LABELS = {
  sports: 'Olahraga',
  dhuha: 'Dhuha',
} as const

export const DAY_LABELS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
export const DAY_SHORT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

export const CHART_COLORS = {
  primary: '#c8102e',
  accent: '#f5a524',
  emerald: '#10b981',
  sky: '#0ea5e9',
  rose: '#f43f5e',
  violet: '#8b5cf6',
}
