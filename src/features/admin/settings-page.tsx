import * as React from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  Building2,
  CalendarDays,
  Clock3,
  Database,
  ExternalLink,
  Info,
  MapPin,
  Navigation,
  QrCode,
  RotateCcw,
  Save,
  ShieldCheck,
  Smartphone,
} from 'lucide-react'
import { toast } from 'sonner'
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
import { PageHeader } from '@/components/shared/page-header'
import { useAuth } from '@/providers/auth-provider'
import { useData } from '@/providers/data-provider'
import { DAY_LABELS } from '@/lib/constants'
import { cn } from '@/lib/utils'

const PT_LEN_COORDS = { latitude: -6.9436, longitude: 107.633 }

export function AdminSettingsPage() {
  const { user } = useAuth()
  const { data, updateSettings, reset } = useData()
  const [form, setForm] = React.useState({ ...data.settings })
  const [resetOpen, setResetOpen] = React.useState(false)
  const [locating, setLocating] = React.useState(false)

  if (!user) return null

  const update = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const toggleDay = (day: number) => {
    setForm((current) => ({
      ...current,
      workDays: current.workDays.includes(day)
        ? current.workDays.filter((item) => item !== day)
        : [...current.workDays, day].sort(),
    }))
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.workDays.length) {
      toast.error('Pilih minimal satu hari kerja PKL.')
      return
    }
    if (form.radius < 10) {
      toast.error('Radius geofence minimal 10 meter.')
      return
    }
    updateSettings(form, user.id)
    toast.success('Pengaturan presensi berhasil disimpan.')
  }

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Perangkat ini tidak mendukung deteksi lokasi.')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm((current) => ({
          ...current,
          latitude: Number(position.coords.latitude.toFixed(6)),
          longitude: Number(position.coords.longitude.toFixed(6)),
        }))
        setLocating(false)
        toast.success('Koordinat lokasi kamu berhasil diambil.')
      },
      () => {
        setLocating(false)
        toast.error('Gagal mengambil lokasi. Periksa izin lokasi di browser.')
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  const handleReset = () => {
    reset()
    toast.success('Data demo berhasil dikembalikan ke kondisi awal.')
    setResetOpen(false)
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        eyebrow="Administrasi"
        title="Pengaturan sistem"
        description="Atur jam presensi, geofence, token QR, hari kerja, dan data demo LENTERA."
        actions={
          <Button type="submit" form="settings-form">
            <Save className="h-4 w-4" />
            Simpan pengaturan
          </Button>
        }
      />

      <form id="settings-form" onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Clock3 className="h-4 w-4" />
                </span>
                <div>
                  <CardTitle className="text-base">Jam presensi</CardTitle>
                  <CardDescription>
                    Batas waktu masuk, pulang, dan penentuan status terlambat.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="check-in-start">Mulai presensi</Label>
                <Input
                  id="check-in-start"
                  type="time"
                  value={form.checkInStart}
                  onChange={(event) => update('checkInStart', event.target.value)}
                  required
                />
                <p className="text-[9px] text-muted-foreground">Peserta boleh scan mulai jam ini.</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="late-limit">Batas terlambat</Label>
                <Input
                  id="late-limit"
                  type="time"
                  value={form.lateLimit}
                  onChange={(event) => update('lateLimit', event.target.value)}
                  required
                />
                <p className="text-[9px] text-muted-foreground">Lewat jam ini berstatus terlambat.</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="check-out-time">Jam pulang</Label>
                <Input
                  id="check-out-time"
                  type="time"
                  value={form.checkOutTime}
                  onChange={(event) => update('checkOutTime', event.target.value)}
                  required
                />
                <p className="text-[9px] text-muted-foreground">Acuan presensi pulang.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/12 text-emerald-600 dark:text-emerald-400">
                  <MapPin className="h-4 w-4" />
                </span>
                <div>
                  <CardTitle className="text-base">Geofence presensi</CardTitle>
                  <CardDescription>
                    Peserta hanya dapat presensi di dalam radius area PT Len.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="0.000001"
                    value={form.latitude}
                    onChange={(event) => update('latitude', Number(event.target.value))}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="0.000001"
                    value={form.longitude}
                    onChange={(event) => update('longitude', Number(event.target.value))}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="radius">Radius (meter)</Label>
                  <Input
                    id="radius"
                    type="number"
                    min={10}
                    max={2000}
                    value={form.radius}
                    onChange={(event) => update('radius', Number(event.target.value))}
                    required
                  />
                </div>
                <div className="flex items-end">
                  <a
                    href={`https://www.google.com/maps?q=${form.latitude},${form.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className={buttonVariants({ variant: 'outline', className: 'w-full' })}
                  >
                    <ExternalLink className="h-4 w-4" />
                    Lihat di peta
                  </a>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setForm((current) => ({ ...current, ...PT_LEN_COORDS }))
                    toast.success('Koordinat PT Len Industri diterapkan.')
                  }}
                >
                  <Building2 className="h-3.5 w-3.5" />
                  Gunakan titik PT Len
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={useMyLocation}
                  disabled={locating}
                >
                  <Navigation className={cn('h-3.5 w-3.5', locating && 'animate-pulse')} />
                  {locating ? 'Mengambil lokasi...' : 'Gunakan lokasi saya'}
                </Button>
              </div>
              <p className="flex items-start gap-2 rounded-xl bg-muted/40 p-3 text-[10px] leading-relaxed text-muted-foreground">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                Titik pusat PT Len Industri: {PT_LEN_COORDS.latitude}, {PT_LEN_COORDS.longitude}.
                Untuk demo, gunakan simulasi lokasi pada halaman scan QR.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/14 text-amber-600 dark:text-amber-400">
                  <QrCode className="h-4 w-4" />
                </span>
                <div>
                  <CardTitle className="text-base">Token QR & hari kerja</CardTitle>
                  <CardDescription>
                    Durasi token dan hari yang dihitung sebagai hari kerja PKL.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="qr-duration">Durasi token QR (detik)</Label>
                  <Input
                    id="qr-duration"
                    type="number"
                    min={15}
                    max={300}
                    step={5}
                    value={form.qrDuration}
                    onChange={(event) => update('qrDuration', Number(event.target.value))}
                    required
                  />
                  <p className="text-[9px] text-muted-foreground">
                    Rekomendasi 30–60 detik agar QR tetap aman dan mudah dipindai.
                  </p>
                </div>
                <div className="flex items-end">
                  <div className="w-full rounded-xl border border-border/70 p-3 text-[10px] text-muted-foreground">
                    <p className="font-bold text-foreground">Pratinjau</p>
                    <p className="mt-1">
                      Token berganti setiap {form.qrDuration} detik dan hanya berlaku pada
                      perangkat ini.
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Hari kerja PKL</Label>
                <div className="flex flex-wrap gap-1.5">
                  {DAY_LABELS.map((label, index) => {
                    const active = form.workDays.includes(index)
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => toggleDay(index)}
                        className={cn(
                          'h-9 rounded-lg border px-3 text-[11px] font-bold transition-colors',
                          active
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border bg-card text-muted-foreground hover:bg-muted',
                        )}
                      >
                        {label}
                      </button>
                    )
                  })}
                </div>
                <p className="text-[9px] text-muted-foreground">
                  Presensi di luar hari kerja akan ditolak oleh sistem.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit">
              <Save className="h-4 w-4" />
              Simpan semua pengaturan
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">Status sistem</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2.5 text-[11px]">
              <div className="flex items-center justify-between rounded-lg bg-emerald-500/[0.07] p-2.5">
                <span className="text-muted-foreground">Mode data</span>
                <Badge variant="success">Demo lokal</Badge>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border/70 p-2.5">
                <span className="text-muted-foreground">Penyimpanan</span>
                <span className="font-bold">localStorage</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border/70 p-2.5">
                <span className="text-muted-foreground">Zona waktu</span>
                <span className="font-bold">WIB (UTC+7)</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border/70 p-2.5">
                <span className="text-muted-foreground">Periode aktif</span>
                <span className="max-w-[150px] truncate font-bold">
                  {data.periods.find((item) => item.active)?.name ?? '—'}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border/70 p-2.5">
                <span className="text-muted-foreground">Jumlah pengguna</span>
                <span className="font-bold">{data.users.length}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">Komponen penilaian</CardTitle>
              </div>
              <CardDescription>
                Bobot nilai dikelola dari master data agar konsisten.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.assessmentComponents.map((component) => (
                  <div
                    key={component.id}
                    className="flex items-center justify-between rounded-lg border border-border/70 px-3 py-2 text-[11px]"
                  >
                    <span className="truncate font-semibold">{component.name}</span>
                    <Badge variant="secondary">{component.weight}%</Badge>
                  </div>
                ))}
              </div>
              <Link
                to="/admin/master"
                className={buttonVariants({
                  variant: 'outline',
                  size: 'sm',
                  className: 'mt-3 w-full',
                })}
              >
                <Database className="h-3.5 w-3.5" />
                Kelola master data
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">Aplikasi PWA</CardTitle>
              </div>
              <CardDescription>
                LENTERA dapat dipasang di layar utama HP tanpa app store.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-[10px] leading-relaxed text-muted-foreground">
              <p>
                1. Buka LENTERA di Chrome atau Safari.
              </p>
              <p>
                2. Pilih menu browser, lalu <span className="font-semibold text-foreground">Tambahkan ke layar utama</span>.
              </p>
              <p>
                3. Aplikasi akan berjalan dalam mode standalone dan mendukung akses offline
                untuk aset dasar.
              </p>
              <Badge variant="info" className="mt-1">
                <Smartphone className="h-3 w-3" />
                PWA siap dipasang
              </Badge>
            </CardContent>
          </Card>

          <Card className="border-rose-500/25">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-500" />
                <CardTitle className="text-base text-rose-600 dark:text-rose-400">
                  Zona berbahaya
                </CardTitle>
              </div>
              <CardDescription>
                Kembalikan seluruh data demo ke kondisi awal. Tindakan ini tidak dapat
                dibatalkan.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                type="button"
                variant="destructive"
                className="w-full"
                onClick={() => setResetOpen(true)}
              >
                <RotateCcw className="h-4 w-4" />
                Reset data demo
              </Button>
            </CardContent>
          </Card>
        </div>
      </form>

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset seluruh data demo?</DialogTitle>
            <DialogDescription>
              Semua pengguna, presensi, izin, jurnal, penilaian, dan pengumuman akan
              dikembalikan ke data awal. Akun yang sedang masuk tetap sama, tetapi data
              baru yang dibuat akan hilang.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetOpen(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleReset}>
              <RotateCcw className="h-4 w-4" />
              Ya, reset data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
