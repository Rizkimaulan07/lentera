import * as React from 'react'
import { Link } from 'react-router-dom'
import {
  Award,
  CheckCircle2,
  ClipboardCheck,
  Download,
  FileText,
  GraduationCap,
  LockKeyhole,
  Printer,
  Save,
  Settings,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Select } from '@/components/ui/select'
import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { EmptyState } from '@/components/shared/empty-state'
import { DataTable } from '@/components/shared/data-table'
import { useAuth } from '@/providers/auth-provider'
import { useData } from '@/providers/data-provider'
import {
  participantRecords,
  participantsForSupervisor,
  participantsForTeacher,
} from '@/lib/analytics'
import {
  cn,
  formatDate,
  getParticipantByUserId,
  gradeFromScore,
  summarizeAttendance,
  weightedScore,
} from '@/lib/utils'
import type {
  AppData,
  Assessment,
  AssessmentComponent,
  Participant,
  User,
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

function assessmentFinal(
  data: AppData,
  participantId: string,
  assessment: Assessment | undefined,
  components: AssessmentComponent[],
) {
  const scores = resolvedScores(data, participantId, assessment, components)
  return weightedScore(scores, components)
}

function ScoreRing({ score, size = 132 }: { score: number; size?: number }) {
  const radius = 52
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(255,255,255,.16)" strokeWidth="9" />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="#FFD6DA"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-extrabold text-white">{score}</span>
        <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-300">
          Nilai akhir
        </span>
      </div>
    </div>
  )
}

function PrintSheet({
  participant,
  assessment,
  data,
  components,
}: {
  participant: Participant
  assessment: Assessment | undefined
  data: AppData
  components: AssessmentComponent[]
}) {
  const student = data.users.find((item) => item.id === participant.userId)
  const school = data.schools.find((item) => item.id === participant.schoolId)
  const division = data.divisions.find((item) => item.id === participant.divisionId)
  const supervisor = data.users.find((item) => item.id === participant.supervisorId)
  const period = data.periods.find((item) => item.id === participant.periodId)
  const scores = resolvedScores(data, participant.id, assessment, components)
  const final = weightedScore(scores, components)
  const grade = gradeFromScore(final)
  return (
    <div className="hidden print:block bg-white p-8 text-slate-900">
      <div className="border-b-2 border-slate-800 pb-4 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em]">PT Len Industri (Persero)</p>
        <h1 className="mt-1 text-xl font-extrabold">LEMBAR PENILAIAN PRAKTIK KERJA LAPANGAN</h1>
        <p className="mt-1 text-[11px]">{period?.name}</p>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-x-8 gap-y-1.5 text-[11px]">
        <p><span className="inline-block w-28 font-semibold">Nama peserta</span>: {student?.name}</p>
        <p><span className="inline-block w-28 font-semibold">NIS</span>: {participant.nis}</p>
        <p><span className="inline-block w-28 font-semibold">Sekolah</span>: {school?.name}</p>
        <p><span className="inline-block w-28 font-semibold">Kelas / jurusan</span>: {participant.className} / {participant.major}</p>
        <p><span className="inline-block w-28 font-semibold">Divisi</span>: {division?.name}</p>
        <p><span className="inline-block w-28 font-semibold">Pembimbing</span>: {supervisor?.name}</p>
      </div>
      <table className="mt-6 w-full border-collapse text-[11px]">
        <thead>
          <tr className="bg-slate-100">
            <th className="border border-slate-300 px-3 py-2 text-left">Komponen penilaian</th>
            <th className="border border-slate-300 px-3 py-2 text-center">Bobot</th>
            <th className="border border-slate-300 px-3 py-2 text-center">Nilai (0–100)</th>
            <th className="border border-slate-300 px-3 py-2 text-center">Nilai tertimbang</th>
          </tr>
        </thead>
        <tbody>
          {components.map((component) => (
            <tr key={component.id}>
              <td className="border border-slate-300 px-3 py-2">{component.name}</td>
              <td className="border border-slate-300 px-3 py-2 text-center">{component.weight}%</td>
              <td className="border border-slate-300 px-3 py-2 text-center">{scores[component.id] ?? 0}</td>
              <td className="border border-slate-300 px-3 py-2 text-center">
                {Math.round(((scores[component.id] ?? 0) * component.weight) / 100)}
              </td>
            </tr>
          ))}
          <tr className="bg-slate-100 font-bold">
            <td colSpan={2} className="border border-slate-300 px-3 py-2 text-right">Nilai akhir</td>
            <td className="border border-slate-300 px-3 py-2 text-center text-base">{final}</td>
            <td className="border border-slate-300 px-3 py-2 text-center">{grade.letter} · {grade.label}</td>
          </tr>
        </tbody>
      </table>
      <p className="mt-3 text-[10px] text-slate-500">
        Nilai disiplin & kehadiran dihitung otomatis dari rekap presensi. Dokumen dicetak pada{' '}
        {formatDate(new Date(), 'd MMMM yyyy')}.
      </p>
      <div className="mt-12 grid grid-cols-2 gap-10 text-center text-[11px]">
        <div>
          <p>Pembimbing Industri</p>
          <div className="mt-16 border-t border-slate-400 pt-1">{supervisor?.name}</div>
        </div>
        <div>
          <p>Koordinator PKL / Guru Pembimbing</p>
          <div className="mt-16 border-t border-slate-400 pt-1">
            {data.users.find((item) => item.role === 'teacher')?.name}
          </div>
        </div>
      </div>
    </div>
  )
}

export function AssessmentsPage() {
  const { user } = useAuth()
  const { data, saveAssessment } = useData()
  if (!user) return null

  if (user.role === 'participant') {
    return <ParticipantAssessmentView user={user} data={data} />
  }
  if (user.role === 'supervisor') {
    return (
      <SupervisorAssessmentView user={user} data={data} saveAssessment={saveAssessment} />
    )
  }
  return <AssessmentOverview user={user} data={data} />
}

function ParticipantAssessmentView({ user, data }: { user: User; data: AppData }) {
  const participant = getParticipantByUserId(data.participants, user.id)
  const [printOpen, setPrintOpen] = React.useState(false)
  if (!participant) return null

  const assessments = data.assessments.filter(
    (item) => item.participantId === participant.id,
  )
  const assessment =
    assessments.find((item) => item.status === 'final' && item.stage === 'final') ??
    assessments.find((item) => item.status === 'final') ??
    assessments[0]
  const components = data.assessmentComponents
  const scores = resolvedScores(data, participant.id, assessment, components)
  const final = weightedScore(scores, components)
  const grade = gradeFromScore(final)
  const summary = summarizeAttendance(participantRecords(data, participant.id))

  if (!assessment) {
    return (
      <div>
        <PageHeader
          eyebrow="Penilaian"
          title="Nilai saya"
          description="Rekap penilaian dari pembimbing industri akan tampil di sini setelah diisi."
        />
        <EmptyState
          icon={Award}
          title="Penilaian belum tersedia"
          description="Pembimbing industri belum mengisi penilaian untukmu. Sambil menunggu, lengkapi jurnal dan jaga kehadiran."
          action={
            <Link to="/journals" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
              <ClipboardCheck className="h-3.5 w-3.5" />
              Buka jurnal
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="no-print space-y-5 sm:space-y-6">
        <PageHeader
          eyebrow="Penilaian"
          title="Nilai saya"
          description="Rincian penilaian PKL dari pembimbing industri. Nilai akhir dihitung otomatis dari bobot komponen."
          actions={
            <>
              <Button variant="outline" onClick={() => setPrintOpen(true)}>
                <FileText className="h-4 w-4" />
                Lihat lembar nilai
              </Button>
              <Button onClick={() => window.print()}>
                <Printer className="h-4 w-4" />
                Cetak
              </Button>
            </>
          }
        />

        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-[#4a040b] via-[#8b0e1a] to-[#c8102e] text-white">
          <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-rose-300/25 blur-3xl" />
          <div className="relative grid gap-6 p-6 sm:grid-cols-[1fr_auto] sm:items-center sm:p-8">
            <div>
              <Badge className="border-white/15 bg-white/10 text-white">
                {assessment.status === 'final' ? 'Nilai final' : 'Draf penilaian'} ·{' '}
                {assessment.stage === 'final' ? 'Tahap akhir' : 'Tahap tengah'}
              </Badge>
              <h2 className="mt-3 text-2xl font-extrabold">
                {grade.label}, {user.name.split(' ')[0]}!
              </h2>
              <p className="mt-1 text-sm text-slate-300">
                Predikat {grade.letter} dengan nilai akhir {final}. Pertahankan performa
                dan terus belajar.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge className="border-white/15 bg-white/10 text-white">
                  <TrendingUp className="h-3 w-3" />
                  Kehadiran {summary.rate}%
                </Badge>
                <Badge className="border-white/15 bg-white/10 text-white">
                  <CheckCircle2 className="h-3 w-3" />
                  {summary.present + summary.late} hari hadir
                </Badge>
                <Badge className="border-white/15 bg-white/10 text-white">
                  <Sparkles className="h-3 w-3" />
                  {components.length} komponen
                </Badge>
              </div>
            </div>
            <ScoreRing score={final} />
          </div>
        </Card>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Rincian komponen nilai</CardTitle>
              <CardDescription>
                Bobot dan nilai per komponen penilaian PKL.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {components.map((component) => {
                const score = scores[component.id] ?? 0
                return (
                  <div key={component.id}>
                    <div className="mb-1.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold">{component.name}</p>
                        {component.auto === 'attendance' ? (
                          <Badge variant="info">Otomatis</Badge>
                        ) : null}
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-extrabold">{score}</span>
                        <span className="ml-1 text-[10px] text-muted-foreground">
                          · bobot {component.weight}%
                        </span>
                      </div>
                    </div>
                    <Progress
                      value={score}
                      indicatorClassName={cn(
                        score >= 90
                          ? 'bg-emerald-500'
                          : score >= 80
                            ? 'bg-primary'
                            : score >= 70
                              ? 'bg-amber-500'
                              : 'bg-rose-500',
                      )}
                    />
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ringkasan</CardTitle>
              <CardDescription>Status dan catatan penilaian.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-xl bg-primary/[0.06] p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Nilai akhir
                </p>
                <p className="mt-1 text-3xl font-extrabold">{final}</p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Predikat {grade.letter} · {grade.label}
                </p>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border/70 p-3 text-[11px]">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={assessment.status === 'final' ? 'success' : 'warning'}>
                  {assessment.status === 'final' ? 'Final & terkunci' : 'Draf'}
                </Badge>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border/70 p-3 text-[11px]">
                <span className="text-muted-foreground">Penilai</span>
                <span className="font-bold">
                  {data.users.find((item) => item.id === assessment.assessorId)?.name}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border/70 p-3 text-[11px]">
                <span className="text-muted-foreground">Diperbarui</span>
                <span className="font-bold">{formatDate(assessment.updatedAt, 'd MMM yyyy')}</span>
              </div>
              <p className="rounded-xl bg-muted/40 p-3 text-[10px] leading-relaxed text-muted-foreground">
                Nilai disiplin & kehadiran dihitung otomatis dari rekap presensi. Hubungi
                pembimbing jika ada pertanyaan.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <PrintSheet
        participant={participant}
        assessment={assessment}
        data={data}
        components={components}
      />

      <Dialog open={printOpen} onOpenChange={setPrintOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Lembar nilai PKL</DialogTitle>
            <DialogDescription>
              Pratinjau dokumen. Gunakan tombol cetak untuk menyimpan sebagai PDF.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-3 overflow-x-auto rounded-xl border border-border bg-white p-4 text-slate-900">
            <div className="min-w-[520px]">
              <p className="text-center text-[10px] font-bold uppercase tracking-wider">
                PT Len Industri (Persero)
              </p>
              <p className="text-center text-sm font-extrabold">LEMBAR PENILAIAN PKL</p>
              <div className="mt-3 grid grid-cols-2 gap-1 text-[10px]">
                <p>Nama: {user.name}</p>
                <p>NIS: {participant.nis}</p>
                <p>Divisi: {data.divisions.find((item) => item.id === participant.divisionId)?.name}</p>
                <p>Kelas: {participant.className}</p>
              </div>
              <table className="mt-3 w-full border-collapse text-[10px]">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border border-slate-300 p-1.5 text-left">Komponen</th>
                    <th className="border border-slate-300 p-1.5">Bobot</th>
                    <th className="border border-slate-300 p-1.5">Nilai</th>
                  </tr>
                </thead>
                <tbody>
                  {components.map((component) => (
                    <tr key={component.id}>
                      <td className="border border-slate-300 p-1.5">{component.name}</td>
                      <td className="border border-slate-300 p-1.5 text-center">{component.weight}%</td>
                      <td className="border border-slate-300 p-1.5 text-center">{scores[component.id]}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-100 font-bold">
                    <td className="border border-slate-300 p-1.5" colSpan={2}>Nilai akhir</td>
                    <td className="border border-slate-300 p-1.5 text-center">{final}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPrintOpen(false)}>
              Tutup
            </Button>
            <Button
              onClick={() => {
                setPrintOpen(false)
                window.setTimeout(() => window.print(), 200)
              }}
            >
              <Printer className="h-4 w-4" />
              Cetak / simpan PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SupervisorAssessmentView({
  user,
  data,
  saveAssessment,
}: {
  user: User
  data: AppData
  saveAssessment: ReturnType<typeof useData>['saveAssessment']
}) {
  const participants = participantsForSupervisor(data, user.id)
  const [selectedId, setSelectedId] = React.useState(participants[0]?.id ?? '')
  const [stage, setStage] = React.useState<'mid' | 'final'>('final')
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const selected = data.participants.find((item) => item.id === selectedId)
  const components = data.assessmentComponents
  const manualComponents = components.filter((component) => !component.auto)
  const autoComponent = components.find((component) => component.auto === 'attendance')
  const existing = data.assessments.find(
    (item) => item.participantId === selectedId && item.stage === stage,
  )
  const [scores, setScores] = React.useState<Record<string, number>>({})

  React.useEffect(() => {
    const next: Record<string, number> = {}
    manualComponents.forEach((component) => {
      next[component.id] = existing?.scores[component.id] ?? 85
    })
    setScores(next)
    // Reset hanya ketika peserta, tahap, atau id penilaian berubah.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, stage, existing?.id])

  if (!selected) {
    return (
      <EmptyState
        icon={Users}
        title="Belum ada peserta bimbingan"
        description="Hubungi admin PKL untuk menghubungkan peserta ke akunmu."
      />
    )
  }

  const student = data.users.find((item) => item.id === selected.userId)
  const auto = attendanceScore(data, selected.id)
  const allScores = {
    ...scores,
    ...(autoComponent ? { [autoComponent.id]: auto } : {}),
  }
  const final = weightedScore(allScores, components)
  const grade = gradeFromScore(final)
  const locked = existing?.status === 'final'
  const summary = summarizeAttendance(participantRecords(data, selected.id))

  const handleSave = (finalize: boolean) => {
    const result = saveAssessment({
      participantId: selected.id,
      assessorId: user.id,
      stage,
      scores: allScores,
      finalize,
    })
    if (!result.ok) {
      toast.error(result.message)
      return
    }
    toast.success(result.message)
    setConfirmOpen(false)
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="no-print space-y-5 sm:space-y-6">
        <PageHeader
          eyebrow="Penilaian peserta"
          title="Input & finalisasi nilai"
          description="Nilai disiplin dihitung otomatis dari rekap presensi. Komponen lain diisi manual dan digabung sesuai bobot."
          actions={
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="h-4 w-4" />
              Cetak lembar nilai
            </Button>
          }
        />

        <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
          <Card>
            <CardHeader>
              <CardTitle>Pilih peserta</CardTitle>
              <CardDescription>Peserta bimbingan dan tahap penilaian.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label>Peserta</Label>
                <Select value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>
                  {participants.map((participant) => {
                    const participantUser = data.users.find(
                      (item) => item.id === participant.userId,
                    )
                    return (
                      <option key={participant.id} value={participant.id}>
                        {participantUser?.name} · {participant.className}
                      </option>
                    )
                  })}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Tahap</Label>
                <Select
                  value={stage}
                  onChange={(event) => setStage(event.target.value as 'mid' | 'final')}
                >
                  <option value="mid">Tengah periode</option>
                  <option value="final">Akhir periode</option>
                </Select>
              </div>

              <div className="rounded-xl border border-border/70 p-3">
                <div className="flex items-center gap-2.5">
                  <Avatar name={student?.name ?? 'Peserta'} size="md" />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold">{student?.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {selected.nis} · {selected.className}
                    </p>
                  </div>
                  {existing ? (
                    <Badge variant={locked ? 'success' : 'warning'} className="ml-auto">
                      {locked ? 'Final' : 'Draf'}
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="ml-auto">Belum dinilai</Badge>
                  )}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-center">
                  <div className="rounded-lg bg-emerald-500/[0.07] p-2">
                    <p className="text-sm font-extrabold">{summary.rate}%</p>
                    <p className="text-[9px] text-muted-foreground">Kehadiran</p>
                  </div>
                  <div className="rounded-lg bg-amber-500/[0.08] p-2">
                    <p className="text-sm font-extrabold">{summary.late}</p>
                    <p className="text-[9px] text-muted-foreground">Terlambat</p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border/70 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Nilai akhir sementara
                    </p>
                    <p className="mt-1 text-3xl font-extrabold">{final}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="info">{grade.letter}</Badge>
                    <p className="mt-1 text-[10px] text-muted-foreground">{grade.label}</p>
                  </div>
                </div>
                <Progress
                  value={final}
                  className="mt-3"
                  indicatorClassName="bg-primary"
                />
              </div>

              {locked ? (
                <div className="flex items-start gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] p-3 text-[10px] leading-relaxed text-emerald-700 dark:text-emerald-300">
                  <LockKeyhole className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  Penilaian tahap ini sudah difinalisasi dan tidak dapat diubah.
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => handleSave(false)}>
                    <Save className="h-4 w-4" />
                    Simpan draf
                  </Button>
                  <Button className="flex-1" onClick={() => setConfirmOpen(true)}>
                    <CheckCircle2 className="h-4 w-4" />
                    Finalisasi
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-col items-start justify-between gap-2 sm:flex-row">
              <div>
                <CardTitle>Komponen penilaian</CardTitle>
                <CardDescription>
                  Skala 0–100. Bobot total {components.reduce((sum, item) => sum + item.weight, 0)}%.
                </CardDescription>
              </div>
              <Link
                to="/admin/settings"
                className={buttonVariants({ variant: 'ghost', size: 'sm' })}
              >
                <Settings className="h-3.5 w-3.5" />
                Bobot
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {components.map((component) => {
                const isAuto = component.auto === 'attendance'
                const value = isAuto ? auto : scores[component.id] ?? 0
                return (
                  <div
                    key={component.id}
                    className={cn(
                      'rounded-xl border p-3',
                      isAuto
                        ? 'border-sky-500/20 bg-sky-500/[0.04]'
                        : 'border-border/70',
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-xs font-bold">{component.name}</p>
                          <Badge variant="secondary">{component.weight}%</Badge>
                          {isAuto ? <Badge variant="info">Otomatis</Badge> : null}
                        </div>
                        {isAuto ? (
                          <p className="mt-1 text-[9px] text-muted-foreground">
                            Dihitung dari kehadiran {summary.rate}% dan {summary.late} keterlambatan.
                          </p>
                        ) : null}
                      </div>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={value}
                        disabled={isAuto || locked}
                        onChange={(event) =>
                          setScores((current) => ({
                            ...current,
                            [component.id]: Math.max(
                              0,
                              Math.min(100, Number(event.target.value)),
                            ),
                          }))
                        }
                        className="h-9 w-20 text-center font-bold"
                      />
                    </div>
                    <Progress
                      value={value}
                      className="mt-2.5 h-1.5"
                      indicatorClassName={isAuto ? 'bg-sky-500' : undefined}
                    />
                  </div>
                )
              })}
              <p className="text-[10px] leading-relaxed text-muted-foreground">
                Nilai akhir dihitung otomatis setelah semua komponen diisi. Finalisasi
                mengunci penilaian dan mengirim notifikasi ke peserta.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <PrintSheet
        participant={selected}
        assessment={{
          id: existing?.id ?? 'draft',
          participantId: selected.id,
          assessorId: user.id,
          stage,
          scores: allScores,
          status: existing?.status ?? 'draft',
          updatedAt: existing?.updatedAt ?? new Date().toISOString(),
        }}
        data={data}
        components={components}
      />

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finalisasi penilaian?</DialogTitle>
            <DialogDescription>
              Nilai akhir {final} ({grade.letter} · {grade.label}) akan dikunci dan peserta
              mendapat notifikasi. Pastikan semua komponen sudah benar.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Periksa lagi
            </Button>
            <Button variant="success" onClick={() => handleSave(true)}>
              <LockKeyhole className="h-4 w-4" />
              Ya, finalisasi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function AssessmentOverview({ user, data }: { user: User; data: AppData }) {
  const participants =
    user.role === 'teacher'
      ? participantsForTeacher(data, user.id)
      : data.participants
  const [detailId, setDetailId] = React.useState<string | null>(null)
  const detailParticipant = data.participants.find((item) => item.id === detailId)
  const detailAssessment = data.assessments.find(
    (item) => item.participantId === detailId && item.status === 'final',
  ) ?? data.assessments.find((item) => item.participantId === detailId)
  const components = data.assessmentComponents
  const rows = participants.map((participant) => {
    const assessments = data.assessments.filter(
      (item) => item.participantId === participant.id,
    )
    const assessment =
      assessments.find((item) => item.status === 'final' && item.stage === 'final') ??
      assessments.find((item) => item.status === 'final') ??
      assessments[0]
    return {
      participant,
      assessment,
      final: assessmentFinal(data, participant.id, assessment, components),
    }
  })
  const finalized = rows.filter((row) => row.assessment?.status === 'final')
  const average = finalized.length
    ? Math.round(finalized.reduce((sum, row) => sum + row.final, 0) / finalized.length)
    : 0
  const detailScores: Record<string, number> = detailParticipant
    ? resolvedScores(data, detailParticipant.id, detailAssessment, components)
    : {}
  const detailFinal = detailParticipant
    ? weightedScore(detailScores, components)
    : 0
  const detailGrade = gradeFromScore(detailFinal)

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        eyebrow="Penilaian PKL"
        title="Rekap penilaian"
        description="Pantau status penilaian peserta. Nilai akhir dihitung dari komponen berbobot dan kehadiran otomatis."
        actions={
          user.role === 'admin' ? (
            <Link to="/admin/settings" className={buttonVariants()}>
              <Settings className="h-4 w-4" />
              Atur komponen & bobot
            </Link>
          ) : (
            <Link to="/reports" className={buttonVariants({ variant: 'outline' })}>
              <Download className="h-4 w-4" />
              Unduh rekap
            </Link>
          )
        }
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label="Total peserta" value={rows.length} hint="dalam cakupanmu" icon={Users} tone="primary" />
        <StatCard label="Sudah final" value={finalized.length} hint="penilaian terkunci" icon={CheckCircle2} tone="emerald" />
        <StatCard label="Belum final" value={rows.length - finalized.length} hint="draf atau belum dinilai" icon={ClipboardCheck} tone="amber" />
        <StatCard label="Rata-rata nilai" value={average} hint="dari penilaian final" icon={Award} tone="violet" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar penilaian</CardTitle>
          <CardDescription>Klik baris untuk melihat rincian komponen.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={[
              {
                key: 'participant',
                header: 'Peserta',
                mobileSpan: true,
                mobileOrder: 0,
                cell: (row: (typeof rows)[number]) => {
                  const student = data.users.find((item) => item.id === row.participant.userId)
                  return (
                    <div className="flex items-center gap-2.5">
                      <Avatar name={student?.name ?? 'Peserta'} size="sm" />
                      <div>
                        <p className="text-xs font-bold">{student?.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {row.participant.nis} · {row.participant.className}
                        </p>
                      </div>
                    </div>
                  )
                },
              },
              {
                key: 'stage',
                header: 'Tahap',
                mobileOrder: 1,
                cell: (row: (typeof rows)[number]) => (
                  <Badge variant="secondary">
                    {row.assessment
                      ? row.assessment.stage === 'final'
                        ? 'Akhir'
                        : 'Tengah'
                      : '—'}
                  </Badge>
                ),
              },
              {
                key: 'status',
                header: 'Status',
                mobileOrder: 2,
                cell: (row: (typeof rows)[number]) => (
                  <Badge
                    variant={
                      row.assessment?.status === 'final'
                        ? 'success'
                        : row.assessment
                          ? 'warning'
                          : 'secondary'
                    }
                  >
                    {row.assessment?.status === 'final'
                      ? 'Final'
                      : row.assessment
                        ? 'Draf'
                        : 'Belum dinilai'}
                  </Badge>
                ),
              },
              {
                key: 'score',
                header: 'Nilai akhir',
                mobileOrder: 3,
                cell: (row: (typeof rows)[number]) =>
                  row.assessment ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-extrabold">{row.final}</span>
                      <Badge variant="info">{gradeFromScore(row.final).letter}</Badge>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  ),
              },
            ]}
            rows={rows}
            keyFor={(row) => row.participant.id}
            onRowClick={(row) => setDetailId(row.participant.id)}
            emptyTitle="Belum ada peserta"
          />
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardContent className="flex items-start gap-3 p-4">
          <GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Guru pembimbing dapat memantau nilai dan mengunduh rekap. Perubahan komponen
            dan bobot penilaian dilakukan oleh admin melalui menu Pengaturan.
          </p>
        </CardContent>
      </Card>

      <Dialog open={Boolean(detailParticipant)} onOpenChange={(open) => !open && setDetailId(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Rincian penilaian</DialogTitle>
            <DialogDescription>
              {detailParticipant
                ? data.users.find((item) => item.id === detailParticipant.userId)?.name
                : ''}
            </DialogDescription>
          </DialogHeader>
          {detailParticipant ? (
            <div className="mt-3 space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-primary/[0.06] p-4">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Nilai akhir
                  </p>
                  <p className="mt-1 text-3xl font-extrabold">{detailFinal}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {detailGrade.letter} · {detailGrade.label}
                  </p>
                </div>
                <Badge variant={detailAssessment?.status === 'final' ? 'success' : 'warning'}>
                  {detailAssessment?.status === 'final' ? 'Final' : detailAssessment ? 'Draf' : 'Belum dinilai'}
                </Badge>
              </div>
              <div className="space-y-2.5">
                {components.map((component) => (
                  <div key={component.id}>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold">
                        {component.name}{' '}
                        <span className="text-muted-foreground">({component.weight}%)</span>
                      </span>
                      <span className="font-bold">{detailScores[component.id] ?? 0}</span>
                    </div>
                    <Progress value={detailScores[component.id] ?? 0} className="mt-1 h-1.5" />
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground">
                Nilai disiplin & kehadiran dihitung otomatis dari presensi.
              </p>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailId(null)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
