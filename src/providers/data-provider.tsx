import * as React from 'react'
import { eachDayOfInterval, format, getDay } from 'date-fns'
import { usePersistentData } from '@/providers/use-persistent-data'
import { validateQrToken } from '@/lib/qr'
import {
  findParticipantByQrToken,
  isParticipantQrToken,
  parseParticipantQr,
} from '@/lib/participant-qr'
import {
  clamp,
  dateKey,
  distanceInMeters,
  getParticipantByUserId,
  todayKey,
  uid,
} from '@/lib/utils'
import type {
  Activity,
  ActivityAttendance,
  Announcement,
  AppData,
  Assessment,
  AssessmentComponent,
  Attendance,
  AttendanceSettings,
  AttendanceStatus,
  Division,
  Journal,
  JournalStatus,
  LeaveRequest,
  LeaveType,
  Period,
  Role,
  ScanResult,
  School,
  User,
} from '@/types'

export interface NewUserInput {
  actorId: string
  name: string
  username: string
  email: string
  phone: string
  password: string
  role: Role
  position?: string
  schoolId?: string
  divisionId?: string
  nis?: string
  major?: string
  className?: string
  supervisorId?: string
  teacherId?: string
  periodId?: string
}

interface DataContextValue {
  data: AppData
  reset: () => void
  updateSettings: (settings: AttendanceSettings, actorId: string) => void
  submitLeave: (input: {
    participantId: string
    type: LeaveType
    startDate: string
    endDate: string
    reason: string
    attachmentName?: string
  }) => LeaveRequest
  decideLeave: (
    id: string,
    decision: 'approved' | 'rejected',
    note: string,
    actorId: string,
  ) => void
  submitJournal: (input: {
    participantId: string
    date: string
    activity: string
    description: string
    duration: number
    obstacle?: string
    photoName?: string
  }) => Journal
  reviewJournal: (
    id: string,
    status: Exclude<JournalStatus, 'pending'>,
    comment: string,
    reviewerId: string,
  ) => void
  saveAssessment: (input: {
    participantId: string
    assessorId: string
    stage: 'mid' | 'final'
    scores: Record<string, number>
    finalize: boolean
  }) => { ok: boolean; message: string }
  saveAnnouncement: (input: {
    title: string
    body: string
    audience: Announcement['audience']
    createdBy: string
  }) => void
  deleteAnnouncement: (id: string, actorId: string) => void
  addUser: (input: NewUserInput) => { ok: boolean; message: string }
  toggleUserActive: (id: string, actorId: string) => void
  addSchool: (name: string, address: string, actorId: string) => void
  addDivision: (name: string, description: string, actorId: string) => void
  addPeriod: (
    name: string,
    startDate: string,
    endDate: string,
    actorId: string,
  ) => void
  activatePeriod: (id: string, actorId: string) => void
  saveComponents: (
    components: AssessmentComponent[],
    actorId: string,
  ) => { ok: boolean; message: string }
  saveActivity: (activity: Activity, actorId: string) => void
  processScan: (input: {
    userId: string
    token: string
    lat: number
    lng: number
    deviceId?: string
  }) => ScanResult
  recordManualAttendance: (input: {
    participantId: string
    date: string
    status: AttendanceStatus
    note: string
    actorId: string
    checkIn?: string
    checkOut?: string
  }) => { ok: boolean; message: string }
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: (userId: string) => void
  updateProfile: (userId: string, patch: Partial<User>) => void
  changePassword: (
    userId: string,
    currentPassword: string,
    nextPassword: string,
  ) => { ok: boolean; message: string }
}

const DataContext = React.createContext<DataContextValue | null>(null)

function pushLog(
  data: AppData,
  userId: string,
  action: string,
  object: string,
  detail: string,
) {
  data.logs = [
    {
      id: uid('log'),
      userId,
      action,
      object,
      detail,
      at: new Date().toISOString(),
    },
    ...data.logs,
  ]
}

function pushNotification(
  data: AppData,
  userId: string,
  title: string,
  body: string,
  href?: string,
) {
  data.notifications = [
    {
      id: uid('nt'),
      userId,
      title,
      body,
      read: false,
      createdAt: new Date().toISOString(),
      href,
    },
    ...data.notifications,
  ]
}

function participantName(data: AppData, participantId: string) {
  const participant = data.participants.find((item) => item.id === participantId)
  const user = data.users.find((item) => item.id === participant?.userId)
  return user?.name ?? 'Peserta'
}

function applyLeaveToAttendance(
  data: AppData,
  leave: LeaveRequest,
  participantId: string,
) {
  const status: AttendanceStatus = leave.type === 'sick' ? 'sick' : 'leave'
  const dates = eachDayOfInterval({
    start: new Date(leave.startDate),
    end: new Date(leave.endDate),
  }).filter((date) => data.settings.workDays.includes(getDay(date)))

  dates.forEach((date) => {
    const key = dateKey(date)
    const index = data.attendances.findIndex(
      (item) => item.participantId === participantId && item.date === key,
    )
    const note = `Izin ${leave.type === 'sick' ? 'sakit' : 'disetujui'}: ${leave.reason}`
    if (index >= 0) {
      data.attendances[index] = {
        ...data.attendances[index],
        status,
        checkIn: undefined,
        checkOut: undefined,
        method: 'manual',
        note,
      }
    } else {
      data.attendances.push({
        id: uid('att'),
        participantId,
        date: key,
        status,
        method: 'manual',
        note,
      })
    }
  })
}

function statusLabel(status: AttendanceStatus) {
  return {
    present: 'Hadir',
    late: 'Terlambat',
    absent: 'Alpa',
    leave: 'Izin',
    sick: 'Sakit',
  }[status]
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { data, setData, reset } = usePersistentData()
  const dataRef = React.useRef(data)
  dataRef.current = data
  const scanLock = React.useRef(false)

  const updateSettings = (settings: AttendanceSettings, actorId: string) => {
    setData((prev) => {
      const next = { ...prev, settings }
      pushLog(
        next,
        actorId,
        'Memperbarui pengaturan presensi',
        'Pengaturan presensi',
        `Jam masuk ${settings.checkInStart}, batas terlambat ${settings.lateLimit}, radius ${settings.radius} m, token ${settings.qrDuration} detik.`,
      )
      return next
    })
  }

  const submitLeave: DataContextValue['submitLeave'] = (input) => {
    const participant = dataRef.current.participants.find(
      (item) => item.id === input.participantId,
    )
    const leave: LeaveRequest = {
      id: uid('lv'),
      ...input,
      status: 'pending',
      createdAt: new Date().toISOString(),
    }
    setData((prev) => {
      const next = { ...prev, leaves: [leave, ...prev.leaves] }
      if (participant) {
        pushNotification(
          next,
          participant.supervisorId,
          'Pengajuan izin baru',
          `${participantName(next, participant.id)} mengajukan izin ${input.startDate === input.endDate ? input.startDate : `${input.startDate} – ${input.endDate}`}.`,
          '/leaves',
        )
        pushLog(
          next,
          participant.userId,
          'Mengajukan izin',
          `Izin ${input.type} · ${participantName(next, participant.id)}`,
          input.reason,
        )
      }
      return next
    })
    return leave
  }

  const decideLeave: DataContextValue['decideLeave'] = (id, decision, note, actorId) => {
    const leave = dataRef.current.leaves.find((item) => item.id === id)
    if (!leave) return
    setData((prev) => {
      const next = {
        ...prev,
        leaves: prev.leaves.map((item) =>
          item.id === id
            ? {
                ...item,
                status: decision,
                decidedBy: actorId,
                decisionNote: note,
              }
            : item,
        ),
      }
      if (decision === 'approved') {
        applyLeaveToAttendance(next, { ...leave, status: decision }, leave.participantId)
      }
      const participant = next.participants.find(
        (item) => item.id === leave.participantId,
      )
      if (participant) {
        pushNotification(
          next,
          participant.userId,
          decision === 'approved' ? 'Izin disetujui' : 'Izin ditolak',
          decision === 'approved'
            ? `Pengajuan izin kamu untuk ${leave.startDate} telah disetujui. Presensi otomatis diperbarui.`
            : `Pengajuan izin kamu ditolak. Catatan: ${note || 'Tidak ada catatan.'}`,
          '/leaves',
        )
      }
      pushLog(
        next,
        actorId,
        decision === 'approved' ? 'Menyetujui izin' : 'Menolak izin',
        `Izin ${leave.id} · ${participantName(next, leave.participantId)}`,
        note || 'Tanpa catatan tambahan.',
      )
      return next
    })
  }

  const submitJournal: DataContextValue['submitJournal'] = (input) => {
    const now = new Date().toISOString()
    const existing = dataRef.current.journals.find(
      (item) => item.participantId === input.participantId && item.date === input.date,
    )
    const journal: Journal = {
      id: existing?.id ?? uid('jr'),
      ...input,
      status: 'pending',
      comment: undefined,
      reviewedBy: undefined,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    }
    setData((prev) => {
      const next = {
        ...prev,
        journals: existing
          ? prev.journals.map((item) => (item.id === existing.id ? journal : item))
          : [journal, ...prev.journals],
      }
      const participant = next.participants.find(
        (item) => item.id === input.participantId,
      )
      if (participant) {
        pushNotification(
          next,
          participant.supervisorId,
          'Jurnal baru menunggu validasi',
          `${participantName(next, participant.id)} mengirim jurnal tanggal ${input.date}.`,
          '/journals',
        )
        pushLog(
          next,
          participant.userId,
          existing ? 'Memperbarui jurnal' : 'Mengirim jurnal',
          `Jurnal ${input.date} · ${participantName(next, participant.id)}`,
          input.activity,
        )
      }
      return next
    })
    return journal
  }

  const reviewJournal: DataContextValue['reviewJournal'] = (
    id,
    status,
    comment,
    reviewerId,
  ) => {
    setData((prev) => {
      const journal = prev.journals.find((item) => item.id === id)
      if (!journal) return prev
      const next = {
        ...prev,
        journals: prev.journals.map((item) =>
          item.id === id
            ? {
                ...item,
                status,
                comment,
                reviewedBy: reviewerId,
                updatedAt: new Date().toISOString(),
              }
            : item,
        ),
      }
      const participant = next.participants.find(
        (item) => item.id === journal.participantId,
      )
      if (participant) {
        pushNotification(
          next,
          participant.userId,
          status === 'approved' ? 'Jurnal disetujui' : 'Jurnal perlu revisi',
          status === 'approved'
            ? `Jurnal tanggal ${journal.date} telah disetujui.`
            : `Jurnal tanggal ${journal.date} perlu direvisi. Catatan: ${comment}`,
          '/journals',
        )
      }
      pushLog(
        next,
        reviewerId,
        status === 'approved' ? 'Memvalidasi jurnal' : 'Meminta revisi jurnal',
        `Jurnal ${journal.date} · ${participantName(next, journal.participantId)}`,
        comment || 'Tanpa catatan tambahan.',
      )
      return next
    })
  }

  const saveAssessment: DataContextValue['saveAssessment'] = (input) => {
    const existing = dataRef.current.assessments.find(
      (item) =>
        item.participantId === input.participantId && item.stage === input.stage,
    )
    if (existing?.status === 'final') {
      return {
        ok: false,
        message: 'Penilaian tahap ini sudah difinalisasi dan terkunci.',
      }
    }
    const assessment: Assessment = {
      id: existing?.id ?? uid('as'),
      participantId: input.participantId,
      assessorId: input.assessorId,
      stage: input.stage,
      scores: Object.fromEntries(
        Object.entries(input.scores).map(([key, value]) => [key, clamp(value)]),
      ),
      status: input.finalize ? 'final' : 'draft',
      updatedAt: new Date().toISOString(),
    }
    setData((prev) => {
      const next = {
        ...prev,
        assessments: existing
          ? prev.assessments.map((item) =>
              item.id === existing.id ? assessment : item,
            )
          : [assessment, ...prev.assessments],
      }
      const participant = next.participants.find(
        (item) => item.id === input.participantId,
      )
      if (participant && input.finalize) {
        pushNotification(
          next,
          participant.userId,
          'Nilai akhir sudah tersedia',
          `Penilaian tahap ${input.stage === 'final' ? 'akhir' : 'tengah'} telah difinalisasi oleh pembimbing industri.`,
          '/assessments',
        )
      }
      pushLog(
        next,
        input.assessorId,
        input.finalize ? 'Memfinalisasi penilaian' : 'Menyimpan draf penilaian',
        `Penilaian ${input.stage} · ${participantName(next, input.participantId)}`,
        `Tahap ${input.stage} ${input.finalize ? 'dikunci' : 'disimpan sebagai draf'}.`,
      )
      return next
    })
    return {
      ok: true,
      message: input.finalize
        ? 'Penilaian berhasil difinalisasi dan dikunci.'
        : 'Draf penilaian berhasil disimpan.',
    }
  }

  const saveAnnouncement: DataContextValue['saveAnnouncement'] = (input) => {
    const announcement: Announcement = {
      id: uid('an'),
      ...input,
      createdAt: new Date().toISOString(),
    }
    setData((prev) => {
      const next = {
        ...prev,
        announcements: [announcement, ...prev.announcements],
      }
      prev.users
        .filter(
          (user) =>
            user.active &&
            (input.audience === 'all' || user.role === input.audience),
        )
        .forEach((user) => {
          pushNotification(
            next,
            user.id,
            'Pengumuman baru',
            input.title,
            '/announcements',
          )
        })
      pushLog(
        next,
        input.createdBy,
        'Membuat pengumuman',
        input.title,
        `Target: ${input.audience}.`,
      )
      return next
    })
  }

  const deleteAnnouncement = (id: string, actorId: string) => {
    setData((prev) => {
      const announcement = prev.announcements.find((item) => item.id === id)
      const next = {
        ...prev,
        announcements: prev.announcements.filter((item) => item.id !== id),
      }
      if (announcement) {
        pushLog(
          next,
          actorId,
          'Menghapus pengumuman',
          announcement.title,
          'Pengumuman dihapus dari daftar.',
        )
      }
      return next
    })
  }

  const addUser: DataContextValue['addUser'] = (input) => {
    if (
      dataRef.current.users.some(
        (user) => user.username.toLowerCase() === input.username.toLowerCase(),
      )
    ) {
      return { ok: false, message: 'Username sudah digunakan.' }
    }
    if (input.role === 'participant') {
      if (
        !input.nis ||
        !input.schoolId ||
        !input.major ||
        !input.className ||
        !input.divisionId ||
        !input.supervisorId ||
        !input.teacherId
      ) {
        return {
          ok: false,
          message: 'Data penempatan peserta belum lengkap.',
        }
      }
    }
    const id = uid('u')
    const user: User = {
      id,
      name: input.name,
      username: input.username,
      email: input.email,
      password: input.password || 'lentera123',
      role: input.role,
      phone: input.phone,
      active: true,
      schoolId: input.schoolId,
      divisionId: input.divisionId,
      position: input.position,
      createdAt: new Date().toISOString(),
    }
    setData((prev) => {
      const next = { ...prev, users: [...prev.users, user] }
      if (input.role === 'participant') {
        next.participants = [
          ...prev.participants,
          {
            id: uid('p'),
            userId: id,
            nis: input.nis ?? '',
            schoolId: input.schoolId ?? '',
            major: input.major ?? '',
            className: input.className ?? '',
            divisionId: input.divisionId ?? '',
            periodId:
              input.periodId ??
              prev.periods.find((period) => period.active)?.id ??
              prev.periods[0]?.id ??
              '',
            supervisorId: input.supervisorId ?? '',
            teacherId: input.teacherId ?? '',
          },
        ]
      }
      pushNotification(
        next,
        id,
        'Selamat datang di LENTERA',
        'Akun kamu sudah aktif. Lengkapi profil dan mulai gunakan aplikasi.',
        '/profile',
      )
      pushLog(
        next,
        input.actorId,
        'Menambahkan pengguna',
        `${input.role} · ${input.name}`,
        `Akun @${input.username} dibuat.`,
      )
      return next
    })
    return { ok: true, message: 'Akun berhasil dibuat.' }
  }

  const toggleUserActive = (id: string, actorId: string) => {
    setData((prev) => {
      const target = prev.users.find((user) => user.id === id)
      if (!target) return prev
      const next = {
        ...prev,
        users: prev.users.map((user) =>
          user.id === id ? { ...user, active: !user.active } : user,
        ),
      }
      pushLog(
        next,
        actorId,
        target.active ? 'Menonaktifkan pengguna' : 'Mengaktifkan pengguna',
        `${target.role} · ${target.name}`,
        `Status akun diubah.`,
      )
      return next
    })
  }

  const addSchool = (name: string, address: string, actorId: string) => {
    const school: School = { id: uid('s'), name, address }
    setData((prev) => {
      const next = { ...prev, schools: [...prev.schools, school] }
      pushLog(next, actorId, 'Menambahkan sekolah', name, address)
      return next
    })
  }

  const addDivision = (name: string, description: string, actorId: string) => {
    const division: Division = { id: uid('d'), name, description }
    setData((prev) => {
      const next = { ...prev, divisions: [...prev.divisions, division] }
      pushLog(next, actorId, 'Menambahkan divisi', name, description)
      return next
    })
  }

  const addPeriod = (
    name: string,
    startDate: string,
    endDate: string,
    actorId: string,
  ) => {
    const period: Period = {
      id: uid('p'),
      name,
      startDate,
      endDate,
      active: false,
    }
    setData((prev) => {
      const next = { ...prev, periods: [...prev.periods, period] }
      pushLog(next, actorId, 'Menambahkan periode PKL', name, `${startDate} – ${endDate}`)
      return next
    })
  }

  const activatePeriod = (id: string, actorId: string) => {
    setData((prev) => {
      const period = prev.periods.find((item) => item.id === id)
      const next = {
        ...prev,
        periods: prev.periods.map((item) => ({ ...item, active: item.id === id })),
      }
      if (period) {
        pushLog(
          next,
          actorId,
          'Mengaktifkan periode PKL',
          period.name,
          'Periode aktif diperbarui.',
        )
      }
      return next
    })
  }

  const saveComponents: DataContextValue['saveComponents'] = (
    components,
    actorId,
  ) => {
    const total = components.reduce((sum, item) => sum + Number(item.weight || 0), 0)
    if (Math.round(total) !== 100) {
      return {
        ok: false,
        message: `Total bobot harus 100%. Saat ini ${Math.round(total)}%.`,
      }
    }
    setData((prev) => {
      const next = { ...prev, assessmentComponents: components }
      pushLog(
        next,
        actorId,
        'Memperbarui komponen penilaian',
        'Komponen & bobot nilai',
        `${components.length} komponen disimpan, total bobot 100%.`,
      )
      return next
    })
    return { ok: true, message: 'Komponen penilaian berhasil disimpan.' }
  }

  const saveActivity = (activity: Activity, actorId: string) => {
    setData((prev) => {
      const exists = prev.activities.some((item) => item.id === activity.id)
      const next = {
        ...prev,
        activities: exists
          ? prev.activities.map((item) => (item.id === activity.id ? activity : item))
          : [...prev.activities, activity],
      }
      pushLog(
        next,
        actorId,
        exists ? 'Memperbarui kegiatan' : 'Menambahkan kegiatan',
        activity.name,
        `Jadwal ${activity.days.length} hari, ${activity.startTime}–${activity.endTime}.`,
      )
      return next
    })
  }

  const processScan: DataContextValue['processScan'] = (input) => {
    if (scanLock.current) {
      return { ok: false, message: 'Pemindaian sedang diproses.', kind: 'attendance' }
    }
    scanLock.current = true
    try {
      const current = dataRef.current
      const operator = current.users.find((item) => item.id === input.userId)
      const personalQr = parseParticipantQr(input.token)
      const personalParticipantId = personalQr
        ? (personalQr.participantId ??
          findParticipantByQrToken(current.participants, personalQr.token)?.id)
        : undefined
      const isPersonalQr = Boolean(personalQr && personalParticipantId)
      const participant = isPersonalQr
        ? current.participants.find((item) => item.id === personalParticipantId)
        : getParticipantByUserId(current.participants, input.userId)

      if (!participant) {
        return {
          ok: false,
          message: isPersonalQr
            ? 'QR peserta tidak dikenali. Minta peserta menampilkan QR terbaru.'
            : 'Akun ini bukan peserta PKL aktif.',
          kind: 'attendance',
        }
      }

      if (isPersonalQr && personalQr) {
        if (
          !operator ||
          !['supervisor', 'teacher', 'admin'].includes(operator.role)
        ) {
          return {
            ok: false,
            message:
              'QR peserta hanya dapat dipindai oleh pembimbing, guru pembimbing, atau admin PKL.',
            kind: 'attendance',
          }
        }
        if (!isParticipantQrToken(participant.id, personalQr.token)) {
          return {
            ok: false,
            message:
              'Token QR peserta tidak valid. Minta peserta memperbarui QR-nya.',
            kind: 'attendance',
          }
        }
        const account = current.users.find(
          (item) => item.id === participant.userId,
        )
        const period = current.periods.find(
          (item) => item.id === participant.periodId,
        )
        if (!account?.active) {
          return {
            ok: false,
            message:
              'Akun peserta ini sedang nonaktif sehingga presensi tidak dapat dicatat.',
            kind: 'attendance',
          }
        }
        if (!period?.active) {
          return {
            ok: false,
            message:
              'Peserta ini tidak terdaftar pada periode PKL yang sedang aktif.',
            kind: 'attendance',
          }
        }
      }

      const validation = isPersonalQr ? null : validateQrToken(input.token)
      if (!isPersonalQr && !validation?.session) {
        return {
          ok: false,
          message: validation?.error ?? 'QR tidak valid.',
          kind: 'attendance',
        }
      }
      const session = validation?.session
      const qrType = session?.type ?? 'attendance'
      const studentName = participantName(current, participant.id)
      const logActorId =
        isPersonalQr && operator ? operator.id : participant.userId
      const scannedByNote =
        isPersonalQr && operator ? ` Dipindai oleh ${operator.name}.` : ''
      const now = new Date()
      const time = format(now, 'HH:mm')
      const distance = distanceInMeters(
        current.settings.latitude,
        current.settings.longitude,
        input.lat,
        input.lng,
      )
      if (distance > current.settings.radius) {
        return {
          ok: false,
          message: isPersonalQr
            ? `Lokasi pemindaian ${distance} m dari titik presensi. Maksimal ${current.settings.radius} m.`
            : `Lokasi kamu ${distance} m dari titik presensi. Maksimal ${current.settings.radius} m. Mendekatlah ke area PT Len lalu coba lagi.`,
          kind: qrType === 'attendance' ? 'attendance' : 'activity',
          distance,
        }
      }

      if (qrType === 'attendance') {
        if (!current.settings.workDays.includes(getDay(now))) {
          return {
            ok: false,
            message: 'Hari ini bukan hari kerja PKL. Presensi tidak diperlukan.',
            kind: 'attendance',
          }
        }
        const key = todayKey()
        const existing = current.attendances.find(
          (item) => item.participantId === participant.id && item.date === key,
        )
        if (existing?.status === 'leave' || existing?.status === 'sick') {
          return {
            ok: false,
            message: isPersonalQr
              ? `${studentName} sudah tercatat ${statusLabel(existing.status)} hari ini. Tidak perlu presensi lagi.`
              : `Presensi hari ini sudah tercatat sebagai ${statusLabel(existing.status)}. Tidak perlu presensi lagi.`,
            kind: 'attendance',
          }
        }
        if (existing?.checkIn && existing?.checkOut) {
          return {
            ok: false,
            message: isPersonalQr
              ? `${studentName} sudah presensi masuk dan pulang hari ini.`
              : 'Kamu sudah presensi masuk dan pulang hari ini.',
            kind: 'attendance',
          }
        }

        if (existing?.checkIn) {
          const updated: Attendance = { ...existing, checkOut: time }
          setData((prev) => {
            const next = {
              ...prev,
              attendances: prev.attendances.map((item) =>
                item.id === updated.id ? updated : item,
              ),
            }
            pushLog(
              next,
              logActorId,
              'Presensi QR pulang',
              `Presensi ${key} · ${studentName}`,
              `Pulang pukul ${time}, jarak ${distance} m.${scannedByNote}`,
            )
            return next
          })
          return {
            ok: true,
            kind: 'attendance',
            status: 'Pulang',
            time,
            distance,
            message: isPersonalQr
              ? `Presensi pulang ${studentName} tercatat pukul ${time}.`
              : `Presensi pulang tercatat pukul ${time}. Hati-hati di jalan!`,
          }
        }

        const status: AttendanceStatus =
          time > current.settings.lateLimit ? 'late' : 'present'
        const record: Attendance = {
          id: uid('att'),
          participantId: participant.id,
          date: key,
          checkIn: time,
          status,
          method: 'qr',
          lat: input.lat,
          lng: input.lng,
          deviceId: input.deviceId,
        }
        setData((prev) => {
          const next = {
            ...prev,
            attendances: [...prev.attendances, record],
          }
          pushLog(
            next,
            logActorId,
            'Presensi QR masuk',
            `Presensi ${key} · ${studentName}`,
            `Masuk pukul ${time} dengan status ${statusLabel(status)}.${scannedByNote}`,
          )
          return next
        })
        return {
          ok: true,
          kind: 'attendance',
          status: statusLabel(status),
          time,
          distance,
          message: isPersonalQr
            ? status === 'late'
              ? `Presensi masuk ${studentName} tercatat pukul ${time} dengan status Terlambat.`
              : `Presensi masuk ${studentName} tercatat pukul ${time}.`
            : status === 'late'
              ? `Presensi masuk tercatat pukul ${time}. Kamu melewati batas ${current.settings.lateLimit}, status: Terlambat.`
              : `Presensi masuk tercatat pukul ${time}. Selamat bekerja!`,
        }
      }

      const activity = current.activities.find(
        (item) => item.type === session?.type && item.active,
      )
      if (!activity) {
        return {
          ok: false,
          message: 'Kegiatan ini sedang tidak aktif. Hubungi pembimbing.',
          kind: 'activity',
        }
      }
      if (!activity.days.includes(getDay(now))) {
        return {
          ok: false,
          message: `Tidak ada sesi ${activity.name} hari ini.`,
          kind: 'activity',
        }
      }
      const key = todayKey()
      const existingActivity = current.activityAttendances.find(
        (item) =>
          item.activityId === activity.id &&
          item.participantId === participant.id &&
          item.date === key,
      )
      if (existingActivity) {
        return {
          ok: false,
          message: `Kamu sudah mencatat kehadiran ${activity.name} hari ini pukul ${existingActivity.scannedAt ? format(new Date(existingActivity.scannedAt), 'HH:mm') : '-'}.`,
          kind: 'activity',
          activityName: activity.name,
        }
      }
      const record: ActivityAttendance = {
        id: uid('aa'),
        activityId: activity.id,
        participantId: participant.id,
        date: key,
        status: 'present',
        scannedAt: now.toISOString(),
      }
      setData((prev) => {
        const next = {
          ...prev,
          activityAttendances: [...prev.activityAttendances, record],
        }
        pushLog(
          next,
          participant.userId,
          'Presensi kegiatan',
          `${activity.name} · ${key}`,
          `Hadir pukul ${time}, jarak ${distance} m.`,
        )
        return next
      })
      return {
        ok: true,
        kind: 'activity',
        status: 'Hadir',
        time,
        distance,
        activityName: activity.name,
        message: `Kehadiran ${activity.name} tercatat pukul ${time}.`,
      }
    } finally {
      scanLock.current = false
    }
  }

  const recordManualAttendance: DataContextValue['recordManualAttendance'] = (
    input,
  ) => {
    const current = dataRef.current
    const participant = current.participants.find(
      (item) => item.id === input.participantId,
    )
    if (!participant) return { ok: false, message: 'Peserta tidak ditemukan.' }
    const record: Attendance = {
      id: uid('att'),
      participantId: input.participantId,
      date: input.date,
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      status: input.status,
      method: 'manual',
      note: input.note,
    }
    setData((prev) => {
      const exists = prev.attendances.find(
        (item) =>
          item.participantId === input.participantId && item.date === input.date,
      )
      const next = {
        ...prev,
        attendances: exists
          ? prev.attendances.map((item) =>
              item.id === exists.id ? { ...record, id: exists.id } : item,
            )
          : [...prev.attendances, record],
      }
      pushLog(
        next,
        input.actorId,
        'Presensi manual',
        `Presensi ${input.date} · ${participantName(next, input.participantId)}`,
        `${statusLabel(input.status)}. Alasan: ${input.note}`,
      )
      return next
    })
    return { ok: true, message: 'Presensi manual berhasil disimpan.' }
  }

  const markNotificationRead = (id: string) => {
    setData((prev) => ({
      ...prev,
      notifications: prev.notifications.map((item) =>
        item.id === id ? { ...item, read: true } : item,
      ),
    }))
  }

  const markAllNotificationsRead = (userId: string) => {
    setData((prev) => ({
      ...prev,
      notifications: prev.notifications.map((item) =>
        item.userId === userId ? { ...item, read: true } : item,
      ),
    }))
  }

  const updateProfile = (userId: string, patch: Partial<User>) => {
    setData((prev) => {
      const next = {
        ...prev,
        users: prev.users.map((user) =>
          user.id === userId ? { ...user, ...patch } : user,
        ),
      }
      pushLog(
        next,
        userId,
        'Memperbarui profil',
        'Profil pengguna',
        'Data profil diperbarui.',
      )
      return next
    })
  }

  const changePassword: DataContextValue['changePassword'] = (
    userId,
    currentPassword,
    nextPassword,
  ) => {
    const user = dataRef.current.users.find((item) => item.id === userId)
    if (!user) return { ok: false, message: 'Pengguna tidak ditemukan.' }
    if (user.password !== currentPassword) {
      return { ok: false, message: 'Kata sandi saat ini tidak sesuai.' }
    }
    if (nextPassword.length < 6) {
      return { ok: false, message: 'Kata sandi baru minimal 6 karakter.' }
    }
    setData((prev) => ({
      ...prev,
      users: prev.users.map((item) =>
        item.id === userId ? { ...item, password: nextPassword } : item,
      ),
    }))
    return { ok: true, message: 'Kata sandi berhasil diperbarui.' }
  }

  const value: DataContextValue = {
    data,
    reset,
    updateSettings,
    submitLeave,
    decideLeave,
    submitJournal,
    reviewJournal,
    saveAssessment,
    saveAnnouncement,
    deleteAnnouncement,
    addUser,
    toggleUserActive,
    addSchool,
    addDivision,
    addPeriod,
    activatePeriod,
    saveComponents,
    saveActivity,
    processScan,
    recordManualAttendance,
    markNotificationRead,
    markAllNotificationsRead,
    updateProfile,
    changePassword,
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const context = React.useContext(DataContext)
  if (!context) throw new Error('useData harus dipakai di dalam DataProvider')
  return context
}
