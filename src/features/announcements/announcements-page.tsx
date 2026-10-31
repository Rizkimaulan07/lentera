import * as React from 'react'
import {
  CalendarDays,
  GraduationCap,
  Info,
  Megaphone,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
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
import { EmptyState } from '@/components/shared/empty-state'
import { useAuth } from '@/providers/auth-provider'
import { useData } from '@/providers/data-provider'
import { roleLabels, timeAgo } from '@/lib/utils'
import type { AnnouncementAudience } from '@/types'

const audienceLabels: Record<AnnouncementAudience, string> = {
  all: 'Semua pengguna',
  admin: 'Admin PKL',
  supervisor: 'Pembimbing industri',
  teacher: 'Guru pembimbing',
  participant: 'Peserta PKL',
}

const audienceIcons: Record<AnnouncementAudience, typeof Users> = {
  all: Users,
  admin: Sparkles,
  supervisor: ShieldCheck,
  teacher: GraduationCap,
  participant: Users,
}

const audienceTone: Record<AnnouncementAudience, string> = {
  all: 'bg-primary/10 text-primary',
  admin: 'bg-amber-500/12 text-amber-600 dark:text-amber-400',
  supervisor: 'bg-sky-500/12 text-sky-600 dark:text-sky-400',
  teacher: 'bg-violet-500/12 text-violet-600 dark:text-violet-400',
  participant: 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400',
}

export function AnnouncementsPage() {
  const { user } = useAuth()
  const { data, saveAnnouncement, deleteAnnouncement } = useData()
  const [query, setQuery] = React.useState('')
  const [audienceFilter, setAudienceFilter] = React.useState<'any' | AnnouncementAudience>('any')
  const [formOpen, setFormOpen] = React.useState(false)
  const [deleteId, setDeleteId] = React.useState<string | null>(null)
  const [form, setForm] = React.useState({
    title: '',
    body: '',
    audience: 'all' as AnnouncementAudience,
  })

  if (!user) return null

  const visible = data.announcements
    .filter(
      (item) =>
        user.role === 'admin' ||
        item.audience === 'all' ||
        item.audience === user.role,
    )
    .filter((item) => {
      const matchesQuery =
        !query.trim() ||
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.body.toLowerCase().includes(query.toLowerCase())
      const matchesAudience =
        audienceFilter === 'any' || item.audience === audienceFilter
      return matchesQuery && matchesAudience
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  const deleteTarget = data.announcements.find((item) => item.id === deleteId)
  const forMe = data.announcements.filter(
    (item) => item.audience === 'all' || item.audience === user.role,
  ).length

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.title.trim() || !form.body.trim()) {
      toast.error('Judul dan isi pengumuman wajib diisi.')
      return
    }
    saveAnnouncement({
      title: form.title.trim(),
      body: form.body.trim(),
      audience: form.audience,
      createdBy: user.id,
    })
    toast.success('Pengumuman berhasil dipublikasikan.')
    setForm({ title: '', body: '', audience: 'all' })
    setFormOpen(false)
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    deleteAnnouncement(deleteTarget.id, user.id)
    toast.success('Pengumuman dihapus.')
    setDeleteId(null)
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        eyebrow="Informasi PKL"
        title="Pengumuman"
        description="Informasi penting seputar presensi, jurnal, penilaian, dan agenda PKL di PT Len Industri."
        actions={
          user.role === 'admin' ? (
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4" />
              Buat pengumuman
            </Button>
          ) : (
            <Badge variant="secondary" className="h-8 px-3">
              <Megaphone className="h-3 w-3" />
              {forMe} pengumuman untukmu
            </Badge>
          )
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Megaphone className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xl font-extrabold">{data.announcements.length}</p>
              <p className="text-[10px] text-muted-foreground">Total pengumuman</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/12 text-emerald-600 dark:text-emerald-400">
              <Users className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xl font-extrabold">
                {data.announcements.filter((item) => item.audience === 'all').length}
              </p>
              <p className="text-[10px] text-muted-foreground">Untuk semua pengguna</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/14 text-amber-600 dark:text-amber-400">
              <CalendarDays className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xl font-extrabold">{forMe}</p>
              <p className="text-[10px] text-muted-foreground">Relevan untuk peranmu</p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <CardContent className="grid gap-3 p-4 sm:grid-cols-[1fr_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari pengumuman..."
              className="pl-10"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          {user.role === 'admin' ? (
            <Select
              value={audienceFilter}
              onChange={(event) =>
                setAudienceFilter(event.target.value as 'any' | AnnouncementAudience)
              }
              className="sm:w-[220px]"
            >
              <option value="any">Semua audiens</option>
              {(Object.keys(audienceLabels) as AnnouncementAudience[])
                .filter((value) => value !== 'all')
                .map((value) => (
                  <option key={value} value={value}>
                    {audienceLabels[value]}
                  </option>
                ))}
            </Select>
          ) : null}
        </CardContent>
      </Card>

      {visible.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="Belum ada pengumuman"
          description={
            query
              ? 'Tidak ada pengumuman yang cocok dengan pencarianmu.'
              : 'Pengumuman dari admin PKL akan tampil di sini.'
          }
        />
      ) : (
        <div className="space-y-3">
          {visible.map((announcement, index) => {
            const Icon = audienceIcons[announcement.audience]
            const author = data.users.find((item) => item.id === announcement.createdBy)
            return (
              <Card
                key={announcement.id}
                className={index === 0 ? 'border-primary/25 bg-primary/[0.025]' : ''}
              >
                <CardContent className="p-5 sm:p-6">
                  <div className="flex items-start gap-4">
                    <span
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${audienceTone[announcement.audience]}`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {index === 0 ? <Badge variant="default">Terbaru</Badge> : null}
                        <Badge variant="secondary">
                          {audienceLabels[announcement.audience]}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {timeAgo(announcement.createdAt)}
                        </span>
                      </div>
                      <h2 className="mt-2 text-base font-extrabold tracking-tight sm:text-lg">
                        {announcement.title}
                      </h2>
                      <p className="mt-2 whitespace-pre-line text-[13px] leading-relaxed text-muted-foreground">
                        {announcement.body}
                      </p>
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3">
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted font-bold">
                            {author?.name.charAt(0)}
                          </span>
                          <span className="font-semibold">{author?.name ?? 'Admin PKL'}</span>
                          <span>·</span>
                          <span>{roleLabels[author?.role ?? 'admin']}</span>
                        </div>
                        {user.role === 'admin' ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-rose-600 hover:bg-rose-500/10 hover:text-rose-700 dark:text-rose-400"
                            onClick={() => setDeleteId(announcement.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Hapus
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Card className="border-dashed">
        <CardContent className="flex items-start gap-3 p-4">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Pengumuman yang dipublikasikan akan mengirim notifikasi ke pengguna sesuai
            audiens yang dipilih. Pastikan informasi sudah benar sebelum dipublikasikan.
          </p>
        </CardContent>
      </Card>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Buat pengumuman</DialogTitle>
            <DialogDescription>
              Informasi akan tampil di halaman pengumuman dan dikirim sebagai notifikasi.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="announcement-title">Judul</Label>
              <Input
                id="announcement-title"
                placeholder="Contoh: Perubahan jam presensi"
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({ ...current, title: event.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="announcement-audience">Audiens</Label>
              <Select
                id="announcement-audience"
                value={form.audience}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    audience: event.target.value as AnnouncementAudience,
                  }))
                }
              >
                {(Object.keys(audienceLabels) as AnnouncementAudience[]).map((value) => (
                  <option key={value} value={value}>
                    {audienceLabels[value]}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="announcement-body">Isi pengumuman</Label>
              <Textarea
                id="announcement-body"
                rows={6}
                placeholder="Tuliskan informasi lengkap, waktu, dan tindakan yang perlu dilakukan..."
                value={form.body}
                onChange={(event) =>
                  setForm((current) => ({ ...current, body: event.target.value }))
                }
                required
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setFormOpen(false)}>
                Batal
              </Button>
              <Button type="submit">
                <Megaphone className="h-4 w-4" />
                Publikasikan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus pengumuman?</DialogTitle>
            <DialogDescription>
              “{deleteTarget?.title}” akan dihapus permanen dari daftar pengumuman.
              Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" />
              Hapus pengumuman
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
