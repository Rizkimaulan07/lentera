import * as React from 'react'
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  GraduationCap,
  Info,
  Mail,
  Phone,
  Power,
  PowerOff,
  Search,
  ShieldCheck,
  UserPlus,
  Users,
  XCircle,
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
import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { DataTable } from '@/components/shared/data-table'
import { useAuth } from '@/providers/auth-provider'
import { useData } from '@/providers/data-provider'
import { DEMO_PASSWORD } from '@/lib/constants'
import { roleLabels } from '@/lib/utils'
import type { Role, User } from '@/types'

const roleVariant: Record<Role, 'default' | 'info' | 'success' | 'warning'> = {
  admin: 'warning',
  supervisor: 'info',
  teacher: 'success',
  participant: 'default',
}

interface UserForm {
  role: Role
  name: string
  username: string
  email: string
  phone: string
  password: string
  position: string
  schoolId: string
  divisionId: string
  nis: string
  major: string
  className: string
  supervisorId: string
  teacherId: string
  periodId: string
}

function emptyForm(role: Role, periodId: string): UserForm {
  return {
    role,
    name: '',
    username: '',
    email: '',
    phone: '',
    password: DEMO_PASSWORD,
    position: '',
    schoolId: '',
    divisionId: '',
    nis: '',
    major: '',
    className: '',
    supervisorId: '',
    teacherId: '',
    periodId,
  }
}

export function AdminUsersPage() {
  const { user } = useAuth()
  const { data, addUser, toggleUserActive } = useData()
  const [query, setQuery] = React.useState('')
  const [roleFilter, setRoleFilter] = React.useState<'all' | Role>('all')
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'active' | 'inactive'>('all')
  const [formOpen, setFormOpen] = React.useState(false)
  const [form, setForm] = React.useState<UserForm>(() =>
    emptyForm('participant', data.periods.find((item) => item.active)?.id ?? ''),
  )
  const [formError, setFormError] = React.useState('')
  const [confirmUser, setConfirmUser] = React.useState<User | null>(null)

  if (!user) return null

  const activePeriod = data.periods.find((item) => item.active)
  const supervisors = data.users.filter(
    (item) => item.role === 'supervisor' && item.active,
  )
  const teachers = data.users.filter((item) => item.role === 'teacher' && item.active)

  const filtered = data.users
    .filter((item) => {
      const participant = data.participants.find((p) => p.userId === item.id)
      const matchesQuery =
        !query.trim() ||
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        item.username.toLowerCase().includes(query.toLowerCase()) ||
        item.email.toLowerCase().includes(query.toLowerCase()) ||
        participant?.nis.toLowerCase().includes(query.toLowerCase())
      return (
        matchesQuery &&
        (roleFilter === 'all' || item.role === roleFilter) &&
        (statusFilter === 'all' ||
          (statusFilter === 'active' ? item.active : !item.active))
      )
    })
    .sort((a, b) => a.role.localeCompare(b.role) || a.name.localeCompare(b.name))

  const participants = data.users.filter((item) => item.role === 'participant')
  const mentors = data.users.filter(
    (item) => item.role === 'supervisor' || item.role === 'teacher',
  )
  const inactive = data.users.filter((item) => !item.active)

  const openCreate = () => {
    setForm(emptyForm('participant', activePeriod?.id ?? ''))
    setFormError('')
    setFormOpen(true)
  }

  const update = (key: keyof UserForm, value: string) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    setFormError('')
    if (!form.name.trim() || !form.username.trim() || !form.email.trim()) {
      setFormError('Nama, username, dan email wajib diisi.')
      return
    }
    if (form.role === 'participant') {
      if (
        !form.nis.trim() ||
        !form.schoolId ||
        !form.major.trim() ||
        !form.className.trim() ||
        !form.divisionId ||
        !form.supervisorId ||
        !form.teacherId
      ) {
        setFormError('Lengkapi seluruh data penempatan peserta.')
        return
      }
    }
    const result = addUser({
      actorId: user.id,
      name: form.name.trim(),
      username: form.username.trim().toLowerCase(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      password: form.password || DEMO_PASSWORD,
      role: form.role,
      position: form.position.trim() || undefined,
      schoolId: form.schoolId || undefined,
      divisionId: form.divisionId || undefined,
      nis: form.nis.trim() || undefined,
      major: form.major.trim() || undefined,
      className: form.className.trim() || undefined,
      supervisorId: form.supervisorId || undefined,
      teacherId: form.teacherId || undefined,
      periodId: form.periodId || undefined,
    })
    if (!result.ok) {
      setFormError(result.message)
      return
    }
    toast.success(result.message)
    setFormOpen(false)
  }

  const handleToggle = () => {
    if (!confirmUser) return
    if (confirmUser.id === user.id) {
      toast.error('Kamu tidak dapat menonaktifkan akun sendiri.')
      setConfirmUser(null)
      return
    }
    toggleUserActive(confirmUser.id, user.id)
    toast.success(
      confirmUser.active
        ? `Akun ${confirmUser.name} dinonaktifkan.`
        : `Akun ${confirmUser.name} diaktifkan kembali.`,
    )
    setConfirmUser(null)
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        eyebrow="Administrasi"
        title="Manajemen pengguna"
        description="Kelola akun peserta, pembimbing industri, guru pembimbing, dan admin PKL."
        actions={
          <Button onClick={openCreate}>
            <UserPlus className="h-4 w-4" />
            Tambah pengguna
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard
          label="Total pengguna"
          value={data.users.length}
          hint={`${data.users.filter((item) => item.active).length} akun aktif`}
          icon={Users}
          tone="primary"
        />
        <StatCard
          label="Peserta PKL"
          value={participants.length}
          hint="akun peserta terdaftar"
          icon={GraduationCap}
          tone="emerald"
        />
        <StatCard
          label="Pembimbing & guru"
          value={mentors.length}
          hint="pendamping peserta"
          icon={ShieldCheck}
          tone="sky"
        />
        <StatCard
          label="Akun nonaktif"
          value={inactive.length}
          hint="tidak dapat masuk"
          icon={XCircle}
          tone="rose"
        />
      </div>

      <Card>
        <CardContent className="grid gap-3 p-4 sm:grid-cols-[1fr_auto_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari nama, email, atau NIS..."
              className="pl-10"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <Select
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value as 'all' | Role)}
            className="sm:w-[190px]"
          >
            <option value="all">Semua peran</option>
            <option value="participant">Peserta PKL</option>
            <option value="supervisor">Pembimbing industri</option>
            <option value="teacher">Guru pembimbing</option>
            <option value="admin">Admin PKL</option>
          </Select>
          <Select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as 'all' | 'active' | 'inactive')
            }
            className="sm:w-[160px]"
          >
            <option value="all">Semua status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daftar pengguna</CardTitle>
          <CardDescription>
            {filtered.length} dari {data.users.length} pengguna ditampilkan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable<User>
            columns={[
              {
                key: 'user',
                header: 'Pengguna',
                mobileSpan: true,
                mobileOrder: 0,
                cell: (item) => {
                  const participant = data.participants.find((p) => p.userId === item.id)
                  return (
                    <div className="flex items-center gap-2.5">
                      <Avatar name={item.name} src={item.photo} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold">{item.name}</p>
                        <p className="truncate text-[10px] text-muted-foreground">
                          @{item.username}
                          {participant ? ` · ${participant.nis}` : ''}
                        </p>
                      </div>
                    </div>
                  )
                },
              },
              {
                key: 'role',
                header: 'Peran',
                mobileOrder: 1,
                cell: (item) => (
                  <Badge variant={roleVariant[item.role]}>{roleLabels[item.role]}</Badge>
                ),
              },
              {
                key: 'affiliation',
                header: 'Penempatan',
                mobileSpan: true,
                mobileOrder: 3,
                cell: (item) => {
                  const participant = data.participants.find((p) => p.userId === item.id)
                  const school = data.schools.find(
                    (s) => s.id === (participant?.schoolId ?? item.schoolId),
                  )
                  const division = data.divisions.find(
                    (d) => d.id === (participant?.divisionId ?? item.divisionId),
                  )
                  return (
                    <div>
                      <p className="text-[11px] font-semibold">
                        {division?.name ?? school?.name ?? item.position ?? '—'}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {participant
                          ? `${school?.name ?? '—'} · ${participant.className}`
                          : school?.name ?? 'PT Len Industri (Persero)'}
                      </p>
                    </div>
                  )
                },
              },
              {
                key: 'contact',
                header: 'Kontak',
                mobileSpan: true,
                mobileOrder: 4,
                cell: (item) => (
                  <div className="space-y-0.5 text-[10px] text-muted-foreground">
                    <p className="flex items-center gap-1.5">
                      <Mail className="h-3 w-3" />
                      {item.email}
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Phone className="h-3 w-3" />
                      {item.phone}
                    </p>
                  </div>
                ),
              },
              {
                key: 'status',
                header: 'Status',
                mobileOrder: 2,
                cell: (item) =>
                  item.active ? (
                    <Badge variant="success">
                      <CheckCircle2 className="h-3 w-3" />
                      Aktif
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <XCircle className="h-3 w-3" />
                      Nonaktif
                    </Badge>
                  ),
              },
              {
                key: 'action',
                header: '',
                className: 'text-right',
                mobileSpan: true,
                mobileOrder: 5,
                mobileClassName: 'flex justify-end border-t border-border/60 pt-3',
                cell: (item) => (
                  <Button
                    variant="ghost"
                    size="sm"
                    className={
                      item.active
                        ? 'text-rose-600 hover:bg-rose-500/10 hover:text-rose-700 dark:text-rose-400'
                        : 'text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-700 dark:text-emerald-400'
                    }
                    onClick={() => setConfirmUser(item)}
                    disabled={item.id === user.id}
                    title={item.id === user.id ? 'Tidak dapat menonaktifkan akun sendiri' : undefined}
                  >
                    {item.active ? (
                      <>
                        <PowerOff className="h-3.5 w-3.5" />
                        Nonaktifkan
                      </>
                    ) : (
                      <>
                        <Power className="h-3.5 w-3.5" />
                        Aktifkan
                      </>
                    )}
                  </Button>
                ),
              },
            ]}
            rows={filtered}
            keyFor={(item) => item.id}
            emptyTitle="Pengguna tidak ditemukan"
            emptyDescription="Coba ubah kata kunci atau filter peran dan status."
          />
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardContent className="flex items-start gap-3 p-4">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Akun baru otomatis mendapat notifikasi selamat datang. Akun nonaktif tetap
            tersimpan beserta riwayat presensi dan jurnalnya, tetapi tidak dapat masuk ke
            aplikasi.
          </p>
        </CardContent>
      </Card>

      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setFormError('')
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Tambah pengguna baru</DialogTitle>
            <DialogDescription>
              Buat akun dan hubungkan peserta dengan pembimbing, sekolah, serta periode PKL.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="new-role">Peran pengguna</Label>
              <Select
                id="new-role"
                value={form.role}
                onChange={(event) => {
                  const role = event.target.value as Role
                  setForm((current) => ({ ...current, role }))
                }}
              >
                <option value="participant">Peserta PKL</option>
                <option value="supervisor">Pembimbing industri</option>
                <option value="teacher">Guru pembimbing</option>
                <option value="admin">Admin PKL</option>
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="new-name">Nama lengkap</Label>
                <Input
                  id="new-name"
                  placeholder="Nama sesuai dokumen resmi"
                  value={form.name}
                  onChange={(event) => update('name', event.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-username">Username</Label>
                <Input
                  id="new-username"
                  placeholder="contoh: nabila"
                  value={form.username}
                  onChange={(event) => update('username', event.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-email">Email</Label>
                <Input
                  id="new-email"
                  type="email"
                  placeholder="nama@sekolah.sch.id"
                  value={form.email}
                  onChange={(event) => update('email', event.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-phone">Nomor telepon</Label>
                <Input
                  id="new-phone"
                  placeholder="0812-xxxx-xxxx"
                  value={form.phone}
                  onChange={(event) => update('phone', event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-password">Kata sandi awal</Label>
                <Input
                  id="new-password"
                  value={form.password}
                  onChange={(event) => update('password', event.target.value)}
                  minLength={6}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="new-position">Jabatan / posisi</Label>
                <Input
                  id="new-position"
                  placeholder={
                    form.role === 'participant'
                      ? 'Opsional untuk peserta'
                      : 'Contoh: Engineer Digital Platform'
                  }
                  value={form.position}
                  onChange={(event) => update('position', event.target.value)}
                />
              </div>
            </div>

            {form.role === 'participant' ? (
              <div className="space-y-4 rounded-xl border border-border/70 p-4">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-primary" />
                  <p className="text-xs font-bold">Data penempatan peserta</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="new-nis">NIS</Label>
                    <Input
                      id="new-nis"
                      value={form.nis}
                      onChange={(event) => update('nis', event.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="new-class">Kelas</Label>
                    <Input
                      id="new-class"
                      placeholder="XII RPL 1"
                      value={form.className}
                      onChange={(event) => update('className', event.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="new-major">Jurusan</Label>
                    <Input
                      id="new-major"
                      placeholder="Rekayasa Perangkat Lunak"
                      value={form.major}
                      onChange={(event) => update('major', event.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="new-school">Sekolah</Label>
                    <Select
                      id="new-school"
                      value={form.schoolId}
                      onChange={(event) => update('schoolId', event.target.value)}
                    >
                      <option value="">Pilih sekolah</option>
                      {data.schools.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="new-division">Divisi</Label>
                    <Select
                      id="new-division"
                      value={form.divisionId}
                      onChange={(event) => update('divisionId', event.target.value)}
                    >
                      <option value="">Pilih divisi</option>
                      {data.divisions.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="new-supervisor">Pembimbing industri</Label>
                    <Select
                      id="new-supervisor"
                      value={form.supervisorId}
                      onChange={(event) => update('supervisorId', event.target.value)}
                    >
                      <option value="">Pilih pembimbing</option>
                      {supervisors.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="new-teacher">Guru pembimbing</Label>
                    <Select
                      id="new-teacher"
                      value={form.teacherId}
                      onChange={(event) => update('teacherId', event.target.value)}
                    >
                      <option value="">Pilih guru</option>
                      {teachers.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="new-period">Periode PKL</Label>
                    <Select
                      id="new-period"
                      value={form.periodId}
                      onChange={(event) => update('periodId', event.target.value)}
                    >
                      {data.periods.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                          {item.active ? ' (aktif)' : ''}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>
              </div>
            ) : null}

            {form.role === 'supervisor' || form.role === 'teacher' || form.role === 'admin' ? (
              <div className="space-y-4 rounded-xl border border-border/70 p-4">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  <p className="text-xs font-bold">Penempatan kerja</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="new-unit-school">
                      {form.role === 'teacher' ? 'Sekolah' : 'Sekolah asal (opsional)'}
                    </Label>
                    <Select
                      id="new-unit-school"
                      value={form.schoolId}
                      onChange={(event) => update('schoolId', event.target.value)}
                    >
                      <option value="">Tidak terhubung sekolah</option>
                      {data.schools.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="new-unit-division">Divisi</Label>
                    <Select
                      id="new-unit-division"
                      value={form.divisionId}
                      onChange={(event) => update('divisionId', event.target.value)}
                    >
                      <option value="">Tidak terhubung divisi</option>
                      {data.divisions.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>
              </div>
            ) : null}

            {formError ? (
              <div className="flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3.5 py-2.5 text-xs font-medium text-rose-700 dark:text-rose-300">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {formError}
              </div>
            ) : null}

            <div className="flex items-start gap-2 rounded-xl bg-muted/40 p-3 text-[10px] leading-relaxed text-muted-foreground">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              Akun dapat langsung digunakan setelah dibuat. Kata sandi awal dapat diubah
              oleh pengguna melalui halaman profil.
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setFormOpen(false)}>
                Batal
              </Button>
              <Button type="submit">
                <UserPlus className="h-4 w-4" />
                Buat akun
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(confirmUser)}
        onOpenChange={(open) => !open && setConfirmUser(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmUser?.active ? 'Nonaktifkan akun?' : 'Aktifkan akun?'}
            </DialogTitle>
            <DialogDescription>
              {confirmUser?.active
                ? `Akun ${confirmUser?.name} tidak akan bisa masuk hingga diaktifkan kembali. Riwayat data tetap tersimpan.`
                : `Akun ${confirmUser?.name} akan dapat kembali masuk ke LENTERA.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmUser(null)}>
              Batal
            </Button>
            <Button
              variant={confirmUser?.active ? 'destructive' : 'success'}
              onClick={handleToggle}
            >
              {confirmUser?.active ? (
                <>
                  <PowerOff className="h-4 w-4" />
                  Nonaktifkan
                </>
              ) : (
                <>
                  <Power className="h-4 w-4" />
                  Aktifkan
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
