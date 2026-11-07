import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BellRing,
  CalendarCheck,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FileText,
  TriangleAlert,
  Users,
} from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { AttendanceBadge } from '@/components/shared/status-badge'
import { AttendanceBarChart } from '@/components/charts/attendance-charts'
import { useAuth } from '@/providers/auth-provider'
import { useData } from '@/providers/data-provider'
import {
  lowAttendanceParticipants,
  participantsForSupervisor,
  todayAttendance,
  trendForParticipants,
} from '@/lib/analytics'
import { cn, formatDate, formatTime, timeAgo, todayLabel } from '@/lib/utils'

export function SupervisorDashboard() {
  const { user } = useAuth()
  const { data } = useData()
  if (!user) return null

  const participants = participantsForSupervisor(data, user.id)
  const participantIds = participants.map((item) => item.id)
  const todayRecords = participants.map((participant) => ({
    participant,
    attendance: todayAttendance(data, participant.id),
  }))
  const hadirHariIni = todayRecords.filter(
    (item) =>
      item.attendance?.status === 'present' || item.attendance?.status === 'late',
  ).length
  const pendingLeaves = data.leaves.filter(
    (item) => participantIds.includes(item.participantId) && item.status === 'pending',
  )
  const pendingJournals = data.journals.filter(
    (item) => participantIds.includes(item.participantId) && item.status === 'pending',
  )
  const trend = trendForParticipants(data, participantIds, 7)
  const lowAttendance = lowAttendanceParticipants(data, participants)
  const announcements = data.announcements
    .filter((item) => item.audience === 'all' || item.audience === 'supervisor')
    .slice(0, 2)
  const division = data.divisions.find((item) => item.id === user.divisionId)

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        eyebrow="Ruang pembimbing industri"
        title={`Halo, ${user.name.split(' ')[0]}!`}
        description={`${todayLabel()} · ${division?.name ?? 'Pembimbing industri'} · ${participants.length} peserta bimbingan`}
        actions={
          <>
            <Link to="/attendance" className={buttonVariants()}>
              <CalendarCheck className="h-4 w-4" />
              Rekap kehadiran
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard
          label="Peserta bimbingan"
          value={participants.length}
          hint="aktif pada periode ini"
          icon={Users}
          tone="primary"
        />
        <StatCard
          label="Hadir hari ini"
          value={`${hadirHariIni}/${participants.length}`}
          hint={`${participants.length - hadirHariIni} belum presensi`}
          icon={CheckCircle2}
          tone="emerald"
        />
        <StatCard
          label="Izin menunggu"
          value={pendingLeaves.length}
          hint={pendingLeaves.length ? 'menunggu Koordinator PKL' : 'semua sudah disahkan'}
          icon={FileText}
          tone="amber"
        />
        <StatCard
          label="Jurnal menunggu"
          value={pendingJournals.length}
          hint={pendingJournals.length ? 'menunggu pengesahan' : 'tidak ada antrean'}
          icon={ClipboardCheck}
          tone="sky"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-col items-start justify-between gap-2 sm:flex-row sm:gap-3">
            <div className="min-w-0">
              <CardTitle>Peserta hari ini</CardTitle>
              <CardDescription>Status presensi peserta bimbinganmu.</CardDescription>
            </div>
            <Link
              to="/participants"
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
            >
              Semua peserta
            </Link>
          </CardHeader>
          <CardContent className="space-y-1">
            {todayRecords.map(({ participant, attendance }) => {
              const student = data.users.find((item) => item.id === participant.userId)
              return (
                <Link
                  key={participant.id}
                  to={`/participants/${participant.id}`}
                  className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-muted/50"
                >
                  <Avatar name={student?.name ?? 'Peserta'} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold">{student?.name}</p>
                    <p className="truncate text-[10px] text-muted-foreground">
                      {participant.className} · {participant.major}
                    </p>
                  </div>
                  <div className="hidden text-right sm:block">
                    <p className="text-[10px] text-muted-foreground">Masuk</p>
                    <p className="text-xs font-bold">{attendance?.checkIn ?? '—'}</p>
                  </div>
                  {attendance ? (
                    <AttendanceBadge status={attendance.status} />
                  ) : (
                    <Badge variant="warning">Belum presensi</Badge>
                  )}
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                </Link>
              )
            })}
            {participants.length === 0 ? (
              <p className="py-8 text-center text-xs text-muted-foreground">
                Belum ada peserta bimbingan.
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BellRing className="h-4 w-4 text-accent-foreground" />
              Status pengesahan
            </CardTitle>
            <CardDescription>Antrean yang menunggu Koordinator PKL.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold">Pengajuan izin</p>
                <Badge variant="warning">{pendingLeaves.length}</Badge>
              </div>
              <div className="mt-2 space-y-1.5">
                {pendingLeaves.slice(0, 2).map((leave) => {
                  const participant = data.participants.find(
                    (item) => item.id === leave.participantId,
                  )
                  const student = data.users.find(
                    (item) => item.id === participant?.userId,
                  )
                  return (
                    <p key={leave.id} className="truncate text-[10px] text-muted-foreground">
                      {student?.name} · {formatDate(leave.startDate, 'd MMM')}
                    </p>
                  )
                })}
                {pendingLeaves.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground">Tidak ada antrean.</p>
                ) : null}
              </div>
              <Link
                to="/leaves"
                className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 hover:underline dark:text-amber-300"
              >
                Tinjau izin <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="rounded-xl border border-sky-500/20 bg-sky-500/[0.06] p-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold">Validasi jurnal</p>
                <Badge variant="info">{pendingJournals.length}</Badge>
              </div>
              <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
                {pendingJournals.length
                  ? 'Jurnal peserta sudah dikirim dan menunggu pengesahan Koordinator PKL.'
                  : 'Semua jurnal sudah disahkan. Kerja bagus!'}
              </p>
              <Link
                to="/journals"
                className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-sky-700 hover:underline dark:text-sky-300"
              >
                Buka jurnal <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="rounded-xl border border-border/70 bg-muted/30 p-3">
              <p className="text-xs font-bold">Pengumuman</p>
              {announcements.map((item) => (
                <p key={item.id} className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-muted-foreground">
                  {item.title} · {timeAgo(item.createdAt)}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-col items-start justify-between gap-2 sm:flex-row">
            <div>
              <CardTitle>Tren kehadiran</CardTitle>
              <CardDescription>7 hari kerja terakhir peserta bimbingan.</CardDescription>
            </div>
            <div className="hidden items-center gap-3 text-[9px] text-muted-foreground sm:flex">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" />Hadir</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" />Terlambat</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-sky-500" />Izin</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-500" />Alpa</span>
            </div>
          </CardHeader>
          <CardContent>
            <AttendanceBarChart data={trend} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TriangleAlert className="h-4 w-4 text-amber-500" />
              Perlu perhatian
            </CardTitle>
            <CardDescription>Kehadiran di bawah 80%.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {lowAttendance.length === 0 ? (
              <p className="rounded-xl bg-emerald-500/[0.06] p-3 text-[11px] leading-relaxed text-emerald-700 dark:text-emerald-300">
                Semua peserta memiliki kehadiran di atas 80%. Pertahankan!
              </p>
            ) : (
              lowAttendance.slice(0, 4).map(({ participant, summary }) => {
                const student = data.users.find((item) => item.id === participant.userId)
                return (
                  <Link
                    key={participant.id}
                    to={`/participants/${participant.id}`}
                    className="flex items-center gap-2.5 rounded-xl border border-border/60 p-2.5 transition-colors hover:bg-muted/40"
                  >
                    <Avatar name={student?.name ?? 'Peserta'} size="xs" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-bold">{student?.name}</p>
                      <p className="text-[9px] text-muted-foreground">
                        {summary.late} terlambat · {summary.absent} alpa
                      </p>
                    </div>
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[10px] font-extrabold',
                        summary.rate < 60
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
                      )}
                    >
                      {summary.rate}%
                    </span>
                  </Link>
                )
              })
            )}
            <Link
              to="/reports"
              className="inline-flex items-center gap-1 pt-1 text-[10px] font-bold text-primary hover:underline"
            >
              Lihat laporan lengkap <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="flex flex-col items-start justify-between gap-3 p-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Clock3 className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-bold">Batas presensi hari ini {data.settings.lateLimit} WIB</p>
              <p className="text-[10px] text-muted-foreground">
                Token QR berganti setiap {data.settings.qrDuration} detik · radius {data.settings.radius} m
              </p>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Pembaruan terakhir {formatTime(new Date())} WIB
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
