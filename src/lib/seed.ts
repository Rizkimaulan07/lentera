import {
  addDays,
  eachDayOfInterval,
  getDay,
  isWeekend,
  subDays,
} from 'date-fns'
import type {
  Activity,
  ActivityAttendance,
  Announcement,
  AppData,
  AppNotification,
  Assessment,
  AssessmentComponent,
  Attendance,
  AttendanceSettings,
  Division,
  Journal,
  LeaveRequest,
  Participant,
  Period,
  School,
  User,
} from '@/types'
import { dateKey } from '@/lib/utils'

const now = new Date()
const stamp = (date: Date, time = '09:00') => `${dateKey(date)}T${time}:00`

function seeded(seed: number) {
  const value = Math.sin(seed * 12.9898) * 43758.5453
  return value - Math.floor(value)
}

function timeFromMinutes(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function user(
  id: string,
  name: string,
  username: string,
  role: User['role'],
  extra: Partial<User> = {},
): User {
  return {
    id,
    name,
    username,
    email: `${username}@lentera.id`,
    password: 'lentera123',
    role,
    phone: '0812-0000-0000',
    active: true,
    createdAt: stamp(subDays(now, 90)),
    ...extra,
  }
}

const users: User[] = [
  user('u_admin', 'Koordinator PKL', 'admin', 'admin', {
    email: 'koordinator@lentera.id',
    phone: '0812-1111-2001',
    position: 'Koordinator PKL Sekolah',
  }),
  user('u_rina', 'Rina Kartika', 'rina', 'supervisor', {
    email: 'rina.kartika@len.co.id',
    phone: '0812-1111-2002',
    position: 'Engineer Digital Platform',
    divisionId: 'd_digital',
  }),
  user('u_hendra', 'Hendra Wijaya', 'hendra', 'supervisor', {
    email: 'hendra.wijaya@len.co.id',
    phone: '0812-1111-2003',
    position: 'Network Engineer',
    divisionId: 'd_infra',
  }),
  user('u_ahmad', 'Ahmad Fauzi, S.Kom.', 'ahmad', 'teacher', {
    email: 'ahmad.fauzi@smkn1bdg.sch.id',
    phone: '0812-1111-2004',
    position: 'Guru Produktif RPL',
    schoolId: 's_smkn1',
  }),
  user('u_nabila', 'Nabila Putri', 'nabila', 'participant', {
    email: 'nabila.putri@student.smkn1bdg.sch.id',
    phone: '0812-2222-3001',
    schoolId: 's_smkn1',
    divisionId: 'd_digital',
  }),
  user('u_aditya', 'Aditya Pratama', 'aditya', 'participant', {
    email: 'aditya.pratama@student.smkn1bdg.sch.id',
    phone: '0812-2222-3002',
    schoolId: 's_smkn1',
    divisionId: 'd_infra',
  }),
  user('u_salsa', 'Salsabila Zahra', 'salsa', 'participant', {
    email: 'salsabila.zahra@student.smkn1bdg.sch.id',
    phone: '0812-2222-3003',
    schoolId: 's_smkn1',
    divisionId: 'd_digital',
  }),
  user('u_rizky', 'Rizky Ramadhan', 'rizky', 'participant', {
    email: 'rizky.ramadhan@student.smkn2bdg.sch.id',
    phone: '0812-2222-3004',
    schoolId: 's_smkn2',
    divisionId: 'd_infra',
  }),
  user('u_dinda', 'Dinda Ayu Lestari', 'dinda', 'participant', {
    email: 'dinda.ayu@student.smkn2bdg.sch.id',
    phone: '0812-2222-3005',
    schoolId: 's_smkn2',
    divisionId: 'd_infra',
  }),
  user('u_fajar', 'Fajar Nugroho', 'fajar', 'participant', {
    email: 'fajar.nugroho@student.smkn1bdg.sch.id',
    phone: '0812-2222-3006',
    schoolId: 's_smkn1',
    divisionId: 'd_digital',
  }),
  user('u_intan', 'Intan Permata', 'intan', 'participant', {
    email: 'intan.permata@student.smkn1bdg.sch.id',
    phone: '0812-2222-3007',
    schoolId: 's_smkn1',
    divisionId: 'd_digital',
  }),
  user('u_bagas', 'Bagas Saputra', 'bagas', 'participant', {
    email: 'bagas.saputra@student.smkn2bdg.sch.id',
    phone: '0812-2222-3008',
    schoolId: 's_smkn2',
    divisionId: 'd_infra',
  }),
]

const schools: School[] = [
  {
    id: 's_smkn1',
    name: 'SMKN 1 Bandung',
    address: 'Jl. Wastukancana No. 3, Bandung',
  },
  {
    id: 's_smkn2',
    name: 'SMKN 2 Bandung',
    address: 'Jl. Ciliwung No. 4, Bandung',
  },
  {
    id: 's_smk_telkom',
    name: 'SMK Telkom Bandung',
    address: 'Jl. Soekarno-Hatta No. 590, Bandung',
  },
]

const divisions: Division[] = [
  {
    id: 'd_digital',
    name: 'Digital & Teknologi',
    description: 'Pengembangan aplikasi, data, dan produk digital.',
  },
  {
    id: 'd_infra',
    name: 'Infrastruktur & Jaringan',
    description: 'Jaringan, server, dan operasional infrastruktur TI.',
  },
  {
    id: 'd_ops',
    name: 'Operasional',
    description: 'Operasional produksi dan layanan.',
  },
  {
    id: 'd_hc',
    name: 'Human Capital',
    description: 'Pengelolaan SDM dan pengembangan talenta.',
  },
]

const periods: Period[] = [
  {
    id: 'p_2026_ganjil',
    name: 'PKL Semester Ganjil 2026/2027',
    startDate: dateKey(subDays(now, 80)),
    endDate: dateKey(addDays(now, 50)),
    active: true,
  },
  {
    id: 'p_2026_genap',
    name: 'PKL Semester Genap 2026/2027',
    startDate: dateKey(addDays(now, 120)),
    endDate: dateKey(addDays(now, 240)),
    active: false,
  },
]

const participantSeeds: {
  id: string
  userId: string
  nis: string
  schoolId: string
  major: string
  className: string
  divisionId: string
  supervisorId: string
}[] = [
  {
    id: 'p_nabila',
    userId: 'u_nabila',
    nis: '221001',
    schoolId: 's_smkn1',
    major: 'Rekayasa Perangkat Lunak',
    className: 'XII RPL 1',
    divisionId: 'd_digital',
    supervisorId: 'u_rina',
  },
  {
    id: 'p_aditya',
    userId: 'u_aditya',
    nis: '221002',
    schoolId: 's_smkn1',
    major: 'Teknik Komputer & Jaringan',
    className: 'XII TKJ 2',
    divisionId: 'd_infra',
    supervisorId: 'u_hendra',
  },
  {
    id: 'p_salsa',
    userId: 'u_salsa',
    nis: '221003',
    schoolId: 's_smkn1',
    major: 'Rekayasa Perangkat Lunak',
    className: 'XI RPL 2',
    divisionId: 'd_digital',
    supervisorId: 'u_rina',
  },
  {
    id: 'p_rizky',
    userId: 'u_rizky',
    nis: '221004',
    schoolId: 's_smkn2',
    major: 'Teknik Komputer & Jaringan',
    className: 'XII TKJ 1',
    divisionId: 'd_infra',
    supervisorId: 'u_hendra',
  },
  {
    id: 'p_dinda',
    userId: 'u_dinda',
    nis: '221005',
    schoolId: 's_smkn2',
    major: 'Teknik Komputer & Jaringan',
    className: 'XI TKJ 2',
    divisionId: 'd_infra',
    supervisorId: 'u_hendra',
  },
  {
    id: 'p_fajar',
    userId: 'u_fajar',
    nis: '221006',
    schoolId: 's_smkn1',
    major: 'Rekayasa Perangkat Lunak',
    className: 'XII RPL 1',
    divisionId: 'd_digital',
    supervisorId: 'u_rina',
  },
  {
    id: 'p_intan',
    userId: 'u_intan',
    nis: '221007',
    schoolId: 's_smkn1',
    major: 'Rekayasa Perangkat Lunak',
    className: 'XI RPL 1',
    divisionId: 'd_digital',
    supervisorId: 'u_rina',
  },
  {
    id: 'p_bagas',
    userId: 'u_bagas',
    nis: '221008',
    schoolId: 's_smkn2',
    major: 'Teknik Komputer & Jaringan',
    className: 'XII TKJ 1',
    divisionId: 'd_infra',
    supervisorId: 'u_hendra',
  },
]

const participants: Participant[] = participantSeeds.map((participant) => ({
  ...participant,
  periodId: 'p_2026_ganjil',
  teacherId: 'u_ahmad',
}))

const leaveSeeds: LeaveRequest[] = [
  {
    id: 'lv_001',
    participantId: 'p_nabila',
    type: 'sick',
    startDate: dateKey(subDays(now, 12)),
    endDate: dateKey(subDays(now, 11)),
    reason: 'Demam dan sakit tenggorokan. Terlampir surat keterangan dokter.',
    attachmentName: 'surat-dokter-nabila.pdf',
    status: 'approved',
    decidedBy: 'u_rina',
    decisionNote: 'Semoga lekas sembuh. Silakan lanjutkan jurnal dari rumah.',
    createdAt: stamp(subDays(now, 13), '19:10'),
  },
  {
    id: 'lv_002',
    participantId: 'p_nabila',
    type: 'school',
    startDate: dateKey(addDays(now, 4)),
    endDate: dateKey(addDays(now, 4)),
    reason: 'Mewakili sekolah pada LKS Web Technologies tingkat Provinsi Jawa Barat.',
    attachmentName: 'surat-lks-provinsi.pdf',
    status: 'pending',
    createdAt: stamp(subDays(now, 1), '16:24'),
  },
  {
    id: 'lv_003',
    participantId: 'p_salsa',
    type: 'family',
    startDate: dateKey(addDays(now, 1)),
    endDate: dateKey(addDays(now, 1)),
    reason: 'Mendampingi orang tua kontrol di rumah sakit.',
    attachmentName: 'surat-keterangan-rs.jpg',
    status: 'pending',
    createdAt: stamp(subDays(now, 1), '20:02'),
  },
  {
    id: 'lv_004',
    participantId: 'p_aditya',
    type: 'sick',
    startDate: dateKey(subDays(now, 6)),
    endDate: dateKey(subDays(now, 5)),
    reason: 'Sakit demam berdarah, istirahat sesuai anjuran dokter.',
    attachmentName: 'surat-dokter-aditya.pdf',
    status: 'approved',
    decidedBy: 'u_hendra',
    decisionNote: 'Disetujui. Update jurnal setelah kembali.',
    createdAt: stamp(subDays(now, 7), '08:15'),
  },
  {
    id: 'lv_005',
    participantId: 'p_fajar',
    type: 'family',
    startDate: dateKey(subDays(now, 8)),
    endDate: dateKey(subDays(now, 8)),
    reason: 'Acara keluarga di luar kota.',
    status: 'rejected',
    decidedBy: 'u_rina',
    decisionNote: 'Ditolak karena tidak ada surat pendukung dan bertepatan dengan demo sprint.',
    createdAt: stamp(subDays(now, 9), '13:40'),
  },
  {
    id: 'lv_006',
    participantId: 'p_intan',
    type: 'other',
    startDate: dateKey(addDays(now, 2)),
    endDate: dateKey(addDays(now, 2)),
    reason: 'Mengurus administrasi beasiswa di kampus.',
    status: 'pending',
    createdAt: stamp(now, '07:42'),
  },
  {
    id: 'lv_007',
    participantId: 'p_rizky',
    type: 'school',
    startDate: dateKey(subDays(now, 3)),
    endDate: dateKey(subDays(now, 3)),
    reason: 'Mengikuti simulasi UNBK di sekolah.',
    attachmentName: 'undangan-sekolah.pdf',
    status: 'approved',
    decidedBy: 'u_hendra',
    decisionNote: 'Disetujui, jangan lupa koordinasi pekerjaan.',
    createdAt: stamp(subDays(now, 4), '10:10'),
  },
]

const attendance: Attendance[] = []
const workdayRange = eachDayOfInterval({
  start: subDays(now, 34),
  end: subDays(now, 1),
}).filter((date) => !isWeekend(date))

participants.forEach((participant, participantIndex) => {
  workdayRange.forEach((date, dayIndex) => {
    const roll = seeded(participantIndex * 41 + dayIndex * 13 + 3)
    let status: Attendance['status'] = 'present'
    let checkIn: string | undefined
    let checkOut: string | undefined

    if (roll < 0.045) {
      status = 'absent'
    } else if (roll < 0.075) {
      status = 'leave'
    } else if (roll < 0.1) {
      status = 'sick'
    } else {
      const minuteRoll = seeded(participantIndex * 17 + dayIndex * 29 + 8)
      const checkInMinutes = 445 + Math.floor(minuteRoll * 40)
      checkIn = timeFromMinutes(checkInMinutes)
      status = checkInMinutes > 480 ? 'late' : 'present'
      const outMinutes = 965 + Math.floor(seeded(dayIndex * 7 + participantIndex) * 35)
      checkOut = timeFromMinutes(outMinutes)
    }

    attendance.push({
      id: `att_${participant.id}_${dayIndex}`,
      participantId: participant.id,
      date: dateKey(date),
      checkIn,
      checkOut,
      status,
      method: 'qr',
      lat: -6.9436 + (seeded(dayIndex) - 0.5) * 0.0004,
      lng: 107.633 + (seeded(dayIndex + 9) - 0.5) * 0.0004,
      deviceId: `LEN-${participant.nis}-01`,
    })
  })
})

// Today's data: Nabila sengaja belum presensi agar alur scan bisa dicoba.
const todayCheckIns: Record<string, { checkIn?: string; status: Attendance['status'] }> = {
  p_salsa: { checkIn: '07:42', status: 'present' },
  p_fajar: { checkIn: '08:14', status: 'late' },
  p_intan: { checkIn: '07:55', status: 'present' },
  p_aditya: { checkIn: '07:39', status: 'present' },
  p_rizky: { checkIn: '08:07', status: 'late' },
  p_dinda: { checkIn: '07:51', status: 'present' },
}
Object.entries(todayCheckIns).forEach(([participantId, value]) => {
  attendance.push({
    id: `att_${participantId}_today`,
    participantId,
    date: dateKey(now),
    checkIn: value.checkIn,
    status: value.status,
    method: 'qr',
    lat: -6.9436,
    lng: 107.633,
    deviceId: `LEN-${participantId}`,
  })
})

// Terapkan izin yang disetujui ke presensi.
leaveSeeds
  .filter((leave) => leave.status === 'approved')
  .forEach((leave) => {
    eachDayOfInterval({
      start: new Date(leave.startDate),
      end: new Date(leave.endDate),
    })
      .filter((date) => !isWeekend(date))
      .forEach((date) => {
        const key = dateKey(date)
        const existing = attendance.find(
          (item) => item.participantId === leave.participantId && item.date === key,
        )
        const status = leave.type === 'sick' ? 'sick' : 'leave'
        if (existing) {
          existing.status = status
          existing.checkIn = undefined
          existing.checkOut = undefined
          existing.note = `Izin disetujui: ${leave.reason}`
        } else {
          attendance.push({
            id: `att_${leave.participantId}_${key}`,
            participantId: leave.participantId,
            date: key,
            status,
            method: 'manual',
            note: `Izin disetujui: ${leave.reason}`,
          })
        }
      })
  })

const activities: Activity[] = [
  {
    id: 'act_sports',
    name: 'Olahraga Pagi',
    type: 'sports',
    days: [5],
    startTime: '06:30',
    endTime: '07:30',
    active: true,
    mandatory: true,
  },
  {
    id: 'act_dhuha',
    name: 'Dhuha Bersama',
    type: 'dhuha',
    days: [1, 2, 3, 4, 5],
    startTime: '07:00',
    endTime: '07:20',
    active: true,
    mandatory: true,
  },
]

const activityAttendances: ActivityAttendance[] = []
const recentWorkdays = eachDayOfInterval({
  start: subDays(now, 21),
  end: subDays(now, 1),
}).filter((date) => !isWeekend(date))

participants.forEach((participant, participantIndex) => {
  recentWorkdays.forEach((date, index) => {
    const day = getDay(date)
    activities.forEach((activity) => {
      if (!activity.days.includes(day)) return
      if (activity.type === 'dhuha' && index > 14) return
      const roll = seeded(participantIndex * 61 + index * 19 + (activity.type === 'sports' ? 5 : 11))
      activityAttendances.push({
        id: `aa_${activity.id}_${participant.id}_${dateKey(date)}`,
        activityId: activity.id,
        participantId: participant.id,
        date: dateKey(date),
        status: roll < 0.86 ? 'present' : roll < 0.94 ? 'absent' : 'leave',
        scannedAt:
          roll < 0.86
            ? `${dateKey(date)}T${activity.startTime}:00`
            : undefined,
      })
    })
  })
})

const journalTemplates = [
  {
    activity: 'Pengembangan modul dashboard',
    description:
      'Melanjutkan slicing komponen dashboard menggunakan React dan Tailwind. Merapikan responsive layout untuk tablet dan menyelesaikan komponen kartu statistik.',
    obstacle: 'Data dummy belum sesuai format API, sementara memakai adapter lokal.',
  },
  {
    activity: 'Integrasi API presensi',
    description:
      'Mempelajari kontrak API presensi bersama pembimbing, lalu membuat service layer dan hook untuk mengambil riwayat kehadiran. Menguji error state saat jaringan terputus.',
    obstacle: 'Endpoint masih mock, perlu penyesuaian saat backend siap.',
  },
  {
    activity: 'Review kode dan dokumentasi',
    description:
      'Mengikuti code review bersama tim. Memperbaiki struktur folder fitur, menambahkan dokumentasi singkat cara menjalankan proyek, dan merapikan konfigurasi environment.',
  },
  {
    activity: 'Riset komponen QR scanner',
    description:
      'Membandingkan beberapa library pemindai QR untuk browser mobile. Menguji performa kamera dan akurasi pembacaan pada kondisi cahaya rendah.',
    obstacle: 'Kamera laptop kurang tajam, pengujian dilanjutkan di HP.',
  },
  {
    activity: 'Penyusunan laporan progres',
    description:
      'Merekap progres mingguan, membuat daftar pekerjaan selesai, dan menyiapkan bahan presentasi untuk evaluasi bersama pembimbing industri.',
  },
]

const journals: Journal[] = []
const nabilaStatuses: Journal['status'][] = ['approved', 'revision', 'approved', 'pending', 'approved']
const nabilaDays = [1, 2, 3, 4, 7]
nabilaDays.forEach((daysAgo, index) => {
  const template = journalTemplates[index % journalTemplates.length]
  const date = subDays(now, daysAgo)
  journals.push({
    id: `jr_nabila_${index}`,
    participantId: 'p_nabila',
    date: dateKey(date),
    activity: template.activity,
    description: template.description,
    duration: 420 + index * 15,
    obstacle: template.obstacle,
    photoName: index === 0 ? 'dashboard-slicing.png' : undefined,
    status: nabilaStatuses[index],
    comment:
      nabilaStatuses[index] === 'revision'
        ? 'Tambahkan detail kendala dan solusi yang kamu coba, ya. Lalu ajukan ulang.'
        : nabilaStatuses[index] === 'approved'
          ? 'Bagus, dokumentasi sudah jelas. Lanjutkan.'
          : undefined,
    reviewedBy:
      nabilaStatuses[index] === 'pending' ? undefined : 'u_rina',
    createdAt: `${dateKey(date)}T16:30:00`,
    updatedAt: `${dateKey(date)}T16:30:00`,
  })
})

participants.slice(1).forEach((participant, participantIndex) => {
  const template = journalTemplates[(participantIndex + 2) % journalTemplates.length]
  const date = subDays(now, participantIndex % 2 === 0 ? 1 : 2)
  journals.push({
    id: `jr_${participant.id}`,
    participantId: participant.id,
    date: dateKey(date),
    activity: template.activity,
    description: template.description,
    duration: 390 + participantIndex * 20,
    obstacle: template.obstacle,
    status: participantIndex % 3 === 0 ? 'pending' : 'approved',
    comment: participantIndex % 3 === 0 ? undefined : 'Diterima, terima kasih.',
    reviewedBy: participantIndex % 3 === 0 ? undefined : participant.supervisorId,
    createdAt: `${dateKey(date)}T16:10:00`,
    updatedAt: `${dateKey(date)}T16:10:00`,
  })
})

const assessmentComponents: AssessmentComponent[] = [
  { id: 'c_discipline', name: 'Disiplin & Kehadiran', weight: 20, auto: 'attendance' },
  { id: 'c_ethics', name: 'Etika & Tanggung Jawab', weight: 15 },
  { id: 'c_teamwork', name: 'Kerja Sama & Komunikasi', weight: 15 },
  { id: 'c_technical', name: 'Keterampilan Teknis', weight: 25 },
  { id: 'c_initiative', name: 'Inisiatif & Kemandirian', weight: 10 },
  { id: 'c_report', name: 'Laporan & Jurnal', weight: 15 },
]

const assessments: Assessment[] = [
  {
    id: 'as_nabila_final',
    participantId: 'p_nabila',
    assessorId: 'u_rina',
    stage: 'final',
    scores: {
      c_ethics: 92,
      c_teamwork: 90,
      c_technical: 94,
      c_initiative: 88,
      c_report: 91,
    },
    status: 'final',
    updatedAt: stamp(subDays(now, 2), '15:20'),
  },
  {
    id: 'as_salsa_mid',
    participantId: 'p_salsa',
    assessorId: 'u_rina',
    stage: 'mid',
    scores: {
      c_ethics: 86,
      c_teamwork: 88,
      c_technical: 84,
      c_initiative: 82,
      c_report: 85,
    },
    status: 'draft',
    updatedAt: stamp(subDays(now, 5), '14:00'),
  },
  {
    id: 'as_fajar_final',
    participantId: 'p_fajar',
    assessorId: 'u_rina',
    stage: 'final',
    scores: {
      c_ethics: 88,
      c_teamwork: 85,
      c_technical: 90,
      c_initiative: 87,
      c_report: 86,
    },
    status: 'final',
    updatedAt: stamp(subDays(now, 3), '16:45'),
  },
  {
    id: 'as_aditya_mid',
    participantId: 'p_aditya',
    assessorId: 'u_hendra',
    stage: 'mid',
    scores: {
      c_ethics: 82,
      c_teamwork: 84,
      c_technical: 78,
      c_initiative: 80,
      c_report: 83,
    },
    status: 'draft',
    updatedAt: stamp(subDays(now, 4), '11:30'),
  },
  {
    id: 'as_dinda_final',
    participantId: 'p_dinda',
    assessorId: 'u_hendra',
    stage: 'final',
    scores: {
      c_ethics: 90,
      c_teamwork: 89,
      c_technical: 86,
      c_initiative: 88,
      c_report: 90,
    },
    status: 'final',
    updatedAt: stamp(subDays(now, 1), '10:15'),
  },
]

const announcements: Announcement[] = [
  {
    id: 'an_001',
    title: 'Selamat datang di LENTERA',
    body: 'Mulai hari ini seluruh presensi, izin, jurnal, dan penilaian PKL dilakukan melalui LENTERA. Pastikan izin kamera dan lokasi aktif saat melakukan presensi QR. Hubungi pembimbing jika mengalami kendala.',
    audience: 'all',
    createdBy: 'u_admin',
    createdAt: stamp(subDays(now, 20), '08:00'),
  },
  {
    id: 'an_002',
    title: 'Penyesuaian jam presensi hari Jumat',
    body: 'Khusus hari Jumat, peserta diharapkan sudah berada di area PT Len pukul 06:15 untuk mengikuti olahraga pagi. Presensi harian tetap dapat dilakukan setelah kegiatan olahraga selesai.',
    audience: 'participant',
    createdBy: 'u_admin',
    createdAt: stamp(subDays(now, 3), '15:30'),
  },
  {
    id: 'an_003',
    title: 'Batas pengumpulan laporan akhir PKL',
    body: 'Laporan akhir PKL diunggah paling lambat tanggal 15 Desember 2026. Jurnal harian yang belum divalidasi akan memengaruhi komponen nilai laporan. Mohon segera lengkapi jurnal yang masih kosong.',
    audience: 'participant',
    createdBy: 'u_admin',
    createdAt: stamp(subDays(now, 1), '09:15'),
  },
  {
    id: 'an_004',
    title: 'Rapat evaluasi pembimbing industri',
    body: 'Rapat evaluasi tengah periode akan dilaksanakan hari Senin pukul 13.00 di Ruang Rapat Digital. Agenda: progres peserta, kendala jurnal, dan persiapan penilaian akhir.',
    audience: 'supervisor',
    createdBy: 'u_admin',
    createdAt: stamp(subDays(now, 2), '11:00'),
  },
]

const notifications: AppNotification[] = [
  {
    id: 'nt_001',
    userId: 'u_nabila',
    title: 'Jurnal perlu revisi',
    body: 'Rina Kartika meminta revisi jurnal tanggal ' + dateKey(subDays(now, 2)) + '. Buka menu Jurnal untuk melihat catatan.',
    read: false,
    createdAt: stamp(subDays(now, 1), '09:30'),
    href: '/journals',
  },
  {
    id: 'nt_002',
    userId: 'u_nabila',
    title: 'Pengajuan izin disetujui',
    body: 'Izin sakit kamu telah disetujui oleh pembimbing industri.',
    read: true,
    createdAt: stamp(subDays(now, 12), '07:45'),
    href: '/leaves',
  },
  {
    id: 'nt_003',
    userId: 'u_nabila',
    title: 'Nilai akhir sudah tersedia',
    body: 'Pembimbing industri telah memfinalisasi penilaian PKL kamu. Lihat rincian di menu Nilai Saya.',
    read: false,
    createdAt: stamp(subDays(now, 2), '15:25'),
    href: '/assessments',
  },
  {
    id: 'nt_004',
    userId: 'u_rina',
    title: '3 pengajuan izin menunggu',
    body: 'Ada pengajuan izin dari peserta bimbingan yang perlu ditinjau.',
    read: false,
    createdAt: stamp(now, '07:50'),
    href: '/leaves',
  },
  {
    id: 'nt_005',
    userId: 'u_rina',
    title: 'Jurnal baru menunggu validasi',
    body: 'Nabila Putri mengirim jurnal untuk tanggal ' + dateKey(subDays(now, 4)) + '.',
    read: false,
    createdAt: stamp(subDays(now, 1), '17:10'),
    href: '/journals',
  },
  {
    id: 'nt_006',
    userId: 'u_hendra',
    title: 'Pengajuan izin baru',
    body: 'Intan Permata mengajukan izin. Tinjau detail dan lampiran sebelum memberi keputusan.',
    read: false,
    createdAt: stamp(now, '07:45'),
    href: '/leaves',
  },
  {
    id: 'nt_007',
    userId: 'u_ahmad',
    title: 'Peringatan kehadiran rendah',
    body: 'Bagas Saputra memiliki tingkat kehadiran di bawah 80%. Pertimbangkan untuk menghubungi pembimbing industri.',
    read: false,
    createdAt: stamp(subDays(now, 1), '08:20'),
    href: '/reports',
  },
  {
    id: 'nt_008',
    userId: 'u_admin',
    title: 'Ringkasan harian LENTERA',
    body: 'Sistem berjalan normal. Pantau presensi dan pengajuan izin hari ini dari dashboard.',
    read: true,
    createdAt: stamp(now, '07:00'),
    href: '/',
  },
]

const logs: AppData['logs'] = [
  {
    id: 'log_001',
    userId: 'u_admin',
    action: 'Memperbarui pengaturan presensi',
    object: 'Pengaturan presensi',
    detail: 'Radius geofence diubah menjadi 150 m dan durasi token QR menjadi 45 detik.',
    at: stamp(subDays(now, 1), '16:05'),
  },
  {
    id: 'log_002',
    userId: 'u_rina',
    action: 'Menyetujui izin',
    object: 'Izin lv_001 · Nabila Putri',
    detail: 'Izin sakit 2 hari disetujui dan presensi terkait diperbarui otomatis.',
    at: stamp(subDays(now, 12), '07:40'),
  },
  {
    id: 'log_003',
    userId: 'u_rina',
    action: 'Memvalidasi jurnal',
    object: 'Jurnal Nabila Putri',
    detail: 'Jurnal disetujui tanpa revisi.',
    at: stamp(subDays(now, 1), '09:20'),
  },
  {
    id: 'log_004',
    userId: 'u_nabila',
    action: 'Mengirim jurnal',
    object: 'Jurnal harian',
    detail: 'Jurnal tanggal ' + dateKey(subDays(now, 4)) + ' dikirim untuk validasi.',
    at: stamp(subDays(now, 4), '16:30'),
  },
  {
    id: 'log_005',
    userId: 'u_hendra',
    action: 'Mengisi penilaian',
    object: 'Penilaian Dinda Ayu Lestari',
    detail: 'Penilaian tahap akhir disimpan dan difinalisasi.',
    at: stamp(subDays(now, 1), '10:15'),
  },
  {
    id: 'log_006',
    userId: 'u_admin',
    action: 'Menambahkan pengguna',
    object: 'Peserta · Bagas Saputra',
    detail: 'Akun peserta baru dibuat dan dihubungkan ke periode PKL aktif.',
    at: stamp(subDays(now, 7), '13:30'),
  },
  {
    id: 'log_007',
    userId: 'u_admin',
    action: 'Membuat pengumuman',
    object: 'Batas pengumpulan laporan akhir',
    detail: 'Pengumuman dikirim ke seluruh peserta PKL.',
    at: stamp(subDays(now, 1), '09:15'),
  },
]

const settings: AttendanceSettings = {
  checkInStart: '07:30',
  lateLimit: '08:00',
  checkOutTime: '16:00',
  latitude: -6.9436,
  longitude: 107.633,
  radius: 150,
  qrDuration: 45,
  workDays: [1, 2, 3, 4, 5],
}

export function createSeedData(): AppData {
  return {
    users,
    schools,
    divisions,
    periods,
    participants,
    attendances: attendance,
    activities,
    activityAttendances,
    leaves: leaveSeeds,
    journals,
    assessmentComponents,
    assessments,
    announcements,
    notifications,
    logs,
    settings,
  }
}
