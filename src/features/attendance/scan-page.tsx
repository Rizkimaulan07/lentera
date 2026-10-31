import * as React from 'react'
import { Link } from 'react-router-dom'
import {
  CheckCircle2,
  Clock3,
  Crosshair,
  Info,
  LocateFixed,
  MapPin,
  QrCode,
  ScanLine,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Timer,
  Wand2,
  XCircle,
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageHeader } from '@/components/shared/page-header'
import { AttendanceBadge } from '@/components/shared/status-badge'
import { CameraScanner } from '@/features/attendance/camera-scanner'
import { useAuth } from '@/providers/auth-provider'
import { useData } from '@/providers/data-provider'
import { createQrSession, readQrSessions } from '@/lib/qr'
import { participantRecords, todayAttendance } from '@/lib/analytics'
import { QR_TYPE_LABELS } from '@/lib/constants'
import {
  cn,
  distanceInMeters,
  formatDate,
  getParticipantByUserId,
  summarizeAttendance,
} from '@/lib/utils'
import type { ScanResult } from '@/types'

function extractToken(raw: string) {
  const trimmed = raw.trim()
  if (!trimmed) return ''
  try {
    const parsed = JSON.parse(trimmed) as { token?: string }
    if (parsed.token) return parsed.token
  } catch {
    // Bukan JSON: lanjutkan sebagai teks token.
  }
  const match = trimmed.match(/LNT-[A-Z0-9-]+/i)
  return match ? match[0].toUpperCase() : trimmed
}

function deviceId() {
  const key = 'lentera.device.v1'
  const existing = localStorage.getItem(key)
  if (existing) return existing
  const created = `LEN-DEV-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
  localStorage.setItem(key, created)
  return created
}

export function ScanPage() {
  const { user } = useAuth()
  const { data, processScan } = useData()
  const [tab, setTab] = React.useState('camera')
  const [token, setToken] = React.useState('')
  const [result, setResult] = React.useState<ScanResult | null>(null)
  const [processing, setProcessing] = React.useState(false)
  const [useSimulation, setUseSimulation] = React.useState(true)
  const [realCoords, setRealCoords] = React.useState<{ lat: number; lng: number } | null>(null)
  const [geoError, setGeoError] = React.useState('')
  const [device] = React.useState(deviceId)

  if (!user) return null
  const participant = getParticipantByUserId(data.participants, user.id)
  if (!participant) {
    return (
      <Card className="p-8 text-center text-sm text-muted-foreground">
        Halaman scan hanya tersedia untuk akun peserta PKL.
      </Card>
    )
  }

  const today = todayAttendance(data, participant.id)
  const records = participantRecords(data, participant.id)
  const summary = summarizeAttendance(records)
  const coords = useSimulation
    ? { lat: data.settings.latitude, lng: data.settings.longitude }
    : realCoords
  const currentDistance = coords
    ? distanceInMeters(
        data.settings.latitude,
        data.settings.longitude,
        coords.lat,
        coords.lng,
      )
    : null

  const resolveCoordinates = async () => {
    if (useSimulation) {
      return { lat: data.settings.latitude, lng: data.settings.longitude }
    }
    if (realCoords) return realCoords
    return new Promise<{ lat: number; lng: number }>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Perangkat ini tidak mendukung layanan lokasi.'))
        return
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const value = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }
          setRealCoords(value)
          resolve(value)
        },
        () => {
          reject(
            new Error(
              'Lokasi tidak dapat diambil. Aktifkan izin lokasi atau gunakan mode simulasi area PT Len.',
            ),
          )
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
      )
    })
  }

  const refreshLocation = () => {
    setGeoError('')
    if (!navigator.geolocation) {
      setGeoError('Perangkat ini tidak mendukung layanan lokasi.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setRealCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
        toast.success('Lokasi perangkat berhasil diperbarui.')
      },
      () => {
        setGeoError(
          'Izin lokasi ditolak atau GPS tidak tersedia. Gunakan mode simulasi untuk demo.',
        )
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  const submitToken = async (raw: string) => {
    const cleaned = extractToken(raw)
    setToken(cleaned)
    if (!cleaned) {
      toast.error('Token QR belum diisi.')
      return
    }
    setProcessing(true)
    setResult(null)
    try {
      const point = await resolveCoordinates()
      const scanResult = processScan({
        userId: user.id,
        token: cleaned,
        lat: point.lat,
        lng: point.lng,
        deviceId: device,
      })
      setResult(scanResult)
      if (scanResult.ok) {
        toast.success(scanResult.message)
      } else {
        toast.error(scanResult.message)
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Terjadi kesalahan saat memproses presensi.'
      setResult({ ok: false, message, kind: 'attendance' })
      toast.error(message)
    } finally {
      setProcessing(false)
    }
  }

  const fillDemoToken = () => {
    const now = Date.now()
    const active = Object.values(readQrSessions())
      .filter(
        (session) =>
          session && new Date(session.expiresAt).getTime() > now,
      )
      .sort(
        (a, b) =>
          new Date(b!.expiresAt).getTime() - new Date(a!.expiresAt).getTime(),
      )[0]
    if (active) {
      setToken(active.token)
      setTab('manual')
      toast.info(`Token ${QR_TYPE_LABELS[active.type]} aktif dimuat.`)
      return
    }
    const demo = createQrSession('attendance', user.id, 120)
    setToken(demo.token)
    setTab('manual')
    toast.info('Token demo presensi dibuat dan berlaku 2 menit.')
  }

  const todayStatusText = (() => {
    if (!today) return 'Belum presensi'
    if (today.status === 'leave') return 'Izin'
    if (today.status === 'sick') return 'Sakit'
    if (today.checkIn && today.checkOut) return 'Presensi lengkap'
    return 'Sudah masuk'
  })()

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        eyebrow="Presensi harian"
        title="Scan QR presensi"
        description="Pindai QR dari layar pembimbing untuk mencatat kehadiran masuk atau pulang. Pastikan kamu berada di area PT Len."
        actions={
          <Badge variant={today ? 'success' : 'warning'} className="h-8 px-3">
            <span className={cn('h-1.5 w-1.5 rounded-full', today ? 'bg-emerald-500' : 'bg-amber-500')} />
            {todayStatusText}
          </Badge>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader>
            <CardTitle>Pindai QR</CardTitle>
            <CardDescription>
              Gunakan kamera atau masukkan token secara manual.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="w-full">
                <TabsTrigger value="camera" className="flex-1">
                  <ScanLine className="h-3.5 w-3.5" />
                  Kamera
                </TabsTrigger>
                <TabsTrigger value="manual" className="flex-1">
                  <QrCode className="h-3.5 w-3.5" />
                  Token manual
                </TabsTrigger>
              </TabsList>

              <TabsContent value="camera">
                <CameraScanner
                  onDetected={(text) => {
                    void submitToken(text)
                  }}
                />
              </TabsContent>

              <TabsContent value="manual">
                <form
                  onSubmit={(event) => {
                    event.preventDefault()
                    void submitToken(token)
                  }}
                  className="space-y-3"
                >
                  <div className="space-y-2">
                    <Label htmlFor="token">Token QR</Label>
                    <Input
                      id="token"
                      placeholder="LNT-XXXX-XXXX"
                      value={token}
                      onChange={(event) => setToken(event.target.value.toUpperCase())}
                      className="h-11 font-mono tracking-wider"
                      autoComplete="off"
                    />
                    <p className="text-[10px] leading-relaxed text-muted-foreground">
                      Token tertera di bawah QR pada layar pembimbing.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button type="submit" className="flex-1" disabled={processing}>
                      {processing ? 'Memproses...' : 'Kirim presensi'}
                    </Button>
                    <Button type="button" variant="outline" onClick={fillDemoToken}>
                      <Wand2 className="h-4 w-4" />
                      Isi token demo
                    </Button>
                  </div>
                </form>
              </TabsContent>
            </Tabs>

            <div className="rounded-2xl border border-border/70 bg-muted/20 p-3.5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <MapPin className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-xs font-bold">Lokasi presensi</p>
                    <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">
                      {useSimulation
                        ? `Mode simulasi: area PT Len (${data.settings.latitude.toFixed(4)}, ${data.settings.longitude.toFixed(4)})`
                        : coords
                          ? `GPS perangkat (${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)})`
                          : 'Lokasi perangkat belum diambil.'}
                    </p>
                    {currentDistance !== null ? (
                      <p
                        className={cn(
                          'mt-1 text-[10px] font-semibold',
                          currentDistance <= data.settings.radius
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400',
                        )}
                      >
                        Jarak dari titik presensi: {currentDistance} m (maks. {data.settings.radius} m)
                      </p>
                    ) : null}
                  </div>
                </div>
                <Switch
                  checked={useSimulation}
                  onCheckedChange={(checked) => {
                    setUseSimulation(checked)
                    setGeoError('')
                  }}
                  label="Gunakan lokasi simulasi"
                />
              </div>
              {!useSimulation ? (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Button variant="outline" size="sm" onClick={refreshLocation}>
                    <LocateFixed className="h-3.5 w-3.5" />
                    Perbarui lokasi
                  </Button>
                  {geoError ? (
                    <p className="text-[10px] font-medium text-rose-600 dark:text-rose-400">
                      {geoError}
                    </p>
                  ) : null}
                </div>
              ) : null}
              <p className="mt-2 flex items-center gap-1 text-[9px] text-muted-foreground">
                <Info className="h-3 w-3" />
                Mode simulasi disediakan untuk demo. Di produksi lokasi asli wajib digunakan.
              </p>
            </div>

            {result ? (
              <div
                className={cn(
                  'animate-fade-up rounded-2xl border p-4',
                  result.ok
                    ? 'border-emerald-500/25 bg-emerald-500/[0.07]'
                    : 'border-rose-500/25 bg-rose-500/[0.07]',
                )}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                      result.ok
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                        : 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
                    )}
                  >
                    {result.ok ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold">
                      {result.ok
                        ? result.kind === 'activity'
                          ? `Kehadiran ${result.activityName ?? 'kegiatan'} berhasil`
                          : 'Presensi berhasil'
                        : 'Presensi gagal'}
                    </p>
                    <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                      {result.message}
                    </p>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {result.status ? <Badge variant={result.ok ? 'success' : 'danger'}>{result.status}</Badge> : null}
                      {result.time ? (
                        <Badge variant="secondary">
                          <Clock3 className="h-3 w-3" />
                          {result.time} WIB
                        </Badge>
                      ) : null}
                      {typeof result.distance === 'number' ? (
                        <Badge variant="secondary">
                          <Crosshair className="h-3 w-3" />
                          {result.distance} m
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex gap-2 border-t border-border/50 pt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setResult(null)
                      setToken('')
                    }}
                  >
                    Scan lagi
                  </Button>
                  <Link to="/attendance" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
                    Lihat riwayat
                  </Link>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="flex-col items-start justify-between gap-2 sm:flex-row">
              <div>
                <CardTitle>Status hari ini</CardTitle>
                <CardDescription>{formatDate(new Date(), 'EEEE, d MMMM yyyy')}</CardDescription>
              </div>
              {today ? <AttendanceBadge status={today.status} /> : <Badge variant="warning">Belum presensi</Badge>}
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-border/70 p-3">
                  <p className="text-[10px] text-muted-foreground">Jam masuk</p>
                  <p className="mt-1 text-xl font-extrabold">{today?.checkIn ?? '—'}</p>
                  <p className="mt-0.5 text-[9px] text-muted-foreground">Batas {data.settings.lateLimit}</p>
                </div>
                <div className="rounded-xl border border-border/70 p-3">
                  <p className="text-[10px] text-muted-foreground">Jam pulang</p>
                  <p className="mt-1 text-xl font-extrabold">{today?.checkOut ?? '—'}</p>
                  <p className="mt-0.5 text-[9px] text-muted-foreground">Mulai {data.settings.checkOutTime}</p>
                </div>
              </div>
              {today?.note ? (
                <p className="mt-3 rounded-xl bg-muted/50 p-3 text-[10px] leading-relaxed text-muted-foreground">
                  {today.note}
                </p>
              ) : null}
              <div className="mt-3 grid grid-cols-2 gap-2 text-center">
                <div className="rounded-xl bg-primary/[0.06] p-2.5">
                  <p className="text-lg font-extrabold">{summary.rate}%</p>
                  <p className="text-[9px] text-muted-foreground">Kehadiran</p>
                </div>
                <div className="rounded-xl bg-amber-500/[0.08] p-2.5">
                  <p className="text-lg font-extrabold">{summary.late}</p>
                  <p className="text-[9px] text-muted-foreground">Terlambat</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Aturan validasi</CardTitle>
              <CardDescription>Presensi diproses otomatis oleh sistem.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {[
                { icon: Timer, text: `Token hanya berlaku ${data.settings.qrDuration} detik dan berganti otomatis.` },
                { icon: MapPin, text: `Lokasi harus dalam radius ${data.settings.radius} meter dari titik presensi.` },
                { icon: ShieldCheck, text: 'Satu peserta hanya dapat presensi masuk dan pulang satu kali per hari.' },
                { icon: Clock3, text: `Presensi setelah ${data.settings.lateLimit} WIB otomatis berstatus Terlambat.` },
              ].map((rule) => (
                <div key={rule.text} className="flex gap-2.5 text-[11px] leading-relaxed text-muted-foreground">
                  <rule.icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  {rule.text}
                </div>
              ))}
              <div className="mt-3 flex items-center justify-between rounded-xl bg-muted/50 p-2.5 text-[9px] text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Smartphone className="h-3 w-3" /> Perangkat
                </span>
                <span className="font-mono">{device}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-dashed border-primary/25 bg-primary/[0.035]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Sparkles className="h-4 w-4 text-accent-foreground" />
                Cara mencoba cepat
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-[11px] leading-relaxed text-muted-foreground">
              <p>
                1. Buka halaman <span className="font-semibold text-foreground">Tampilkan QR</span>{' '}
                sebagai pembimbing di tab lain.
              </p>
              <p>2. Pindai QR dengan kamera, atau salin token yang tertera.</p>
              <p>3. Di demo ini kamu juga bisa membuat token sementara sendiri.</p>
              <Button variant="outline" size="sm" className="mt-2 w-full" onClick={fillDemoToken}>
                <Wand2 className="h-3.5 w-3.5" />
                Buat / isi token demo
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader className="flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <CardTitle>Riwayat presensi terbaru</CardTitle>
            <CardDescription>5 catatan terakhir milikmu.</CardDescription>
          </div>
          <Link to="/attendance" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
            Lihat semua
          </Link>
        </CardHeader>
        <CardContent className="space-y-1">
          {records.slice(0, 5).map((record) => (
            <div key={record.id} className="flex items-center gap-3 rounded-xl px-1 py-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-[10px] font-bold">
                {formatDate(record.date, 'd MMM')}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold">
                  {record.checkIn ?? '—'} – {record.checkOut ?? '—'} WIB
                </p>
                <p className="text-[9px] text-muted-foreground">
                  {record.method === 'qr' ? 'Presensi QR' : 'Presensi manual'}
                </p>
              </div>
              <AttendanceBadge status={record.status} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
