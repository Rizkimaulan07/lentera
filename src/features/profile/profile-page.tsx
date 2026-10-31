import * as React from 'react'
import {
  BadgeCheck,
  Building2,
  CalendarDays,
  GraduationCap,
  Info,
  KeyRound,
  Mail,
  Moon,
  Phone,
  Save,
  School,
  ShieldCheck,
  Sun,
  UserRound,
} from 'lucide-react'
import { toast } from 'sonner'
import { Avatar } from '@/components/ui/avatar'
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
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { PageHeader } from '@/components/shared/page-header'
import { useAuth } from '@/providers/auth-provider'
import { useData } from '@/providers/data-provider'
import { useTheme } from '@/providers/theme-provider'
import { cn, formatDate, getParticipantByUserId, roleLabels } from '@/lib/utils'

export function ProfilePage() {
  const { user } = useAuth()
  const { data, updateProfile, changePassword } = useData()
  const { theme, toggleTheme } = useTheme()
  const [profileForm, setProfileForm] = React.useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
    photo: user?.photo ?? '',
  })
  const [passwordForm, setPasswordForm] = React.useState({
    current: '',
    next: '',
    confirm: '',
  })

  if (!user) return null

  const participant = getParticipantByUserId(data.participants, user.id)
  const school = data.schools.find(
    (item) => item.id === (participant?.schoolId ?? user.schoolId),
  )
  const division = data.divisions.find(
    (item) => item.id === (participant?.divisionId ?? user.divisionId),
  )
  const period = data.periods.find((item) => item.id === participant?.periodId)
  const supervisor = data.users.find((item) => item.id === participant?.supervisorId)
  const teacher = data.users.find((item) => item.id === participant?.teacherId)

  const handleProfile = (event: React.FormEvent) => {
    event.preventDefault()
    if (!profileForm.name.trim() || !profileForm.email.trim()) {
      toast.error('Nama dan email wajib diisi.')
      return
    }
    updateProfile(user.id, {
      name: profileForm.name.trim(),
      email: profileForm.email.trim(),
      phone: profileForm.phone.trim(),
      photo: profileForm.photo.trim() || undefined,
    })
    toast.success('Profil berhasil diperbarui.')
  }

  const handlePassword = (event: React.FormEvent) => {
    event.preventDefault()
    if (passwordForm.next !== passwordForm.confirm) {
      toast.error('Konfirmasi kata sandi baru belum sama.')
      return
    }
    const result = changePassword(
      user.id,
      passwordForm.current,
      passwordForm.next,
    )
    if (!result.ok) {
      toast.error(result.message)
      return
    }
    toast.success(result.message)
    setPasswordForm({ current: '', next: '', confirm: '' })
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        eyebrow="Akun"
        title="Profil saya"
        description="Kelola informasi akun, keamanan, dan preferensi tampilan LENTERA."
      />

      <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="space-y-4">
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-[#4a040b] via-[#8b0e1a] to-[#c8102e] text-white">
            <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-rose-300/25 blur-3xl" />
            <CardContent className="relative p-6">
              <div className="flex items-center gap-4">
                <Avatar
                  name={user.name}
                  src={user.photo}
                  size="xl"
                  className="ring-4 ring-white/20"
                />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="border-white/15 bg-white/10 text-white">
                      {roleLabels[user.role]}
                    </Badge>
                    {user.active ? (
                      <Badge className="border-emerald-300/25 bg-emerald-300/15 text-emerald-100">
                        Aktif
                      </Badge>
                    ) : null}
                  </div>
                  <h2 className="mt-2 truncate text-xl font-extrabold">{user.name}</h2>
                  <p className="truncate text-xs text-slate-300">@{user.username}</p>
                </div>
              </div>
              <div className="mt-5 grid gap-2 border-t border-white/10 pt-4 text-[11px] text-slate-300">
                <span className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-rose-200" />
                  <span className="truncate">{user.email}</span>
                </span>
                <span className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-rose-200" />
                  {user.phone}
                </span>
                <span className="flex items-center gap-2">
                  <CalendarDays className="h-3.5 w-3.5 text-rose-200" />
                  Bergabung {formatDate(user.createdAt, 'MMMM yyyy')}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Data penempatan</CardTitle>
              <CardDescription>Informasi resmi yang terhubung dengan akunmu.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-[11px]">
              {participant ? (
                <>
                  <div className="flex items-start gap-2.5">
                    <GraduationCap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-muted-foreground">NIS</p>
                      <p className="font-semibold">{participant.nis}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <School className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Sekolah</p>
                      <p className="font-semibold">{school?.name ?? '—'}</p>
                      <p className="text-[10px] text-muted-foreground">{participant.major} · {participant.className}</p>
                    </div>
                  </div>
                </>
              ) : null}
              <div className="flex items-start gap-2.5">
                <Building2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Divisi</p>
                  <p className="font-semibold">{division?.name ?? '—'}</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <BadgeCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Jabatan / posisi</p>
                  <p className="font-semibold">{user.position ?? '—'}</p>
                </div>
              </div>
              {participant ? (
                <>
                  <div className="flex items-start gap-2.5">
                    <UserRound className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Pembimbing industri</p>
                      <p className="font-semibold">{supervisor?.name ?? '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Guru pembimbing</p>
                      <p className="font-semibold">{teacher?.name ?? '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CalendarDays className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Periode PKL</p>
                      <p className="font-semibold">{period?.name ?? '—'}</p>
                    </div>
                  </div>
                </>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informasi profil</CardTitle>
              <CardDescription>
                Perubahan nama dan kontak langsung tersimpan di perangkat ini.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfile} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="profile-name">Nama lengkap</Label>
                    <Input
                      id="profile-name"
                      value={profileForm.name}
                      onChange={(event) =>
                        setProfileForm((current) => ({ ...current, name: event.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="profile-email">Email</Label>
                    <Input
                      id="profile-email"
                      type="email"
                      value={profileForm.email}
                      onChange={(event) =>
                        setProfileForm((current) => ({ ...current, email: event.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="profile-phone">Nomor telepon</Label>
                    <Input
                      id="profile-phone"
                      value={profileForm.phone}
                      onChange={(event) =>
                        setProfileForm((current) => ({ ...current, phone: event.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="profile-photo">URL foto profil (opsional)</Label>
                    <Input
                      id="profile-photo"
                      placeholder="https://..."
                      value={profileForm.photo}
                      onChange={(event) =>
                        setProfileForm((current) => ({ ...current, photo: event.target.value }))
                      }
                    />
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-4">
                  <p className="text-[10px] text-muted-foreground">
                    Username <span className="font-mono font-bold">@{user.username}</span> tidak
                    dapat diubah.
                  </p>
                  <Button type="submit">
                    <Save className="h-4 w-4" />
                    Simpan profil
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Keamanan akun</CardTitle>
              <CardDescription>
                Gunakan kata sandi minimal 6 karakter yang tidak dipakai di layanan lain.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePassword} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="current-password">Kata sandi saat ini</Label>
                  <Input
                    id="current-password"
                    type="password"
                    autoComplete="current-password"
                    value={passwordForm.current}
                    onChange={(event) =>
                      setPasswordForm((current) => ({
                        ...current,
                        current: event.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="new-password">Kata sandi baru</Label>
                    <Input
                      id="new-password"
                      type="password"
                      autoComplete="new-password"
                      value={passwordForm.next}
                      onChange={(event) =>
                        setPasswordForm((current) => ({
                          ...current,
                          next: event.target.value,
                        }))
                      }
                      minLength={6}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="confirm-password">Ulangi kata sandi baru</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      autoComplete="new-password"
                      value={passwordForm.confirm}
                      onChange={(event) =>
                        setPasswordForm((current) => ({
                          ...current,
                          confirm: event.target.value,
                        }))
                      }
                      minLength={6}
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end border-t border-border/70 pt-4">
                  <Button type="submit" variant="outline">
                    <KeyRound className="h-4 w-4" />
                    Perbarui kata sandi
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tampilan</CardTitle>
              <CardDescription>Sesuaikan tema aplikasi dengan kenyamananmu.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-4 rounded-xl border border-border/70 p-4">
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-xl',
                      theme === 'dark'
                        ? 'bg-indigo-500/12 text-indigo-400'
                        : 'bg-amber-500/14 text-amber-600',
                    )}
                  >
                    {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                  </span>
                  <div>
                    <p className="text-xs font-bold">
                      Mode {theme === 'dark' ? 'gelap' : 'terang'}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {theme === 'dark'
                        ? 'Nyaman digunakan pada kondisi cahaya rendah.'
                        : 'Tampilan cerah untuk penggunaan siang hari.'}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={theme === 'dark'}
                  onCheckedChange={() => toggleTheme()}
                  label="Mode gelap"
                />
              </div>
              <div className="mt-3 flex items-start gap-2.5 rounded-xl bg-muted/40 p-3 text-[10px] leading-relaxed text-muted-foreground">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                Preferensi tema tersimpan di perangkat ini dan diterapkan pada kunjungan
                berikutnya.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
