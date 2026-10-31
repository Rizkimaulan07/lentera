import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Dumbbell,
  QrCode,
  Sparkles,
  TrendingUp,
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
import { Progress } from '@/components/ui/progress'
import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { DataTable } from '@/components/shared/data-table'
import { useAuth } from '@/providers/auth-provider'
import { useData } from '@/providers/data-provider'
import {
  activityRecapAll,
  activityRecapForParticipant,
  participantsForSupervisor,
  participantsForTeacher,
} from '@/lib/analytics'
import { ACTIVITY_TYPE_LABELS, DAY_LABELS } from '@/lib/constants'
import {
  cn,
  formatDate,
  formatTime,
  getParticipantByUserId,
  todayKey,
} from '@/lib/utils'
import type { ActivityAttendance } from '@/types'

export function ActivitiesPage() {
  const { user } = useAuth()
  const { data } = useData()
  if (!user) return null

  const today = new Date()
  const day = today.getDay()
  const todayKeyValue = todayKey()
  const participant = getParticipantByUserId(data.participants, user.id)
  const isParticipant = user.role === 'participant'

  const scopeParticipants = isParticipant
    ? participant
      ? [participant]
      : []
    : user.role === 'supervisor'
      ? participantsForSupervisor(data, user.id)
      : user.role === 'teacher'
        ? participantsForTeacher(data, user.id)
        : data.participants
  const scopeIds = scopeParticipants.map((item) => item.id)

  const todaySessions = data.activities
    .filter((activity) => activity.active && activity.days.includes(day))
    .map((activity) => {
      const record = isParticipant
        ? data.activityAttendances.find(
            (item) =>
              item.activityId === activity.id &&
              item.participantId === participant?.id &&
              item.date === todayKeyValue,
          )
        : null
      const records = data.activityAttendances.filter(
        (item) =>
          item.activityId === activity.id &&
          item.date === todayKeyValue &&
          scopeIds.includes(item.participantId),
      )
      return {
        activity,
        record,
        presentCount: records.filter((item) => item.status === 'present').length,
      }
    })

  const participantRecaps = participant
    ? activityRecapForParticipant(data, participant.id)
    : []
  const recaps = isParticipant
    ? participantRecaps
    : activityRecapAll(data, scopeIds)
  const averageRate = recaps.length
    ? Math.round(recaps.reduce((sum, item) => sum + item.rate, 0) / recaps.length)
    : 0

  const history = data.activityAttendances
    .filter((item) => scopeIds.includes(item.participantId))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 30)

  const columns = [
    {
      key: 'date',
      header: 'Tanggal',
      mobileOrder: 2,
      cell: (record: ActivityAttendance) => (
        <div>
          <p className="text-xs font-bold">{formatDate(record.date, 'EEE, d MMM')}</p>
          <p className="text-[10px] text-muted-foreground">{record.date}</p>
        </div>
      ),
    },
    {
      key: 'activity',
      header: 'Kegiatan',
      mobileSpan: true,
      mobileOrder: 0,
      cell: (record: ActivityAttendance) => {
        const activity = data.activities.find((item) => item.id === record.activityId)
        return (
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {activity?.type === 'sports' ? <Dumbbell className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
            </span>
            <div>
              <p className="text-xs font-bold">{activity?.name}</p>
              <p className="text-[9px] text-muted-foreground">
                {activity ? ACTIVITY_TYPE_LABELS[activity.type] : '-'}
              </p>
            </div>
          </div>
        )
      },
    },
    ...(!isParticipant
      ? [
          {
            key: 'participant',
            header: 'Peserta',
            mobileSpan: true,
            mobileOrder: 1,
            cell: (record: ActivityAttendance) => {
              const item = data.participants.find(
                (candidate) => candidate.id === record.participantId,
              )
              const student = data.users.find((candidate) => candidate.id === item?.userId)
              return (
                <div className="flex items-center gap-2">
                  <Avatar name={student?.name ?? 'Peserta'} size="xs" />
                  <div>
                    <p className="text-xs font-bold">{student?.name}</p>
                    <p className="text-[9px] text-muted-foreground">{item?.className}</p>
                  </div>
                </div>
              )
            },
          },
        ]
      : []),
    {
      key: 'time',
      header: 'Waktu scan',
      mobileOrder: 3,
      cell: (record: ActivityAttendance) => (
        <span className="font-mono text-[11px]">
          {record.scannedAt ? formatTime(record.scannedAt) : '—'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      mobileSpan: true,
      mobileOrder: 4,
      cell: (record: ActivityAttendance) => (
        <Badge
          variant={
            record.status === 'present'
              ? 'success'
              : record.status === 'leave'
                ? 'info'
                : 'danger'
          }
        >
          {record.status === 'present'
            ? 'Hadir'
            : record.status === 'leave'
              ? 'Izin'
              : 'Tidak hadir'}
        </Badge>
      ),
    },
  ]

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        eyebrow="Kegiatan rutin"
        title="Olahraga & dhuha"
        description="Presensi kegiatan rutin memiliki sesi dan QR terpisah dari presensi harian."
        actions={
          user.role === 'supervisor' || user.role === 'admin' ? (
            <>
              <Link to="/qr" className={buttonVariants({ variant: 'outline' })}>
                <QrCode className="h-4 w-4" />
                QR kegiatan
              </Link>
              {user.role === 'admin' ? (
                <Link to="/admin/settings" className={buttonVariants()}>
                  <CalendarDays className="h-4 w-4" />
                  Kelola jadwal
                </Link>
              ) : null}
            </>
          ) : (
            <Link to="/scan" className={buttonVariants()}>
              <QrCode className="h-4 w-4" />
              Scan kegiatan
            </Link>
          )
        }
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard
          label="Kegiatan aktif"
          value={data.activities.filter((item) => item.active).length}
          hint="olahraga & dhuha"
          icon={Dumbbell}
          tone="primary"
        />
        <StatCard
          label="Sesi hari ini"
          value={todaySessions.length}
          hint={todaySessions.length ? 'jadwal berjalan hari ini' : 'tidak ada jadwal'}
          icon={CalendarDays}
          tone="sky"
        />
        <StatCard
          label="Rata-rata kehadiran"
          value={`${averageRate}%`}
          hint={isParticipant ? 'kegiatan rutinmu' : 'seluruh peserta bimbingan'}
          icon={TrendingUp}
          tone="emerald"
        />
        <StatCard
          label="Peserta tercatat"
          value={scopeParticipants.length}
          hint={isParticipant ? 'akun peserta aktif' : 'dalam cakupanmu'}
          icon={Users}
          tone="violet"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Jadwal hari ini</CardTitle>
            <CardDescription>
              {formatDate(today, 'EEEE, d MMMM yyyy')} · sesi kegiatan rutin.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {todaySessions.map(({ activity, record, presentCount }) => (
              <div
                key={activity.id}
                className="flex flex-col gap-3 rounded-xl border border-border/70 p-3 sm:flex-row sm:items-center"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  {activity.type === 'sports' ? <Dumbbell className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-bold">{activity.name}</p>
                    <Badge variant="secondary">{ACTIVITY_TYPE_LABELS[activity.type]}</Badge>
                    {activity.mandatory ? <Badge variant="outline">Wajib</Badge> : null}
                  </div>
                  <p className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Clock3 className="h-3 w-3" />
                    {activity.startTime} – {activity.endTime} WIB
                  </p>
                </div>
                {isParticipant ? (
                  record?.status === 'present' ? (
                    <Badge variant="success">
                      <CheckCircle2 className="h-3 w-3" />
                      Hadir pukul {record.scannedAt ? formatTime(record.scannedAt) : '-'}
                    </Badge>
                  ) : (
                    <Link to="/scan" className={buttonVariants({ size: 'sm' })}>
                      <QrCode className="h-3.5 w-3.5" />
                      Scan sekarang
                    </Link>
                  )
                ) : (
                  <Badge variant="secondary">{presentCount} peserta hadir</Badge>
                )}
              </div>
            ))}
            {todaySessions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-6 text-center">
                <CalendarDays className="mx-auto h-5 w-5 text-muted-foreground" />
                <p className="mt-2 text-xs font-semibold">Tidak ada kegiatan hari ini</p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Lihat jadwal mingguan di bawah.
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Jadwal mingguan</CardTitle>
            <CardDescription>Hari dan jam pelaksanaan.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.activities.map((activity) => (
              <div key={activity.id} className="rounded-xl border border-border/70 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold">{activity.name}</p>
                  <Badge variant={activity.active ? 'success' : 'secondary'}>
                    {activity.active ? 'Aktif' : 'Nonaktif'}
                  </Badge>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {activity.days.map((dayIndex) => (
                    <span
                      key={dayIndex}
                      className={cn(
                        'rounded-md px-1.5 py-0.5 text-[9px] font-bold',
                        dayIndex === day
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {DAY_LABELS[dayIndex].slice(0, 3)}
                    </span>
                  ))}
                </div>
                <p className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Clock3 className="h-3 w-3" />
                  {activity.startTime} – {activity.endTime} WIB
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rekap kehadiran kegiatan</CardTitle>
          <CardDescription>
            {isParticipant
              ? 'Persentase kehadiranmu pada setiap kegiatan.'
              : 'Persentase kehadiran peserta dalam cakupanmu.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {recaps.map((recap) => (
            <div key={recap.id} className="rounded-xl border border-border/70 p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    {recap.type === 'sports' ? <Dumbbell className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                  </span>
                  <div>
                    <p className="text-xs font-bold">{recap.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {recap.present} dari {recap.total} sesi
                    </p>
                  </div>
                </div>
                <span className="text-sm font-extrabold">{recap.rate}%</span>
              </div>
              <Progress
                value={recap.rate}
                className="mt-3"
                indicatorClassName={cn(
                  recap.rate >= 80
                    ? 'bg-emerald-500'
                    : recap.rate >= 60
                      ? 'bg-amber-500'
                      : 'bg-rose-500',
                )}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <CardTitle>Riwayat kegiatan</CardTitle>
            <CardDescription>30 catatan kehadiran kegiatan terbaru.</CardDescription>
          </div>
          {!isParticipant ? (
            <Link
              to="/reports"
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
            >
              Ekspor rekap
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : null}
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            rows={history}
            keyFor={(record) => record.id}
            emptyTitle="Belum ada riwayat kegiatan"
            emptyDescription="Kehadiran kegiatan akan muncul setelah peserta melakukan scan."
          />
        </CardContent>
      </Card>
    </div>
  )
}
