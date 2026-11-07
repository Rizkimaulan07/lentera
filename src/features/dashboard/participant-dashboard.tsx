import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Award,
  CalendarCheck,
  ClipboardCheck,
  Clock3,
  FileText,
  MapPin,
  Megaphone,
  QrCode,
  Sparkles,
  Timer,
  TrendingUp,
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
import { Progress } from '@/components/ui/progress'
import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { ActivityIcon } from '@/components/shared/activity-icon'
import { JournalBadge } from '@/components/shared/status-badge'
import { StatusDonut } from '@/components/charts/attendance-charts'
import { useAuth } from '@/providers/auth-provider'
import { useData } from '@/providers/data-provider'
import {
  activityRecapForParticipant,
  participantRecords,
  statusDistribution,
  todayAttendance,
} from '@/lib/analytics'
import {
  cn,
  formatDate,
  getParticipantByUserId,
  summarizeAttendance,
  timeAgo,
  todayKey,
} from '@/lib/utils'

function greeting() {
  const hour = new Date().getHours()
  if (hour < 11) return 'Selamat pagi'
  if (hour < 15) return 'Selamat siang'
  if (hour < 18) return 'Selamat sore'
  return 'Selamat malam'
}

export function ParticipantDashboard() {
  const { user } = useAuth()
  const { data } = useData()
  if (!user) return null

  const participant = getParticipantByUserId(data.participants, user.id)
  if (!participant) {
    return (
      <Card className="p-8 text-center text-sm text-muted-foreground">
        Data peserta tidak ditemukan. Hubungi admin PKL.
      </Card>
    )
  }

  const records = participantRecords(data, participant.id)
  const summary = summarizeAttendance(records)
  const today = todayAttendance(data, participant.id)
  const journals = data.journals
    .filter((item) => item.participantId === participant.id)
    .sort((a, b) => b.date.localeCompare(a.date))
  const todayJournal = journals.find((item) => item.date === todayKey())
  const pendingLeaves = data.leaves.filter(
    (item) => item.participantId === participant.id && item.status === 'pending',
  )
  const activities = activityRecapForParticipant(data, participant.id)
  const distribution = statusDistribution(records)
  const announcements = data.announcements
    .filter((item) => item.audience === 'all' || item.audience === 'participant')
    .slice(0, 3)
  const division = data.divisions.find((item) => item.id === participant.divisionId)
  const supervisor = data.users.find((item) => item.id === participant.supervisorId)

  const todayState = (() => {
    if (!today) {
      return {
        tone: 'belum',
        title: 'Belum presensi hari ini',
        description: 'Tunjukkan QR pribadimu ke Koordinator PKL untuk mencatat kehadiran masuk.',
        cta: 'Tampilkan QR saya',
      }
    }
    if (today.status === 'leave' || today.status === 'sick') {
      return {
        tone: 'izin',
        title: today.status === 'sick' ? 'Sakit — presensi tercatat' : 'Izin — presensi tercatat',
        description: today.note ?? 'Presensi hari ini sudah diperbarui sesuai izin yang disetujui.',
        cta: 'Lihat detail izin',
      }
    }
    if (today.checkIn && !today.checkOut) {
      return {
        tone: 'masuk',
        title: `Sudah presensi masuk pukul ${today.checkIn}`,
        description: 'Tunjukkan QR kembali ke Koordinator PKL saat pulang nanti.',
        cta: 'Tampilkan QR pulang',
      }
    }
    return {
      tone: 'lengkap',
      title: 'Presensi hari ini lengkap',
      description: `Masuk ${today.checkIn ?? '-'} · Pulang ${today.checkOut ?? '-'}. Terima kasih atas kedisiplinanmu!`,
      cta: 'Lihat riwayat',
    }
  })()

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        eyebrow="Ruang peserta"
        title={`${greeting()}, ${user.name.split(' ')[0]}!`}
        description={`${formatDate(new Date(), 'EEEE, d MMMM yyyy')} · ${division?.name ?? 'PKL'} · PT Len Industri`}
        actions={
          <Link to="/attendance" className={buttonVariants({ variant: 'outline' })}>
            <CalendarCheck className="h-4 w-4" />
            Lihat rekap
          </Link>
        }
      />

      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-[#4a040b] via-[#8b0e1a] to-[#c8102e] text-white shadow-xl shadow-primary/10">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-rose-300/25 blur-3xl" />
          <div className="absolute -bottom-24 right-24 h-52 w-52 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute right-10 top-8 h-px w-56 rotate-[18deg] bg-gradient-to-r from-white/60 to-transparent" />
          <div className="absolute right-0 top-8 h-32 w-72 rotate-[18deg] bg-gradient-to-r from-white/15 to-transparent blur-xl" />
        </div>
        <div className="relative grid gap-6 p-6 sm:p-7 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-white/15 bg-white/10 text-white">
                <Sparkles className="h-3 w-3 text-rose-200" />
                Periode PKL aktif
              </Badge>
              <span className="text-[11px] text-rose-100/75">Pembimbing: {supervisor?.name}</span>
            </div>
            <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.18em] text-rose-200">
              Status presensi hari ini
            </p>
            <h2 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-[28px]">
              {todayState.title}
            </h2>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-rose-100/75">
              {todayState.description}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Link
                to={todayState.cta === 'Lihat detail izin' ? '/leaves' : todayState.cta === 'Lihat riwayat' ? '/attendance' : '/my-qr'}
                className={buttonVariants({
                  variant: 'accent',
                  className: 'shadow-lg shadow-black/20',
                })}
              >
                {todayState.cta === 'Tampilkan QR saya' || todayState.cta === 'Tampilkan QR pulang' ? (
                  <QrCode className="h-4 w-4" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
                {todayState.cta}
              </Link>
              <Link
                to="/journals"
                className={buttonVariants({
                  variant: 'ghost',
                  className: 'text-white hover:bg-white/10',
                })}
              >
                <ClipboardCheck className="h-4 w-4" />
                Isi jurnal
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-3.5 backdrop-blur-sm">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-300">
                Masuk
              </p>
              <p className="mt-1 text-xl font-extrabold">{today?.checkIn ?? '—'}</p>
              <p className="mt-1 flex items-center gap-1 text-[10px] text-slate-400">
                <Clock3 className="h-3 w-3" /> batas {data.settings.lateLimit}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-3.5 backdrop-blur-sm">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-300">
                Pulang
              </p>
              <p className="mt-1 text-xl font-extrabold">{today?.checkOut ?? '—'}</p>
              <p className="mt-1 flex items-center gap-1 text-[10px] text-slate-400">
                <Timer className="h-3 w-3" /> {data.settings.checkOutTime}
              </p>
            </div>
            <div className="col-span-2 flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.07] p-3.5 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-300">
                  <MapPin className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[10px] font-semibold text-slate-300">Area presensi</p>
                  <p className="text-xs font-bold">PT Len Industri · Bandung</p>
                </div>
              </div>
              <Badge className="border-white/15 bg-white/10 text-white">
                Radius {data.settings.radius} m
              </Badge>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard
          label="Tingkat kehadiran"
          value={`${summary.rate}%`}
          hint={`${summary.present + summary.late} dari ${summary.total} hari tercatat`}
          icon={TrendingUp}
          tone="emerald"
          trend={{ value: `${summary.present} hadir`, direction: 'up' }}
        />
        <StatCard
          label="Terlambat"
          value={summary.late}
          hint="akumulasi periode PKL"
          icon={Clock3}
          tone="amber"
        />
        <StatCard
          label="Jurnal hari ini"
          value={todayJournal ? 'Terisi' : 'Belum'}
          hint={todayJournal ? `Status: ${todayJournal.status === 'approved' ? 'disahkan' : todayJournal.status === 'revision' ? 'perlu revisi' : 'menunggu pengesahan'}` : 'Isi sebelum pulang'}
          icon={ClipboardCheck}
          tone={todayJournal ? 'sky' : 'rose'}
        />
        <StatCard
          label="Izin menunggu"
          value={pendingLeaves.length}
          hint={pendingLeaves.length ? 'menunggu Koordinator PKL' : 'tidak ada pengajuan aktif'}
          icon={FileText}
          tone="violet"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-col items-start justify-between gap-2 sm:flex-row">
            <div>
              <CardTitle>Ringkasan kehadiran</CardTitle>
              <CardDescription>Akumulasi presensi pada periode PKL ini.</CardDescription>
            </div>
            <Badge variant="secondary">{summary.total} hari</Badge>
          </CardHeader>
          <CardContent>
            <StatusDonut counts={distribution} />
            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border/70 pt-4 text-center">
              <div>
                <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                  {summary.present}
                </p>
                <p className="text-[10px] text-muted-foreground">Tepat waktu</p>
              </div>
              <div>
                <p className="text-lg font-extrabold text-amber-600 dark:text-amber-400">
                  {summary.late}
                </p>
                <p className="text-[10px] text-muted-foreground">Terlambat</p>
              </div>
              <div>
                <p className="text-lg font-extrabold text-sky-600 dark:text-sky-400">
                  {summary.leave + summary.sick}
                </p>
                <p className="text-[10px] text-muted-foreground">Izin / sakit</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kegiatan rutin</CardTitle>
            <CardDescription>Olahraga, dhuha, dan ambil makan pada periode ini.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {activities.map((activity) => (
              <div key={activity.id}>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <ActivityIcon type={activity.type} className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-xs font-bold">{activity.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {activity.present} dari {activity.total} sesi
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold">{activity.rate}%</span>
                </div>
                <Progress
                  value={activity.rate}
                  indicatorClassName={cn(
                    activity.rate >= 80
                      ? 'bg-emerald-500'
                      : activity.rate >= 60
                        ? 'bg-amber-500'
                        : 'bg-rose-500',
                  )}
                />
              </div>
            ))}
            <Link
              to="/activities"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
            >
              Lihat semua kegiatan
              <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-col items-start justify-between gap-2 sm:flex-row">
            <div>
              <CardTitle>Jurnal terbaru</CardTitle>
              <CardDescription>Aktivitas harian dan status pengesahannya.</CardDescription>
            </div>
            <Link
              to="/journals"
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
            >
              Semua jurnal
            </Link>
          </CardHeader>
          <CardContent className="space-y-1">
            {journals.slice(0, 4).map((journal) => (
              <div
                key={journal.id}
                className="flex items-start gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-muted/40"
              >
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <ClipboardCheck className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-xs font-bold">{journal.activity}</p>
                    <JournalBadge status={journal.status} />
                  </div>
                  <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">
                    {formatDate(journal.date, 'EEEE, d MMM')} · {journal.description}
                  </p>
                </div>
              </div>
            ))}
            {journals.length === 0 ? (
              <p className="py-8 text-center text-xs text-muted-foreground">
                Belum ada jurnal. Mulai isi jurnal hari ini.
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pengumuman</CardTitle>
            <CardDescription>Informasi terbaru untuk peserta.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {announcements.map((announcement) => (
              <Link
                key={announcement.id}
                to="/announcements"
                className="block rounded-xl border border-border/70 p-3 transition-colors hover:bg-muted/40"
              >
                <div className="flex items-start gap-2">
                  <Megaphone className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-foreground" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold leading-snug">{announcement.title}</p>
                    <p className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-muted-foreground">
                      {announcement.body}
                    </p>
                    <p className="mt-1 text-[9px] text-muted-foreground/70">
                      {timeAgo(announcement.createdAt)}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
            <Link
              to="/announcements"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
            >
              Semua pengumuman
              <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <CardTitle>Akses cepat</CardTitle>
            <CardDescription>Menu yang paling sering kamu gunakan.</CardDescription>
          </div>
          <Avatar name={user.name} size="sm" />
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {[
            { to: '/my-qr', icon: QrCode, label: 'QR Saya', desc: 'Tunjukkan ke Koordinator PKL' },
            { to: '/activities', icon: CalendarCheck, label: 'Kegiatan', desc: 'Jadwal olahraga, dhuha & makan' },
            { to: '/journals', icon: ClipboardCheck, label: 'Jurnal', desc: 'Isi kegiatan harian' },
            { to: '/leaves', icon: FileText, label: 'Izin', desc: 'Ajukan izin & sakit' },
            { to: '/assessments', icon: Award, label: 'Nilai saya', desc: 'Lihat hasil penilaian' },
          ].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="group rounded-xl border border-border/70 p-3.5 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-sm"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <item.icon className="h-4 w-4" />
              </span>
              <p className="mt-2.5 text-xs font-bold">{item.label}</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">{item.desc}</p>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
