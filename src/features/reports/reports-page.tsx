import * as React from 'react'
import {
  Award,
  BarChart3,
  CheckCircle2,
  Clock3,
  Download,
  Printer,
  Search,
  TriangleAlert,
  Users,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { DataTable } from '@/components/shared/data-table'
import { EmptyState } from '@/components/shared/empty-state'
import {
  AttendanceBarChart,
  DivisionBarChart,
} from '@/components/charts/attendance-charts'
import { useAuth } from '@/providers/auth-provider'
import { useData } from '@/providers/data-provider'
import {
  lateRanking,
  lowAttendanceParticipants,
  participantRecords,
  participantsForSupervisor,
  participantsForTeacher,
  trendForParticipants,
} from '@/lib/analytics'
import {
  cn,
  downloadCsv,
  gradeFromScore,
  summarizeAttendance,
  todayKey,
  weightedScore,
} from '@/lib/utils'
import type { AppData, Assessment, AssessmentComponent } from '@/types'

function resolvedAssessment(
  data: AppData,
  participantId: string,
  components: AssessmentComponent[],
) {
  const assessments = data.assessments.filter(
    (item) => item.participantId === participantId,
  )
  const assessment: Assessment | undefined =
    assessments.find((item) => item.status === 'final' && item.stage === 'final') ??
    assessments.find((item) => item.status === 'final') ??
    assessments[0]

  const summary = summarizeAttendance(participantRecords(data, participantId))
  const autoScore = Math.max(
    0,
    Math.min(100, Math.round(summary.rate - summary.late * 1.5)),
  )
  const scores = Object.fromEntries(
    components.map((component) => [
      component.id,
      component.auto === 'attendance'
        ? autoScore
        : assessment?.scores[component.id] ?? 0,
    ]),
  ) as Record<string, number>

  return {
    assessment,
    score: assessment ? weightedScore(scores, components) : null,
  }
}

export function ReportsPage() {
  const { user } = useAuth()
  const { data } = useData()
  const [division, setDivision] = React.useState('all')
  const [school, setSchool] = React.useState('all')
  const [period, setPeriod] = React.useState('all')
  const [query, setQuery] = React.useState('')

  if (!user) return null

  const scoped =
    user.role === 'supervisor'
      ? participantsForSupervisor(data, user.id)
      : user.role === 'teacher'
        ? participantsForTeacher(data, user.id)
        : data.participants

  const filtered = scoped.filter((participant) => {
    const student = data.users.find((item) => item.id === participant.userId)
    const matchesQuery =
      !query.trim() ||
      student?.name.toLowerCase().includes(query.toLowerCase()) ||
      participant.nis.toLowerCase().includes(query.toLowerCase())
    return (
      matchesQuery &&
      (division === 'all' || participant.divisionId === division) &&
      (school === 'all' || participant.schoolId === school) &&
      (period === 'all' || participant.periodId === period)
    )
  })

  const rows = filtered.map((participant) => {
    const student = data.users.find((item) => item.id === participant.userId)
    const summary = summarizeAttendance(participantRecords(data, participant.id))
    const journals = data.journals.filter(
      (item) => item.participantId === participant.id,
    )
    const assessment = resolvedAssessment(
      data,
      participant.id,
      data.assessmentComponents,
    )
    return {
      participant,
      student,
      summary,
      journalsTotal: journals.length,
      journalsApproved: journals.filter((item) => item.status === 'approved').length,
      score: assessment.score,
      assessmentStatus: assessment.assessment?.status,
      grade: assessment.score !== null ? gradeFromScore(assessment.score) : null,
    }
  })

  const trend = trendForParticipants(
    data,
    filtered.map((participant) => participant.id),
    7,
  )
  const withRecords = rows.filter((row) => row.summary.total > 0)
  const averageRate = withRecords.length
    ? Math.round(
        withRecords.reduce((sum, row) => sum + row.summary.rate, 0) /
          withRecords.length,
      )
    : 0
  const totalLate = rows.reduce((sum, row) => sum + row.summary.late, 0)
  const totalAbsent = rows.reduce((sum, row) => sum + row.summary.absent, 0)
  const scoredRows = rows.filter((row) => row.score !== null)
  const averageScore = scoredRows.length
    ? Math.round(
        scoredRows.reduce((sum, row) => sum + (row.score ?? 0), 0) /
          scoredRows.length,
      )
    : 0
  const low = lowAttendanceParticipants(data, filtered)
  const late = lateRanking(data, filtered)
  const divisionRows = data.divisions
    .map((item) => ({
      name: item.name,
      value: filtered.filter((participant) => participant.divisionId === item.id).length,
    }))
    .filter((item) => item.value > 0)

  const exportCsv = () => {
    downloadCsv(`rekap-pkl-${todayKey()}.csv`, [
      [
        'Nama',
        'NIS',
        'Sekolah',
        'Divisi',
        'Kehadiran (%)',
        'Hadir',
        'Terlambat',
        'Izin/Sakit',
        'Alpa',
        'Jurnal disetujui',
        'Total jurnal',
        'Nilai akhir',
        'Predikat',
      ],
      ...rows.map((row) => [
        row.student?.name ?? '',
        row.participant.nis,
        data.schools.find((item) => item.id === row.participant.schoolId)?.name ?? '',
        data.divisions.find((item) => item.id === row.participant.divisionId)?.name ?? '',
        row.summary.rate,
        row.summary.present,
        row.summary.late,
        row.summary.leave + row.summary.sick,
        row.summary.absent,
        row.journalsApproved,
        row.journalsTotal,
        row.score ?? '',
        row.grade ? `${row.grade.letter} · ${row.grade.label}` : '',
      ]),
    ])
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="no-print">
        <PageHeader
          eyebrow="Laporan & analitik"
          title="Rekap kinerja PKL"
          description="Pantau kehadiran, jurnal, dan nilai seluruh peserta dalam satu laporan yang siap dicetak atau diekspor."
          actions={
            <>
              <Button variant="outline" onClick={exportCsv} disabled={!rows.length}>
                <Download className="h-4 w-4" />
                Ekspor CSV
              </Button>
              <Button onClick={() => window.print()} disabled={!rows.length}>
                <Printer className="h-4 w-4" />
                Cetak laporan
              </Button>
            </>
          }
        />
      </div>

      <div className="hidden print:block">
        <div className="border-b-2 border-slate-800 pb-3 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em]">
            PT Len Industri (Persero)
          </p>
          <h1 className="mt-1 text-lg font-extrabold">LAPORAN KINERJA PESERTA PKL</h1>
          <p className="mt-1 text-[10px]">
            Dicetak {new Date().toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
      </div>

      <div className="no-print grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard
          label="Peserta dalam laporan"
          value={filtered.length}
          hint={`${data.participants.length} peserta terdaftar`}
          icon={Users}
          tone="primary"
        />
        <StatCard
          label="Rata-rata kehadiran"
          value={`${averageRate}%`}
          hint={`${totalLate} keterlambatan · ${totalAbsent} alpa`}
          icon={CheckCircle2}
          tone="emerald"
        />
        <StatCard
          label="Rata-rata nilai"
          value={averageScore}
          hint={`${scoredRows.length} peserta sudah dinilai`}
          icon={Award}
          tone="violet"
        />
        <StatCard
          label="Perlu perhatian"
          value={low.length}
          hint="kehadiran di bawah 80%"
          icon={TriangleAlert}
          tone="rose"
        />
      </div>

      <Card className="no-print">
        <CardContent className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari nama atau NIS..."
              className="pl-10"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <Select value={division} onChange={(event) => setDivision(event.target.value)}>
            <option value="all">Semua divisi</option>
            {data.divisions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Select>
          <Select value={school} onChange={(event) => setSchool(event.target.value)}>
            <option value="all">Semua sekolah</option>
            {data.schools.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Select>
          <Select value={period} onChange={(event) => setPeriod(event.target.value)}>
            <option value="all">Semua periode</option>
            {data.periods.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Select>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="Belum ada data untuk dilaporkan"
          description="Ubah filter atau pastikan peserta sudah terhubung dengan akun pembimbing."
        />
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-[1.5fr_0.5fr]">
            <Card>
              <CardHeader>
                <CardTitle>Kehadiran 7 hari kerja terakhir</CardTitle>
                <CardDescription>
                  Distribusi status presensi peserta dalam laporan.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AttendanceBarChart data={trend} />
                <div className="mt-3 flex flex-wrap gap-3 text-[10px] text-muted-foreground">
                  {[
                    { label: 'Hadir', className: 'bg-emerald-500' },
                    { label: 'Terlambat', className: 'bg-amber-500' },
                    { label: 'Izin/sakit', className: 'bg-sky-500' },
                    { label: 'Alpa', className: 'bg-rose-500' },
                  ].map((item) => (
                    <span key={item.label} className="flex items-center gap-1.5">
                      <span className={cn('h-2 w-2 rounded-full', item.className)} />
                      {item.label}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sebaran divisi</CardTitle>
                <CardDescription>Jumlah peserta per divisi.</CardDescription>
              </CardHeader>
              <CardContent>
                <DivisionBarChart data={divisionRows} />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Perlu perhatian</CardTitle>
                <CardDescription>
                  Peserta dengan kehadiran di bawah 80%.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {low.length === 0 ? (
                  <div className="flex items-center gap-2 rounded-xl bg-emerald-500/[0.07] p-3 text-[11px] text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="h-4 w-4" />
                    Semua peserta memiliki kehadiran yang baik.
                  </div>
                ) : (
                  low.slice(0, 5).map((item) => {
                    const student = data.users.find(
                      (userItem) => userItem.id === item.participant.userId,
                    )
                    return (
                      <div
                        key={item.participant.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-border/70 p-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold">{student?.name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {item.participant.nis} · {item.participant.className}
                          </p>
                        </div>
                        <Badge variant="danger">{item.summary.rate}%</Badge>
                      </div>
                    )
                  })
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Paling sering terlambat</CardTitle>
                <CardDescription>Lima peserta dengan keterlambatan terbanyak.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {late.length === 0 ? (
                  <div className="flex items-center gap-2 rounded-xl bg-emerald-500/[0.07] p-3 text-[11px] text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="h-4 w-4" />
                    Tidak ada keterlambatan tercatat.
                  </div>
                ) : (
                  late.map((item) => {
                    const student = data.users.find(
                      (userItem) => userItem.id === item.participant.userId,
                    )
                    return (
                      <div
                        key={item.participant.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-border/70 p-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold">{student?.name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            Kehadiran {item.rate}%
                          </p>
                        </div>
                        <Badge variant="warning">
                          <Clock3 className="h-3 w-3" />
                          {item.late}x
                        </Badge>
                      </div>
                    )
                  })
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="print-area">
            <CardHeader>
              <CardTitle>Rincian per peserta</CardTitle>
              <CardDescription>
                {rows.length} peserta · klik ekspor CSV untuk mengolah data di spreadsheet.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={[
                  {
                    key: 'name',
                    header: 'Peserta',
                    mobileSpan: true,
                    mobileOrder: 0,
                    cell: (row: (typeof rows)[number]) => (
                      <div>
                        <p className="text-xs font-bold">{row.student?.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {row.participant.nis} · {row.participant.className}
                        </p>
                      </div>
                    ),
                  },
                  {
                    key: 'division',
                    header: 'Divisi',
                    mobileSpan: true,
                    mobileOrder: 1,
                    cell: (row: (typeof rows)[number]) => (
                      <Badge variant="secondary">
                        {data.divisions.find(
                          (item) => item.id === row.participant.divisionId,
                        )?.name ?? '—'}
                      </Badge>
                    ),
                  },
                  {
                    key: 'rate',
                    header: 'Kehadiran',
                    mobileOrder: 2,
                    cell: (row: (typeof rows)[number]) => (
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'text-xs font-extrabold',
                            row.summary.rate >= 80
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400',
                          )}
                        >
                          {row.summary.rate}%
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {row.summary.present + row.summary.late} hari
                        </span>
                      </div>
                    ),
                  },
                  {
                    key: 'late',
                    header: 'Terlambat',
                    mobileOrder: 4,
                    cell: (row: (typeof rows)[number]) => (
                      <span className="text-xs font-semibold">{row.summary.late}x</span>
                    ),
                  },
                  {
                    key: 'absent',
                    header: 'Alpa',
                    mobileOrder: 5,
                    cell: (row: (typeof rows)[number]) => (
                      <span className="text-xs font-semibold">{row.summary.absent}x</span>
                    ),
                  },
                  {
                    key: 'journal',
                    header: 'Jurnal',
                    mobileOrder: 6,
                    cell: (row: (typeof rows)[number]) => (
                      <span className="text-xs font-semibold">
                        {row.journalsApproved}/{row.journalsTotal}
                      </span>
                    ),
                  },
                  {
                    key: 'score',
                    header: 'Nilai',
                    mobileOrder: 7,
                    cell: (row: (typeof rows)[number]) =>
                      row.score !== null ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-extrabold">{row.score}</span>
                          <Badge variant="info">{row.grade?.letter}</Badge>
                        </div>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">Belum dinilai</span>
                      ),
                  },
                  {
                    key: 'status',
                    header: 'Status',
                    mobileOrder: 3,
                    cell: (row: (typeof rows)[number]) =>
                      row.summary.rate >= 80 ? (
                        <Badge variant="success">Baik</Badge>
                      ) : (
                        <Badge variant="danger">Perhatian</Badge>
                      ),
                  },
                ]}
                rows={rows}
                keyFor={(row) => row.participant.id}
                emptyTitle="Belum ada peserta"
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
