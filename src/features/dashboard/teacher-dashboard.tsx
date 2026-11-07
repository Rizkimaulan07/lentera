import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  GraduationCap,
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
  participantRecords,
  participantsForTeacher,
  todayAttendance,
  trendForParticipants,
} from '@/lib/analytics'
import { cn, summarizeAttendance, todayLabel } from '@/lib/utils'

export function TeacherDashboard() {
  const { user } = useAuth()
  const { data } = useData()
  if (!user) return null

  const participants = participantsForTeacher(data, user.id)
  const participantIds = participants.map((item) => item.id)
  const hadir = participants.filter((participant) => {
    const today = todayAttendance(data, participant.id)
    return today?.status === 'present' || today?.status === 'late'
  }).length
  const pendingLeaves = data.leaves.filter(
    (item) => participantIds.includes(item.participantId) && item.status === 'pending',
  )
  const pendingJournals = data.journals.filter(
    (item) => participantIds.includes(item.participantId) && item.status === 'pending',
  )
  const lowAttendance = lowAttendanceParticipants(data, participants)
  const trend = trendForParticipants(data, participantIds, 7)
  const school = data.schools.find((item) => item.id === user.schoolId)

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        eyebrow="Ruang guru pembimbing"
        title={`Halo, ${user.name.split(' ')[0]}!`}
        description={`${todayLabel()} · ${school?.name ?? 'Sekolah'} · ${participants.length} siswa bimbingan`}
        actions={
          <Link to="/reports" className={buttonVariants()}>
            <BarChart3 className="h-4 w-4" />
            Unduh rekap
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard
          label="Siswa bimbingan"
          value={participants.length}
          hint="terdaftar pada periode aktif"
          icon={Users}
          tone="primary"
        />
        <StatCard
          label="Hadir hari ini"
          value={`${hadir}/${participants.length}`}
          hint="berdasarkan presensi QR"
          icon={CheckCircle2}
          tone="emerald"
        />
        <StatCard
          label="Izin menunggu"
          value={pendingLeaves.length}
          hint="diproses Koordinator PKL"
          icon={FileText}
          tone="amber"
        />
        <StatCard
          label="Perlu perhatian"
          value={lowAttendance.length}
          hint="kehadiran di bawah 80%"
          icon={TriangleAlert}
          tone="rose"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-col items-start justify-between gap-2 sm:flex-row sm:gap-3">
            <div className="min-w-0">
              <CardTitle>Siswa bimbingan</CardTitle>
              <CardDescription>Kehadiran hari ini dan persentase periode.</CardDescription>
            </div>
            <Link
              to="/participants"
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
            >
              Lihat semua
            </Link>
          </CardHeader>
          <CardContent className="space-y-1">
            {participants.map((participant) => {
              const student = data.users.find((item) => item.id === participant.userId)
              const today = todayAttendance(data, participant.id)
              const summary = summarizeAttendance(participantRecords(data, participant.id))
              return (
                <Link
                  key={participant.id}
                  to={`/participants/${participant.id}`}
                  className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-muted/50"
                >
                  <Avatar name={student?.name ?? 'Siswa'} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold">{student?.name}</p>
                    <p className="truncate text-[10px] text-muted-foreground">
                      {participant.className} · {participant.major}
                    </p>
                  </div>
                  <div className="hidden text-right sm:block">
                    <p className="text-[10px] text-muted-foreground">Kehadiran</p>
                    <p
                      className={cn(
                        'text-xs font-extrabold',
                        summary.rate >= 80
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400',
                      )}
                    >
                      {summary.rate}%
                    </p>
                  </div>
                  {today ? (
                    <AttendanceBadge status={today.status} />
                  ) : (
                    <Badge variant="warning">Belum presensi</Badge>
                  )}
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                </Link>
              )
            })}
            {participants.length === 0 ? (
              <p className="py-8 text-center text-xs text-muted-foreground">
                Belum ada siswa bimbingan.
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-primary" />
              Ringkasan sekolah
            </CardTitle>
            <CardDescription>Pantauan cepat untuk laporan sekolah.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-xl bg-primary/[0.06] p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Rata-rata kehadiran
              </p>
              <p className="mt-1 text-2xl font-extrabold">
                {participants.length
                  ? Math.round(
                      participants.reduce(
                        (sum, participant) =>
                          sum +
                          summarizeAttendance(participantRecords(data, participant.id)).rate,
                        0,
                      ) / participants.length,
                    )
                  : 0}
                %
              </p>
              <p className="mt-1 text-[10px] text-muted-foreground">
                {participantIds.length} siswa · periode aktif
              </p>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border/70 p-3">
              <span className="flex items-center gap-2 text-[11px] font-semibold">
                <ClipboardCheck className="h-3.5 w-3.5 text-sky-500" />
                Jurnal menunggu pengesahan
              </span>
              <Badge variant="info">{pendingJournals.length}</Badge>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border/70 p-3">
              <span className="flex items-center gap-2 text-[11px] font-semibold">
                <FileText className="h-3.5 w-3.5 text-amber-500" />
                Izin dalam proses
              </span>
              <Badge variant="warning">{pendingLeaves.length}</Badge>
            </div>
            <Link
              to="/reports"
              className="flex items-center justify-between rounded-xl bg-muted/50 p-3 text-[11px] font-bold transition-colors hover:bg-muted"
            >
              Unduh rekap untuk sekolah
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Tren kehadiran</CardTitle>
            <CardDescription>7 hari kerja terakhir siswa bimbingan.</CardDescription>
          </CardHeader>
          <CardContent>
            <AttendanceBarChart data={trend} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TriangleAlert className="h-4 w-4 text-amber-500" />
              Peringatan kehadiran
            </CardTitle>
            <CardDescription>Siswa dengan kehadiran rendah.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {lowAttendance.length === 0 ? (
              <p className="rounded-xl bg-emerald-500/[0.06] p-3 text-[11px] leading-relaxed text-emerald-700 dark:text-emerald-300">
                Tidak ada siswa dengan kehadiran di bawah 80%.
              </p>
            ) : (
              lowAttendance.slice(0, 5).map(({ participant, summary }) => {
                const student = data.users.find((item) => item.id === participant.userId)
                return (
                  <Link
                    key={participant.id}
                    to={`/participants/${participant.id}`}
                    className="flex items-center gap-2.5 rounded-xl border border-border/60 p-2.5 transition-colors hover:bg-muted/40"
                  >
                    <Avatar name={student?.name ?? 'Siswa'} size="xs" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-bold">{student?.name}</p>
                      <p className="text-[9px] text-muted-foreground">
                        {summary.late} terlambat · {summary.absent} alpa
                      </p>
                    </div>
                    <Badge variant={summary.rate < 60 ? 'danger' : 'warning'}>
                      {summary.rate}%
                    </Badge>
                  </Link>
                )
              })
            )}
            <p className="pt-1 text-[10px] leading-relaxed text-muted-foreground">
              Hubungi pembimbing industri bila perlu tindak lanjut.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
