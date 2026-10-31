import * as React from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Award,
  BookOpenCheck,
  Building2,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FileText,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  Printer,
  School,
  UserRound,
  Users,
} from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { EmptyState } from '@/components/shared/empty-state'
import { DataTable } from '@/components/shared/data-table'
import {
  AttendanceBadge,
  JournalBadge,
  LeaveBadge,
} from '@/components/shared/status-badge'
import { useAuth } from '@/providers/auth-provider'
import { useData } from '@/providers/data-provider'
import {
  participantRecords,
  todayAttendance,
} from '@/lib/analytics'
import { LEAVE_TYPE_LABELS } from '@/lib/constants'
import {
  cn,
  formatDate,
  formatDuration,
  gradeFromScore,
  summarizeAttendance,
  weightedScore,
} from '@/lib/utils'
import type {
  AppData,
  Assessment,
  AssessmentComponent,
  Attendance,
} from '@/types'

function attendanceScore(data: AppData, participantId: string) {
  const summary = summarizeAttendance(participantRecords(data, participantId))
  return Math.max(0, Math.min(100, Math.round(summary.rate - summary.late * 1.5)))
}

function resolvedScores(
  data: AppData,
  participantId: string,
  assessment: Assessment | undefined,
  components: AssessmentComponent[],
) {
  const auto = attendanceScore(data, participantId)
  return Object.fromEntries(
    components.map((component) => [
      component.id,
      component.auto === 'attendance'
        ? auto
        : assessment?.scores[component.id] ?? 0,
    ]),
  ) as Record<string, number>
}

export function ParticipantDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const { data } = useData()
  const [tab, setTab] = React.useState('attendance')

  if (!user) return null

  const participant = data.participants.find((item) => item.id === id)
  const allowed =
    participant &&
    (user.role === 'admin' ||
      (user.role === 'supervisor' && participant.supervisorId === user.id) ||
      (user.role === 'teacher' && participant.teacherId === user.id) ||
      (user.role === 'participant' && participant.userId === user.id))

  if (!participant || !allowed) {
    return (
      <div className="space-y-5">
        <PageHeader
          eyebrow="Peserta PKL"
          title="Peserta tidak ditemukan"
          description="Data peserta tidak tersedia atau bukan bagian dari bimbinganmu."
        />
        <EmptyState
          icon={Users}
          title="Tidak ada akses ke profil ini"
          description="Kembali ke daftar peserta untuk memilih peserta yang terhubung dengan akunmu."
          action={
            <Link
              to="/participants"
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Kembali ke daftar peserta
            </Link>
          }
        />
      </div>
    )
  }

  const student = data.users.find((item) => item.id === participant.userId)
  const school = data.schools.find((item) => item.id === participant.schoolId)
  const division = data.divisions.find((item) => item.id === participant.divisionId)
  const period = data.periods.find((item) => item.id === participant.periodId)
  const supervisor = data.users.find((item) => item.id === participant.supervisorId)
  const teacher = data.users.find((item) => item.id === participant.teacherId)
  const records = participantRecords(data, participant.id)
  const summary = summarizeAttendance(records)
  const today = todayAttendance(data, participant.id)
  const journals = data.journals
    .filter((item) => item.participantId === participant.id)
    .sort((a, b) => b.date.localeCompare(a.date))
  const approvedJournals = journals.filter((item) => item.status === 'approved').length
  const leaves = data.leaves
    .filter((item) => item.participantId === participant.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const pendingLeaves = leaves.filter((item) => item.status === 'pending').length
  const assessments = data.assessments.filter(
    (item) => item.participantId === participant.id,
  )
  const assessment =
    assessments.find((item) => item.stage === 'final') ??
    assessments.find((item) => item.stage === 'mid')
  const components = data.assessmentComponents
  const scores = resolvedScores(data, participant.id, assessment, components)
  const finalScore = weightedScore(scores, components)
  const grade = gradeFromScore(finalScore)

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="no-print flex flex-wrap items-center justify-between gap-2">
        <Link
          to="/participants"
          className={buttonVariants({ variant: 'ghost', size: 'sm', className: '-ml-2' })}
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke peserta
        </Link>
        <div className="flex gap-2">
          <Link
            to="/journals"
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
          >
            <BookOpenCheck className="h-3.5 w-3.5" />
            Jurnal
          </Link>
          <Link
            to="/assessments"
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
          >
            <Award className="h-3.5 w-3.5" />
            Penilaian
          </Link>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="h-3.5 w-3.5" />
            Cetak
          </Button>
        </div>
      </div>

      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-[#4a040b] via-[#8b0e1a] to-[#c8102e] text-white">
        <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full bg-rose-300/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        <CardContent className="relative p-5 sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <Avatar
              name={student?.name ?? 'Peserta'}
              size="xl"
              className="ring-4 ring-white/20"
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="border-white/15 bg-white/10 text-white">
                  {participant.className}
                </Badge>
                <Badge className="border-white/15 bg-white/10 text-white">
                  {division?.name}
                </Badge>
                {today ? (
                  <AttendanceBadge status={today.status} />
                ) : (
                  <Badge className="border-white/20 bg-white/10 text-white">
                    Belum presensi hari ini
                  </Badge>
                )}
              </div>
              <h1 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">
                {student?.name}
              </h1>
              <p className="mt-1 text-sm text-slate-300">
                {participant.nis} · {participant.major}
              </p>
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-slate-300">
                <span className="flex items-center gap-1.5">
                  <School className="h-3.5 w-3.5 text-rose-200" />
                  {school?.name}
                </span>
                <span className="flex items-center gap-1.5">
                  <UserRound className="h-3.5 w-3.5 text-rose-200" />
                  {supervisor?.name}
                </span>
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5 text-rose-200" />
                  {period?.name}
                </span>
              </div>
            </div>
            <div className="grid shrink-0 grid-cols-3 gap-2 text-center sm:grid-cols-1 sm:text-right">
              <div className="rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2">
                <p className="text-lg font-extrabold">{summary.rate}%</p>
                <p className="text-[9px] uppercase tracking-wider text-slate-300">Hadir</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2">
                <p className="text-lg font-extrabold">{approvedJournals}</p>
                <p className="text-[9px] uppercase tracking-wider text-slate-300">Jurnal</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2">
                <p className="text-lg font-extrabold">{finalScore}</p>
                <p className="text-[9px] uppercase tracking-wider text-slate-300">Nilai</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard
          label="Kehadiran"
          value={`${summary.rate}%`}
          hint={`${summary.present + summary.late} dari ${summary.total} hari`}
          icon={CheckCircle2}
          tone="emerald"
        />
        <StatCard
          label="Terlambat"
          value={summary.late}
          hint="keterlambatan tercatat"
          icon={Clock3}
          tone="amber"
        />
        <StatCard
          label="Jurnal disetujui"
          value={approvedJournals}
          hint={`${journals.length} jurnal dikirim`}
          icon={ClipboardCheck}
          tone="primary"
        />
        <StatCard
          label="Izin menunggu"
          value={pendingLeaves}
          hint={`${leaves.length} pengajuan total`}
          icon={FileText}
          tone="sky"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.55fr_0.45fr]">
        <div className="min-w-0 space-y-4">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="no-print h-auto w-full justify-start overflow-x-auto">
              <TabsTrigger value="attendance">
                <CalendarCheck className="h-3.5 w-3.5" />
                Kehadiran
              </TabsTrigger>
              <TabsTrigger value="journals">
                <BookOpenCheck className="h-3.5 w-3.5" />
                Jurnal
              </TabsTrigger>
              <TabsTrigger value="leaves">
                <FileText className="h-3.5 w-3.5" />
                Izin
              </TabsTrigger>
              <TabsTrigger value="assessment">
                <Award className="h-3.5 w-3.5" />
                Penilaian
              </TabsTrigger>
            </TabsList>

            <TabsContent value="attendance">
              <Card>
                <CardHeader className="flex-col items-start justify-between gap-2 sm:flex-row sm:gap-3">
                  <div>
                    <CardTitle>Riwayat kehadiran</CardTitle>
                    <CardDescription>
                      {records.length} catatan presensi pada periode ini.
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">{summary.rate}% hadir</Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {[
                      { label: 'Hadir', value: summary.present, tone: 'text-emerald-600 dark:text-emerald-400' },
                      { label: 'Terlambat', value: summary.late, tone: 'text-amber-600 dark:text-amber-400' },
                      { label: 'Izin / sakit', value: summary.leave + summary.sick, tone: 'text-sky-600 dark:text-sky-400' },
                      { label: 'Alpa', value: summary.absent, tone: 'text-rose-600 dark:text-rose-400' },
                    ].map((item) => (
                      <div key={item.label} className="rounded-xl bg-muted/40 p-3">
                        <p className={cn('text-xl font-extrabold', item.tone)}>{item.value}</p>
                        <p className="text-[10px] text-muted-foreground">{item.label}</p>
                      </div>
                    ))}
                  </div>
                  <DataTable<Attendance>
                    columns={[
                      {
                        key: 'date',
                        header: 'Tanggal',
                        mobileSpan: true,
                        mobileOrder: 0,
                        cell: (record) => (
                          <span className="text-xs font-semibold">
                            {formatDate(record.date, 'EEE, d MMM yyyy')}
                          </span>
                        ),
                      },
                      {
                        key: 'status',
                        header: 'Status',
                        mobileOrder: 1,
                        cell: (record) => <AttendanceBadge status={record.status} />,
                      },
                      {
                        key: 'in',
                        header: 'Masuk',
                        mobileOrder: 3,
                        cell: (record) => (
                          <span className="text-xs font-semibold">{record.checkIn ?? '—'}</span>
                        ),
                      },
                      {
                        key: 'out',
                        header: 'Pulang',
                        mobileOrder: 4,
                        cell: (record) => (
                          <span className="text-xs font-semibold">{record.checkOut ?? '—'}</span>
                        ),
                      },
                      {
                        key: 'method',
                        header: 'Metode',
                        mobileOrder: 2,
                        cell: (record) => (
                          <Badge variant="secondary">
                            {record.method === 'qr' ? 'QR' : 'Manual'}
                          </Badge>
                        ),
                      },
                      {
                        key: 'note',
                        header: 'Catatan',
                        mobileSpan: true,
                        mobileOrder: 5,
                        cell: (record) => (
                          <span className="line-clamp-1 max-w-[190px] text-[11px] text-muted-foreground">
                            {record.note ?? '—'}
                          </span>
                        ),
                      },
                    ]}
                    rows={records.slice(0, 20)}
                    keyFor={(record) => record.id}
                    emptyTitle="Belum ada catatan presensi"
                    emptyDescription="Presensi akan tampil setelah peserta melakukan scan QR atau dicatat manual."
                  />
                  {records.length > 20 ? (
                    <Link
                      to="/attendance"
                      className="inline-flex text-[11px] font-bold text-primary hover:underline"
                    >
                      Lihat seluruh rekap presensi
                    </Link>
                  ) : null}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="journals">
              <Card>
                <CardHeader>
                  <CardTitle>Jurnal harian</CardTitle>
                  <CardDescription>
                    {approvedJournals} dari {journals.length} jurnal sudah disetujui.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {journals.length === 0 ? (
                    <EmptyState
                      icon={BookOpenCheck}
                      title="Belum ada jurnal"
                      description="Jurnal yang dikirim peserta akan muncul di sini."
                    />
                  ) : (
                    journals.slice(0, 12).map((journal) => (
                      <div
                        key={journal.id}
                        className="rounded-xl border border-border/70 p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-bold">
                              {formatDate(journal.date, 'EEEE, d MMM yyyy')}
                            </p>
                            <JournalBadge status={journal.status} />
                          </div>
                          <span className="text-[10px] text-muted-foreground">
                            {formatDuration(journal.duration)}
                          </span>
                        </div>
                        <p className="mt-2 text-xs font-bold text-primary">{journal.activity}</p>
                        <p className="mt-1 line-clamp-3 text-[11px] leading-relaxed text-muted-foreground">
                          {journal.description}
                        </p>
                        {journal.obstacle ? (
                          <p className="mt-2 rounded-lg bg-amber-500/[0.07] px-2.5 py-2 text-[10px] leading-relaxed text-amber-700 dark:text-amber-300">
                            Kendala: {journal.obstacle}
                          </p>
                        ) : null}
                        {journal.comment ? (
                          <p className="mt-2 rounded-lg bg-primary/[0.05] px-2.5 py-2 text-[10px] leading-relaxed text-muted-foreground">
                            Catatan pembimbing: {journal.comment}
                          </p>
                        ) : null}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="leaves">
              <Card>
                <CardHeader>
                  <CardTitle>Riwayat perizinan</CardTitle>
                  <CardDescription>
                    {leaves.length} pengajuan izin tercatat.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {leaves.length === 0 ? (
                    <EmptyState
                      icon={FileText}
                      title="Belum ada pengajuan izin"
                      description="Pengajuan izin peserta akan tampil di sini."
                    />
                  ) : (
                    leaves.map((leave) => (
                      <div
                        key={leave.id}
                        className="rounded-xl border border-border/70 p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="secondary">{LEAVE_TYPE_LABELS[leave.type]}</Badge>
                            <LeaveBadge status={leave.status} />
                          </div>
                          <span className="text-[10px] text-muted-foreground">
                            {formatDate(leave.startDate, 'd MMM')} – {formatDate(leave.endDate, 'd MMM yyyy')}
                          </span>
                        </div>
                        <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                          {leave.reason}
                        </p>
                        {leave.attachmentName ? (
                          <p className="mt-2 flex items-center gap-1.5 text-[10px] font-semibold text-primary">
                            <FileText className="h-3 w-3" />
                            {leave.attachmentName}
                          </p>
                        ) : null}
                        {leave.decisionNote ? (
                          <p className="mt-2 rounded-lg bg-muted/50 px-2.5 py-2 text-[10px] leading-relaxed text-muted-foreground">
                            Keputusan: {leave.decisionNote}
                          </p>
                        ) : null}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="assessment">
              {!assessment ? (
                <EmptyState
                  icon={Award}
                  title="Penilaian belum tersedia"
                  description="Pembimbing industri belum mengisi penilaian untuk peserta ini."
                />
              ) : (
                <Card>
                  <CardHeader className="flex-col items-start justify-between gap-2 sm:flex-row sm:gap-3">
                    <div>
                      <CardTitle>Rincian penilaian</CardTitle>
                      <CardDescription>
                        Tahap {assessment.stage === 'final' ? 'akhir' : 'tengah'} ·{' '}
                        {assessment.status === 'final' ? 'final & terkunci' : 'draf'}.
                      </CardDescription>
                    </div>
                    <Badge variant={assessment.status === 'final' ? 'success' : 'warning'}>
                      {assessment.status === 'final' ? 'Final' : 'Draf'}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between rounded-xl bg-primary/[0.06] p-4">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Nilai akhir
                        </p>
                        <p className="mt-1 text-3xl font-extrabold">{finalScore}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {grade.letter} · {grade.label}
                        </p>
                      </div>
                      <div className="text-right text-[10px] text-muted-foreground">
                        <p>Dinilai oleh</p>
                        <p className="mt-1 text-xs font-bold text-foreground">
                          {data.users.find((item) => item.id === assessment.assessorId)?.name}
                        </p>
                        <p className="mt-1">{formatDate(assessment.updatedAt)}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {components.map((component) => {
                        const score = scores[component.id] ?? 0
                        return (
                          <div key={component.id}>
                            <div className="mb-1.5 flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <p className="text-xs font-bold">{component.name}</p>
                                {component.auto === 'attendance' ? (
                                  <Badge variant="info">Otomatis</Badge>
                                ) : null}
                              </div>
                              <span className="text-[10px] text-muted-foreground">
                                {score} · bobot {component.weight}%
                              </span>
                            </div>
                            <Progress value={score} className="h-1.5" />
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <div className="min-w-0 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Data peserta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-[11px]">
              {[
                { icon: GraduationCap, label: 'NIS', value: participant.nis },
                { icon: School, label: 'Sekolah', value: school?.name },
                { icon: UserRound, label: 'Jurusan', value: participant.major },
                { icon: Users, label: 'Kelas', value: participant.className },
                { icon: Building2, label: 'Divisi', value: division?.name },
                { icon: CalendarDays, label: 'Periode', value: period?.name },
                { icon: UserRound, label: 'Pembimbing industri', value: supervisor?.name },
                { icon: GraduationCap, label: 'Guru pembimbing', value: teacher?.name },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-2.5">
                  <item.icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground">
                      {item.label}
                    </p>
                    <p className="truncate font-semibold">{item.value ?? '—'}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Kontak</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-[11px]">
              <a
                href={`mailto:${student?.email}`}
                className="flex items-center gap-2 rounded-lg border border-border/70 p-2.5 font-semibold transition-colors hover:bg-muted/50"
              >
                <Mail className="h-3.5 w-3.5 text-primary" />
                <span className="truncate">{student?.email}</span>
              </a>
              <a
                href={`tel:${student?.phone?.replace(/[^0-9+]/g, '')}`}
                className="flex items-center gap-2 rounded-lg border border-border/70 p-2.5 font-semibold transition-colors hover:bg-muted/50"
              >
                <Phone className="h-3.5 w-3.5 text-primary" />
                {student?.phone}
              </a>
              <div className="flex items-center gap-2 rounded-lg bg-muted/40 p-2.5 text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                <span className="line-clamp-2">{school?.address}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-dashed">
            <CardContent className="flex items-start gap-2.5 p-4">
              <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p className="text-[10px] leading-relaxed text-muted-foreground">
                Data terakhir diperbarui otomatis setiap kali peserta melakukan presensi
                atau mengirim jurnal.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
