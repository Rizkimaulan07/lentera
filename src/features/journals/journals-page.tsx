import * as React from 'react'
import {
  AlertCircle,
  BookOpenCheck,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FileImage,
  MessageSquare,
  PenLine,
  Plus,
  RotateCcw,
  Upload,
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
import { Textarea } from '@/components/ui/textarea'
import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { JournalBadge } from '@/components/shared/status-badge'
import { EmptyState } from '@/components/shared/empty-state'
import { useAuth } from '@/providers/auth-provider'
import { useData } from '@/providers/data-provider'
import {
  participantsForSupervisor,
  participantsForTeacher,
} from '@/lib/analytics'
import {
  cn,
  formatDate,
  formatDuration,
  getParticipantByUserId,
  todayKey,
} from '@/lib/utils'
import type { Journal, JournalStatus } from '@/types'

const tabs: { value: 'all' | JournalStatus; label: string }[] = [
  { value: 'all', label: 'Semua' },
  { value: 'pending', label: 'Menunggu' },
  { value: 'approved', label: 'Disetujui' },
  { value: 'revision', label: 'Perlu revisi' },
]

export function JournalsPage() {
  const { user } = useAuth()
  const { data, submitJournal, reviewJournal } = useData()
  const [statusFilter, setStatusFilter] = React.useState<'all' | JournalStatus>('all')
  const [formOpen, setFormOpen] = React.useState(false)
  const [formError, setFormError] = React.useState('')
  const [editing, setEditing] = React.useState<Journal | null>(null)
  const [form, setForm] = React.useState({
    date: todayKey(),
    activity: '',
    description: '',
    duration: 420,
    obstacle: '',
    photoName: '',
  })
  const [review, setReview] = React.useState<Journal | null>(null)
  const [reviewStatus, setReviewStatus] = React.useState<'approved' | 'revision'>('approved')
  const [reviewComment, setReviewComment] = React.useState('')
  const [reviewError, setReviewError] = React.useState('')

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
  const baseJournals = data.journals
    .filter((journal) => scopeIds.includes(journal.participantId))
    .sort((a, b) => b.date.localeCompare(a.date))
  const filtered = baseJournals.filter(
    (journal) => statusFilter === 'all' || journal.status === statusFilter,
  )
  const pending = baseJournals.filter((journal) => journal.status === 'pending')
  const approved = baseJournals.filter((journal) => journal.status === 'approved')
  const revision = baseJournals.filter((journal) => journal.status === 'revision')
  const todayJournal = isParticipant
    ? baseJournals.find((journal) => journal.date === todayKey())
    : undefined
  const canReview = user.role === 'supervisor' || user.role === 'admin'

  const openNew = () => {
    setEditing(null)
    setForm({
      date: todayKey(),
      activity: '',
      description: '',
      duration: 420,
      obstacle: '',
      photoName: '',
    })
    setFormError('')
    setFormOpen(true)
  }

  const openEdit = (journal: Journal) => {
    setEditing(journal)
    setForm({
      date: journal.date,
      activity: journal.activity,
      description: journal.description,
      duration: journal.duration,
      obstacle: journal.obstacle ?? '',
      photoName: journal.photoName ?? '',
    })
    setFormError('')
    setFormOpen(true)
  }

  const handleFile = (file: File | undefined) => {
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setFormError('Ukuran foto maksimal 5 MB.')
      return
    }
    setForm((current) => ({ ...current, photoName: file.name }))
    setFormError('')
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!participant) return
    if (form.date > todayKey()) {
      setFormError('Jurnal tidak dapat diisi untuk tanggal yang akan datang.')
      return
    }
    if (!form.activity.trim()) {
      setFormError('Nama kegiatan wajib diisi.')
      return
    }
    if (form.description.trim().length < 20) {
      setFormError('Uraian kegiatan minimal 20 karakter agar cukup jelas.')
      return
    }
    if (!form.duration || form.duration < 15) {
      setFormError('Durasi minimal 15 menit.')
      return
    }
    submitJournal({
      participantId: participant.id,
      date: form.date,
      activity: form.activity.trim(),
      description: form.description.trim(),
      duration: Number(form.duration),
      obstacle: form.obstacle.trim() || undefined,
      photoName: form.photoName || undefined,
    })
    toast.success(
      editing
        ? 'Perubahan jurnal dikirim ulang untuk validasi.'
        : 'Jurnal berhasil dikirim ke pembimbing industri.',
    )
    setFormOpen(false)
  }

  const openReview = (journal: Journal) => {
    setReview(journal)
    setReviewStatus('approved')
    setReviewComment('')
    setReviewError('')
  }

  const submitReview = () => {
    if (!review) return
    if (reviewStatus === 'revision' && !reviewComment.trim()) {
      setReviewError('Tuliskan catatan revisi agar peserta tahu bagian yang perlu diperbaiki.')
      return
    }
    reviewJournal(
      review.id,
      reviewStatus,
      reviewComment.trim() || 'Disetujui, terima kasih.',
      user.id,
    )
    toast.success(
      reviewStatus === 'approved'
        ? 'Jurnal disetujui dan peserta mendapat notifikasi.'
        : 'Permintaan revisi dikirim ke peserta.',
    )
    setReview(null)
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        eyebrow="Jurnal harian"
        title={isParticipant ? 'Jurnal kegiatan' : 'Validasi jurnal'}
        description={
          isParticipant
            ? 'Catat kegiatan harianmu selama PKL. Jurnal yang rapi memudahkan penyusunan laporan akhir.'
            : 'Tinjau jurnal peserta, beri persetujuan atau catatan revisi.'
        }
        actions={
          isParticipant ? (
            <Button onClick={openNew}>
              <Plus className="h-4 w-4" />
              Isi jurnal
            </Button>
          ) : (
            <Badge variant={pending.length ? 'warning' : 'success'} className="h-8 px-3">
              <ClipboardCheck className="h-3 w-3" />
              {pending.length} menunggu validasi
            </Badge>
          )
        }
      />

      {isParticipant && !todayJournal ? (
        <Card className="border-dashed border-amber-500/30 bg-amber-500/[0.05]">
          <CardContent className="flex flex-col items-start justify-between gap-3 p-4 sm:flex-row sm:items-center">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                <AlertCircle className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs font-bold">Jurnal hari ini belum diisi</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  Luangkan beberapa menit sebelum pulang untuk mencatat kegiatanmu.
                </p>
              </div>
            </div>
            <Button size="sm" onClick={openNew}>
              <PenLine className="h-3.5 w-3.5" />
              Isi sekarang
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label="Total jurnal" value={baseJournals.length} hint="pada periode aktif" icon={BookOpenCheck} tone="primary" />
        <StatCard label="Menunggu" value={pending.length} hint="belum divalidasi" icon={Clock3} tone="amber" />
        <StatCard label="Disetujui" value={approved.length} hint="sudah tervalidasi" icon={CheckCircle2} tone="emerald" />
        <StatCard label="Perlu revisi" value={revision.length} hint="menunggu perbaikan" icon={RotateCcw} tone="rose" />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {tabs.map((tab) => (
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
                ? baseJournals.length
                : baseJournals.filter((journal) => journal.status === tab.value).length}
            </span>
          </button>
        ))}
      </div>

      <div className="grid gap-3">
        {filtered.map((journal) => {
          const owner = data.participants.find((item) => item.id === journal.participantId)
          const student = data.users.find((item) => item.id === owner?.userId)
          const canEdit = isParticipant && journal.status !== 'approved'
          return (
            <Card key={journal.id} className="overflow-hidden">
              <CardContent className="p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    {!isParticipant ? (
                      <Avatar name={student?.name ?? 'Peserta'} size="md" />
                    ) : (
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <BookOpenCheck className="h-5 w-5" />
                      </span>
                    )}
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-bold">
                          {isParticipant ? journal.activity : student?.name}
                        </p>
                        <JournalBadge status={journal.status} />
                      </div>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        {formatDate(journal.date, 'EEEE, d MMMM yyyy')}
                        {!isParticipant ? ` · ${journal.activity}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      <Clock3 className="h-3 w-3" />
                      {formatDuration(journal.duration)}
                    </Badge>
                    {canEdit ? (
                      <Button variant="outline" size="sm" onClick={() => openEdit(journal)}>
                        <PenLine className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                    ) : null}
                    {canReview && journal.status === 'pending' ? (
                      <Button size="sm" onClick={() => openReview(journal)}>
                        <ClipboardCheck className="h-3.5 w-3.5" />
                        Tinjau
                      </Button>
                    ) : null}
                  </div>
                </div>

                <p className="mt-3 whitespace-pre-line text-[12px] leading-relaxed text-muted-foreground">
                  {journal.description}
                </p>

                {journal.obstacle ? (
                  <p className="mt-3 rounded-xl bg-amber-500/[0.06] px-3 py-2 text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
                    <span className="font-bold">Kendala: </span>
                    {journal.obstacle}
                  </p>
                ) : null}

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {journal.photoName ? (
                    <Badge variant="outline">
                      <FileImage className="h-3 w-3" />
                      {journal.photoName}
                    </Badge>
                  ) : null}
                  {journal.comment ? (
                    <div className="flex w-full items-start gap-2 rounded-xl border border-border/70 bg-muted/30 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground sm:w-auto">
                      <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                      <span>
                        <span className="font-bold text-foreground">Catatan pembimbing: </span>
                        {journal.comment}
                      </span>
                    </div>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          )
        })}
        {filtered.length === 0 ? (
          <EmptyState
            icon={BookOpenCheck}
            title="Belum ada jurnal"
            description={
              isParticipant
                ? 'Mulai catat kegiatan harianmu agar laporan PKL lebih mudah disusun.'
                : 'Jurnal peserta akan muncul di sini setelah dikirim.'
            }
            action={
              isParticipant ? (
                <Button size="sm" onClick={openNew}>
                  <Plus className="h-3.5 w-3.5" />
                  Isi jurnal
                </Button>
              ) : undefined
            }
          />
        ) : null}
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit jurnal' : 'Isi jurnal harian'}</DialogTitle>
            <DialogDescription>
              Tulis kegiatan yang kamu lakukan, durasi, dan kendala bila ada. Jurnal akan
              dikirim ke pembimbing untuk divalidasi.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="journal-date">Tanggal</Label>
                <Input
                  id="journal-date"
                  type="date"
                  max={todayKey()}
                  value={form.date}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, date: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="journal-duration">Durasi (menit)</Label>
                <Input
                  id="journal-duration"
                  type="number"
                  min={15}
                  step={15}
                  value={form.duration}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      duration: Number(event.target.value),
                    }))
                  }
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="journal-activity">Kegiatan</Label>
              <Input
                id="journal-activity"
                placeholder="Contoh: Pengembangan modul dashboard"
                value={form.activity}
                onChange={(event) =>
                  setForm((current) => ({ ...current, activity: event.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="journal-description">Uraian kegiatan</Label>
              <Textarea
                id="journal-description"
                placeholder="Jelaskan apa yang dikerjakan, tools yang dipakai, dan hasilnya."
                className="min-h-[120px]"
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="journal-obstacle">Kendala (opsional)</Label>
              <Textarea
                id="journal-obstacle"
                placeholder="Contoh: Data API belum tersedia, sementara memakai data dummy."
                className="min-h-[70px]"
                value={form.obstacle}
                onChange={(event) =>
                  setForm((current) => ({ ...current, obstacle: event.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="journal-photo">Foto dokumentasi (opsional)</Label>
              <label
                htmlFor="journal-photo"
                className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-dashed border-border bg-muted/20 px-3.5 py-3 text-xs transition-colors hover:bg-muted/40"
              >
                <span className="flex min-w-0 items-center gap-2 text-muted-foreground">
                  <Upload className="h-4 w-4 shrink-0" />
                  <span className="truncate">
                    {form.photoName || 'Pilih foto dokumentasi (maks. 5 MB)'}
                  </span>
                </span>
                <span className="shrink-0 rounded-lg bg-card px-2 py-1 text-[10px] font-bold">
                  Pilih foto
                </span>
              </label>
              <input
                id="journal-photo"
                type="file"
                accept="image/*"
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
              <Button type="submit">{editing ? 'Simpan perubahan' : 'Kirim jurnal'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(review)} onOpenChange={(open) => !open && setReview(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tinjau jurnal</DialogTitle>
            <DialogDescription>
              Beri persetujuan atau minta revisi dengan catatan yang jelas.
            </DialogDescription>
          </DialogHeader>
          {review ? (
            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
                <p className="text-xs font-bold">{review.activity}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  {formatDate(review.date, 'EEEE, d MMMM yyyy')} · {formatDuration(review.duration)}
                </p>
                <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                  {review.description}
                </p>
                {review.obstacle ? (
                  <p className="mt-2 text-[10px] leading-relaxed text-amber-700 dark:text-amber-300">
                    Kendala: {review.obstacle}
                  </p>
                ) : null}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setReviewStatus('approved')}
                  className={cn(
                    'flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-bold transition-colors',
                    reviewStatus === 'approved'
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                      : 'border-border text-muted-foreground hover:bg-muted',
                  )}
                >
                  <Check className="h-4 w-4" />
                  Setujui
                </button>
                <button
                  type="button"
                  onClick={() => setReviewStatus('revision')}
                  className={cn(
                    'flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-bold transition-colors',
                    reviewStatus === 'revision'
                      ? 'border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300'
                      : 'border-border text-muted-foreground hover:bg-muted',
                  )}
                >
                  <RotateCcw className="h-4 w-4" />
                  Minta revisi
                </button>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="review-comment">
                  Catatan {reviewStatus === 'revision' ? '(wajib)' : '(opsional)'}
                </Label>
                <Textarea
                  id="review-comment"
                  placeholder={
                    reviewStatus === 'revision'
                      ? 'Tuliskan bagian yang perlu diperbaiki...'
                      : 'Contoh: Dokumentasi sudah baik, lanjutkan.'
                  }
                  value={reviewComment}
                  onChange={(event) => setReviewComment(event.target.value)}
                />
              </div>
              {reviewError ? (
                <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-[11px] font-medium text-rose-600 dark:text-rose-400">
                  {reviewError}
                </p>
              ) : null}
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReview(null)}>
              Batal
            </Button>
            <Button
              variant={reviewStatus === 'approved' ? 'success' : 'destructive'}
              onClick={submitReview}
            >
              {reviewStatus === 'approved' ? 'Setujui jurnal' : 'Kirim revisi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
