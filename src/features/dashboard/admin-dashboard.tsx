import { Link } from 'react-router-dom'
import {
  Activity,
  ArrowRight,
  Award,
  Building2,
  CalendarCheck,
  ClipboardCheck,
  Clock3,
  FileText,
  Megaphone,
  Settings,
  ShieldCheck,
  TrendingUp,
  UserPlus,
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
import {
  AttendanceRateChart,
  DivisionBarChart,
} from '@/components/charts/attendance-charts'
import { useAuth } from '@/providers/auth-provider'
import { useData } from '@/providers/data-provider'
import {
  divisionDistribution,
  lateRanking,
  trendForParticipants,
} from '@/lib/analytics'
import { cn, formatDate, timeAgo, todayKey, todayLabel } from '@/lib/utils'

export function AdminDashboard() {
  const { user } = useAuth()
  const { data } = useData()
  if (!user) return null

  const participantIds = data.participants.map((item) => item.id)
  const today = todayKey()
  const todayRecords = data.attendances.filter((item) => item.date === today)
  const hadirHariIni = todayRecords.filter(
    (item) => item.status === 'present' || item.status === 'late',
  ).length
  const pendingLeaves = data.leaves.filter((item) => item.status === 'pending')
  const pendingJournals = data.journals.filter((item) => item.status === 'pending')
  const trend = trendForParticipants(data, participantIds, 7)
  const divisions = divisionDistribution(data)
  const late = lateRanking(data, data.participants)
  const recentLogs = data.logs.slice(0, 6)
  const activePeriod = data.periods.find((period) => period.active)
  const lowRate = data.participants
    .map((participant) => {
      const records = data.attendances.filter(
        (item) => item.participantId === participant.id,
      )
      const hadir = records.filter(
        (item) => item.status === 'present' || item.status === 'late',
      ).length
      return {
        participant,
        rate: records.length ? Math.round((hadir / records.length) * 100) : 0,
      }
    })
    .filter((item) => item.rate < 80).length

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        eyebrow="Ruang administrator"
        title="Dashboard PKL"
        description={`${todayLabel()} · ${activePeriod?.name ?? 'Belum ada periode aktif'} · ${data.participants.length} peserta terdaftar`}
        actions={
          <>
            <Link to="/admin/settings" className={buttonVariants({ variant: 'outline' })}>
              <Settings className="h-4 w-4" />
              Pengaturan
            </Link>
            <Link to="/admin/users" className={buttonVariants()}>
              <UserPlus className="h-4 w-4" />
              Kelola pengguna
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard
          label="Total peserta"
          value={data.participants.length}
          hint={`${data.schools.length} sekolah · ${data.divisions.length} divisi`}
          icon={Users}
          tone="primary"
          trend={{ value: `${lowRate} perlu perhatian`, direction: 'down', positive: lowRate === 0 }}
        />
        <StatCard
          label="Hadir hari ini"
          value={hadirHariIni}
          hint={`dari ${data.participants.length} peserta`}
          icon={CalendarCheck}
          tone="emerald"
          trend={{
            value: `${data.participants.length ? Math.round((hadirHariIni / data.participants.length) * 100) : 0}%`,
            direction: 'up',
          }}
        />
        <StatCard
          label="Izin menunggu"
          value={pendingLeaves.length}
          hint="pembimbing perlu meninjau"
          icon={FileText}
          tone="amber"
        />
        <StatCard
          label="Jurnal menunggu"
          value={pendingJournals.length}
          hint="validasi pembimbing"
          icon={ClipboardCheck}
          tone="sky"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-col items-start justify-between gap-2 sm:flex-row">
            <div>
              <CardTitle>Tingkat kehadiran</CardTitle>
              <CardDescription>
                Persentase peserta yang sudah presensi, 7 hari kerja terakhir.
              </CardDescription>
            </div>
            <Badge variant="success">
              <TrendingUp className="h-3 w-3" />
              {trend.length ? `${trend[trend.length - 1].rate}% hari ini` : '—'}
            </Badge>
          </CardHeader>
          <CardContent>
            <AttendanceRateChart data={trend} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribusi divisi</CardTitle>
            <CardDescription>Sebaran peserta per divisi.</CardDescription>
          </CardHeader>
          <CardContent>
            <DivisionBarChart data={divisions} />
            <div className="mt-2 flex items-center justify-between rounded-xl bg-muted/50 px-3 py-2 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Building2 className="h-3 w-3" /> {divisions.length} divisi aktif
              </span>
              <Link to="/admin/master" className="font-bold text-primary hover:underline">
                Kelola
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-amber-500" />
              Paling sering terlambat
            </CardTitle>
            <CardDescription>Top 5 peserta berdasarkan keterlambatan.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {late.map((item, index) => {
              const student = data.users.find(
                (candidate) => candidate.id === item.participant.userId,
              )
              return (
                <Link
                  key={item.participant.id}
                  to={`/participants/${item.participant.id}`}
                  className="flex items-center gap-2.5 rounded-xl border border-border/60 p-2.5 transition-colors hover:bg-muted/40"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-muted text-[10px] font-extrabold">
                    {index + 1}
                  </span>
                  <Avatar name={student?.name ?? 'Peserta'} size="xs" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-bold">{student?.name}</p>
                    <p className="text-[9px] text-muted-foreground">
                      Kehadiran {item.rate}%
                    </p>
                  </div>
                  <Badge variant="warning">{item.late}x</Badge>
                </Link>
              )
            })}
            {late.length === 0 ? (
              <p className="py-6 text-center text-[11px] text-muted-foreground">
                Belum ada keterlambatan tercatat.
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Aktivitas terbaru
            </CardTitle>
            <CardDescription>Jejak perubahan data penting.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentLogs.map((log) => {
              const actor = data.users.find((item) => item.id === log.userId)
              return (
                <div key={log.id} className="flex gap-2.5">
                  <Avatar name={actor?.name ?? 'Sistem'} size="xs" className="mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] leading-relaxed">
                      <span className="font-bold">{actor?.name ?? 'Sistem'}</span>{' '}
                      {log.action.toLowerCase()} · <span className="text-muted-foreground">{log.object}</span>
                    </p>
                    <p className="text-[9px] text-muted-foreground/70">{timeAgo(log.at)}</p>
                  </div>
                </div>
              )
            })}
            <Link
              to="/admin/logs"
              className="inline-flex items-center gap-1 pt-1 text-[10px] font-bold text-primary hover:underline"
            >
              Lihat semua log <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              Aksi cepat
            </CardTitle>
            <CardDescription>Pengelolaan harian administrator.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            {[
              { to: '/admin/users', icon: Users, label: 'Kelola akun pengguna' },
              { to: '/admin/master', icon: Building2, label: 'Master data PKL' },
              { to: '/admin/settings', icon: Settings, label: 'Presensi & penilaian' },
              { to: '/announcements', icon: Megaphone, label: 'Buat pengumuman' },
              { to: '/reports', icon: Award, label: 'Laporan & ekspor' },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="flex items-center gap-2.5 rounded-xl border border-border/60 p-2.5 text-[11px] font-semibold transition-colors hover:bg-muted/40"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <item.icon className="h-3.5 w-3.5" />
                </span>
                {item.label}
                <ArrowRight className="ml-auto h-3 w-3 text-muted-foreground" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Sekolah mitra', value: data.schools.length, icon: Building2 },
            { label: 'Pembimbing industri', value: data.users.filter((item) => item.role === 'supervisor').length, icon: ShieldCheck },
            { label: 'Guru pembimbing', value: data.users.filter((item) => item.role === 'teacher').length, icon: Users },
            { label: 'Pengumuman aktif', value: data.announcements.length, icon: Megaphone },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <item.icon className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[10px] text-muted-foreground">{item.label}</p>
                <p className="text-sm font-extrabold">{item.value}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <p className="text-center text-[10px] text-muted-foreground">
        Data per {formatDate(new Date(), 'd MMMM yyyy, HH:mm')} WIB ·{' '}
        <span className={cn('font-semibold', lowRate > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600')}>
          {lowRate} peserta perlu perhatian
        </span>
      </p>
    </div>
  )
}
