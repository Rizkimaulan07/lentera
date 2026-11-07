import * as React from 'react'
import {
  AlertCircle,
  CalendarDays,
  CalendarPlus,
  Check,
  CheckCircle2,
  Clock3,
  FileText,
  Info,
  Paperclip,
  Upload,
  X,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { LeaveBadge } from '@/components/shared/status-badge'
import { EmptyState } from '@/components/shared/empty-state'
import { useAuth } from '@/providers/auth-provider'
import { useData } from '@/providers/data-provider'
import { LEAVE_TYPE_LABELS } from '@/lib/constants'
import { APPROVAL_ONLY_NOTE, canApprove } from '@/lib/permissions'
import {
  participantsForSupervisor,
  participantsForTeacher,
} from '@/lib/analytics'
import {
  cn,
  formatDate,
  formatDateTime,
  getParticipantByUserId,
  todayKey,
} from '@/lib/utils'
import type { LeaveRequest, LeaveStatus, LeaveType } from '@/types'

const statusTabs: { value: 'all' | LeaveStatus; label: string }[] = [
  { value: 'all', label: 'Semua' },
  { value: 'pending', label: 'Menunggu' },
  { value: 'approved', label: 'Disetujui' },
  { value: 'rejected', label: 'Ditolak' },
]

export function LeavesPage() {
  const { user } = useAuth()
  const { data, submitLeave, decideLeave } = useData()
  const [statusFilter, setStatusFilter] = React.useState<'all' | LeaveStatus>('all')
  const [formOpen, setFormOpen] = React.useState(false)
  const [formError, setFormError] = React.useState('')
  const [form, setForm] = React.useState({
    type: 'sick' as LeaveType,
    startDate: todayKey(),
    endDate: todayKey(),
    reason: '',
    attachmentName: '',
  })
  const [decision, setDecision] = React.useState<{
    leave: LeaveRequest
    action: 'approved' | 'rejected'
  } | null>(null)
  const [decisionNote, setDecisionNote] = React.useState('')
  const [decisionError, setDecisionError] = React.useState('')

  if (!user) return null

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

  const baseLeaves = data.leaves
    .filter((leave) => scopeIds.includes(leave.participantId))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  const filtered = baseLeaves.filter(
    (leave) => statusFilter === 'all' || leave.status === statusFilter,
  )
  const pending = baseLeaves.filter((leave) => leave.status === 'pending')
  const approved = baseLeaves.filter((leave) => leave.status === 'approved')
  const rejected = baseLeaves.filter((leave) => leave.status === 'rejected')
  const canDecide = canApprove(user.role)

  const openForm = () => {
    setForm({
      type: 'sick',
      startDate: todayKey(),
      endDate: todayKey(),
      reason: '',
      attachmentName: '',
    })
    setFormError('')
    setFormOpen(true)
  }

  const handleFile = (file: File | undefined) => {
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setFormError('Ukuran lampiran maksimal 5 MB.')
      return
    }
    setForm((current) => ({ ...current, attachmentName: file.name }))
    setFormError('')
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!participant) return
    if (form.endDate < form.startDate) {
      setFormError('Tanggal selesai tidak boleh lebih awal dari tanggal mulai.')
      return
    }
    if (form.reason.trim().length < 10) {
      setFormError('Alasan minimal 10 karakter agar dapat ditinjau pembimbing.')
      return
    }
    submitLeave({
      participantId: participant.id,
      type: form.type,
      startDate: form.startDate,
      endDate: form.endDate,
      reason: form.reason.trim(),
      attachmentName: form.attachmentName || undefined,
    })
    toast.success('Pengajuan izin dikirim ke Koordinator PKL.')
    setFormOpen(false)
  }

  const openDecision = (leave: LeaveRequest, action: 'approved' | 'rejected') => {
    if (!canDecide) return
    setDecision({ leave, action })
    setDecisionNote('')
    setDecisionError('')
  }

  const submitDecision = () => {
    if (!decision || !canDecide) return
    if (decision.action === 'rejected' && !decisionNote.trim()) {
      setDecisionError('Catatan alasan penolakan wajib diisi.')
      return
    }
    decideLeave(
      decision.leave.id,
      decision.action,
      decisionNote.trim() || 'Disetujui oleh Koordinator PKL.',
      user.id,
    )
    toast.success(
      decision.action === 'approved'
        ? 'Izin disetujui dan presensi terkait diperbarui.'
        : 'Izin ditolak dan peserta mendapat notifikasi.',
    )
    setDecision(null)
  }

  const renderLeave = (leave: LeaveRequest) => {
    const owner = data.participants.find((item) => item.id === leave.participantId)
    const student = data.users.find((item) => item.id === owner?.userId)
    const division = data.divisions.find((item) => item.id === owner?.divisionId)
    return (
      <div key={leave.id} className="rounded-2xl border border-border/70 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <Avatar name={student?.name ?? 'Peserta'} size="md" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-bold">{student?.name}</p>
                <LeaveBadge status={leave.status} />
              </div>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                {owner?.nis} · {division?.name} · diajukan {formatDateTime(leave.createdAt)}
              </p>
            </div>
          </div>
          <Badge variant="secondary">{LEAVE_TYPE_LABELS[leave.type]}</Badge>
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-[auto_1fr]">
          <div className="flex items-center gap-2 rounded-xl bg-muted/40 px-3 py-2 text-[11px] font-semibold">
            <CalendarDays className="h-3.5 w-3.5 text-primary" />
            {formatDate(leave.startDate, 'd MMM yyyy')}
            {leave.startDate !== leave.endDate
              ? ` – ${formatDate(leave.endDate, 'd MMM yyyy')}`
              : ''}
          </div>
          <p className="rounded-xl bg-muted/20 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
            {leave.reason}
          </p>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {leave.attachmentName ? (
              <Badge variant="outline">
                <Paperclip className="h-3 w-3" />
                {leave.attachmentName}
              </Badge>
            ) : (
              <span className="text-[10px] text-muted-foreground">Tanpa lampiran</span>
            )}
            {leave.status !== 'pending' ? (
              <span className="text-[10px] text-muted-foreground">
                Diputuskan {leave.decidedBy ? data.users.find((item) => item.id === leave.decidedBy)?.name : 'sistem'}
                {leave.decisionNote ? ` · ${leave.decisionNote}` : ''}
              </span>
            ) : null}
          </div>

          {canDecide && leave.status === 'pending' ? (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="success"
                onClick={() => openDecision(leave, 'approved')}
              >
                <Check className="h-3.5 w-3.5" />
                Setujui
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-rose-600 hover:bg-rose-500/10 dark:text-rose-400"
                onClick={() => openDecision(leave, 'rejected')}
              >
                <X className="h-3.5 w-3.5" />
                Tolak
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        eyebrow="Perizinan"
        title={
          isParticipant
            ? 'Izin & sakit'
            : canDecide
              ? 'Pengesahan izin'
              : 'Pantau izin'
        }
        description={
          isParticipant
            ? 'Ajukan izin dengan lampiran bukti. Izin yang disetujui otomatis memperbarui presensi.'
            : canDecide
              ? 'Tinjau dan sahkan pengajuan izin peserta. Keputusan otomatis tersinkron dengan data presensi.'
              : `Pantau pengajuan izin peserta. ${APPROVAL_ONLY_NOTE}`
        }
        actions={
          isParticipant ? (
            <Button onClick={openForm}>
              <CalendarPlus className="h-4 w-4" />
              Ajukan izin
            </Button>
          ) : (
            <Badge variant={pending.length ? 'warning' : 'success'} className="h-8 px-3">
              <Clock3 className="h-3 w-3" />
              {pending.length} menunggu
            </Badge>
          )
        }
      />

      {!isParticipant && !canDecide ? (
        <div className="flex items-start gap-2.5 rounded-xl border border-sky-500/25 bg-sky-500/[0.06] px-3.5 py-3 text-[11px] leading-relaxed text-sky-800 dark:text-sky-300">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            Mode pantau. Pengesahan izin hanya dapat dilakukan oleh Koordinator
            PKL.
          </span>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard
          label="Total pengajuan"
          value={baseLeaves.length}
          hint="pada periode aktif"
          icon={FileText}
          tone="primary"
        />
        <StatCard
          label="Menunggu"
          value={pending.length}
          hint={pending.length ? 'perlu disahkan' : 'tidak ada antrean'}
          icon={Clock3}
          tone="amber"
        />
        <StatCard
          label="Disetujui"
          value={approved.length}
          hint="presensi otomatis disesuaikan"
          icon={CheckCircle2}
          tone="emerald"
        />
        <StatCard
          label="Ditolak"
          value={rejected.length}
          hint="peserta mendapat catatan"
          icon={XCircle}
          tone="rose"
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {statusTabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setStatusFilter(tab.value)}
            className={cn(
              'rounded-full border px-3.5 py-1.5 text-[11px] font-bold transition-colors',
              statusFilter === tab.value
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-muted-foreground hover:bg-muted',
            )}
          >
            {tab.label}
            <span className="ml-1.5 opacity-70">
              {tab.value === 'all'
                ? baseLeaves.length
                : baseLeaves.filter((leave) => leave.status === tab.value).length}
            </span>
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map(renderLeave)}
        {filtered.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="Belum ada pengajuan izin"
            description={
              isParticipant
                ? 'Klik tombol Ajukan izin untuk membuat pengajuan baru.'
                : 'Pengajuan dari peserta akan muncul di sini.'
            }
            action={
              isParticipant ? (
                <Button size="sm" onClick={openForm}>
                  <CalendarPlus className="h-3.5 w-3.5" />
                  Ajukan izin
                </Button>
              ) : undefined
            }
          />
        ) : null}
      </div>

      <Card className="border-dashed">
        <CardContent className="flex items-start gap-3 p-4">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-500" />
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Alur pengesahan: peserta mengajukan, Koordinator PKL meninjau dan
            mengesahkan, lalu sistem memperbarui presensi pada tanggal terkait.
            Pembimbing industri dan guru pembimbing dapat memantau status dan
            catatan keputusan.
          </p>
        </CardContent>
      </Card>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajukan izin</DialogTitle>
            <DialogDescription>
              Lengkapi data izin dan lampiran. Pengajuan akan dikirim ke
              Koordinator PKL.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="leave-type">Jenis izin</Label>
              <Select
                id="leave-type"
                value={form.type}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    type: event.target.value as LeaveType,
                  }))
                }
              >
                {(Object.keys(LEAVE_TYPE_LABELS) as LeaveType[]).map((type) => (
                  <option key={type} value={type}>
                    {LEAVE_TYPE_LABELS[type]}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="leave-start">Tanggal mulai</Label>
                <Input
                  id="leave-start"
                  type="date"
                  value={form.startDate}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      startDate: event.target.value,
                      endDate:
                        current.endDate < event.target.value
                          ? event.target.value
                          : current.endDate,
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="leave-end">Tanggal selesai</Label>
                <Input
                  id="leave-end"
                  type="date"
                  min={form.startDate}
                  value={form.endDate}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, endDate: event.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="leave-reason">Alasan</Label>
              <Textarea
                id="leave-reason"
                placeholder="Jelaskan alasan izin secara singkat dan jelas."
                value={form.reason}
                onChange={(event) =>
                  setForm((current) => ({ ...current, reason: event.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="leave-file">Lampiran bukti</Label>
              <label
                htmlFor="leave-file"
                className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-dashed border-border bg-muted/20 px-3.5 py-3 text-xs transition-colors hover:bg-muted/40"
              >
                <span className="flex min-w-0 items-center gap-2 text-muted-foreground">
                  <Upload className="h-4 w-4 shrink-0" />
                  <span className="truncate">
                    {form.attachmentName || 'Pilih foto surat / surat dokter (maks. 5 MB)'}
                  </span>
                </span>
                <span className="shrink-0 rounded-lg bg-card px-2 py-1 text-[10px] font-bold">
                  Pilih file
                </span>
              </label>
              <input
                id="leave-file"
                type="file"
                accept="image/*,.pdf"
                className="sr-only"
                onChange={(event) => handleFile(event.target.files?.[0])}
              />
            </div>
            {formError ? (
              <p className="flex items-start gap-2 rounded-lg bg-rose-500/10 px-3 py-2 text-[11px] font-medium text-rose-600 dark:text-rose-400">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {formError}
              </p>
            ) : null}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                Batal
              </Button>
              <Button type="submit">Kirim pengajuan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(decision)} onOpenChange={(open) => !open && setDecision(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {decision?.action === 'approved' ? 'Setujui pengajuan izin' : 'Tolak pengajuan izin'}
            </DialogTitle>
            <DialogDescription>
              {decision?.action === 'approved'
                ? 'Presensi pada tanggal terkait akan otomatis diperbarui menjadi Izin/Sakit.'
                : 'Berikan catatan alasan agar peserta memahami keputusanmu.'}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-3">
            <div className="rounded-xl bg-muted/40 p-3 text-[11px] leading-relaxed text-muted-foreground">
              <p className="font-bold text-foreground">
                {LEAVE_TYPE_LABELS[decision?.leave.type ?? 'other']} ·{' '}
                {decision ? formatDate(decision.leave.startDate, 'd MMM yyyy') : ''}
              </p>
              <p className="mt-1">{decision?.leave.reason}</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="decision-note">
                Catatan {decision?.action === 'rejected' ? '(wajib)' : '(opsional)'}
              </Label>
              <Textarea
                id="decision-note"
                placeholder={
                  decision?.action === 'approved'
                    ? 'Contoh: Disetujui, jangan lupa melengkapi jurnal.'
                    : 'Contoh: Lampiran tidak jelas dan tanggal berbenturan dengan agenda penting.'
                }
                value={decisionNote}
                onChange={(event) => setDecisionNote(event.target.value)}
              />
            </div>
            {decisionError ? (
              <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-[11px] font-medium text-rose-600 dark:text-rose-400">
                {decisionError}
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDecision(null)}>
              Batal
            </Button>
            <Button
              variant={decision?.action === 'approved' ? 'success' : 'destructive'}
              onClick={submitDecision}
            >
              {decision?.action === 'approved' ? (
                <>
                  <Check className="h-4 w-4" /> Setujui izin
                </>
              ) : (
                <>
                  <X className="h-4 w-4" /> Tolak izin
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
