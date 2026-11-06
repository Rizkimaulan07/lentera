import * as React from 'react'
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
  Users,
  Wand2,
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageHeader } from '@/components/shared/page-header'
import { AttendanceBadge } from '@/components/shared/status-badge'
import { CameraScanner } from '@/features/attendance/camera-scanner'
import { useAuth } from '@/providers/auth-provider'
import { useData } from '@/providers/data-provider'
import {
  activePklParticipants,
  todayAttendance,
} from '@/lib/analytics'
import { QR_TYPE_LABELS } from '@/lib/constants'
import {
  findParticipantByQrToken,
  participantQrToken,
  parseParticipantQr,
} from '@/lib/participant-qr'
import { cn, distanceInMeters, formatTime, todayKey } from '@/lib/utils'
import type { Participant, QrType, ScanResult } from '@/types'

function deviceId() {
  const key = 'lentera.device.v1'
  const existing = localStorage.getItem(key)
  if (existing) return existing
  const created = `LEN-DEV-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
  localStorage.setItem(key, created)
  return created
}

export function ScanParticipantPage() {
  const { user } = useAuth()
  const { data, processScan } = useData()
  const [tab, setTab] = React.useState('camera')
  const [category, setCategory] = React.useState<QrType>('attendance')
  const [token, setToken] = React.useState('')
  const [result, setResult] = React.useState<ScanResult | null>(null)
  const [scannedName, setScannedName] = React.useState('')
  const [processing, setProcessing] = React.useState(false)
  const [useSimulation, setUseSimulation] = React.useState(true)
  const [realCoords, setRealCoords] = React.useState<{ lat: number; lng: number } | null>(null)
  const [geoError, setGeoError] = React.useState('')
  const [device] = React.useState(deviceId)

  if (!user) return null

  const activePeriod = data.periods.find((item) => item.active)
  const participants = activePklParticipants(data)
  const now = new Date()
  const nowTime = formatTime(now)
  const categorySessions =
    category === 'attendance'
      ? []
      : data.activities.filter(
          (activity) =>
            activity.active &&
            activity.type === category &&
            activity.days.includes(now.getDay()),
        )
  const liveSession = categorySessions.find(
    (activity) =>
      nowTime >= activity.startTime && nowTime <= activity.endTime,
  )
  const categoryActivityIds = new Set(
    categorySessions.map((activity) => activity.id),
  )
  const categoryDate = todayKey()

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

  const resolveParticipant = (raw: string): Participant | undefined => {
    const parsed = parseParticipantQr(raw)
    if (!parsed) return undefined
    if (parsed.participantId) {
      return data.participants.find((item) => item.id === parsed.participantId)
    }
    return findParticipantByQrToken(data.participants, parsed.token)
  }

  const submitToken = async (raw: string) => {
    if (!raw.trim()) {
      toast.error('Token QR peserta belum diisi.')
      return
    }
    setProcessing(true)
    setResult(null)
    setScannedName('')
    try {
      const target = resolveParticipant(raw)
      setScannedName(
        target
          ? (data.users.find((item) => item.id === target.userId)?.name ?? 'Peserta')
          : '',
      )
      const point = await resolveCoordinates()
      const scanResult = processScan({
        userId: user.id,
        token: raw,
        lat: point.lat,
        lng: point.lng,
        deviceId: device,
        category,
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
    const candidate =
      participants.find((item) => !todayAttendance(data, item.id)) ??
      participants[0]
    if (!candidate) {
      toast.error('Belum ada peserta PKL aktif untuk dipindai.')
      return
    }
    const demoToken = participantQrToken(candidate.id)
    setToken(demoToken)
    setTab('manual')
    toast.info('Token QR peserta dimuat. Tekan Kirim untuk mencatat presensi.')
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        eyebrow="Khusus Koordinator PKL"
        title="Scan QR peserta"
        description="Pindai QR pribadi peserta PKL untuk mencatat presensi masuk atau pulang. Menu ini hanya dapat diakses oleh Koordinator PKL."
        actions={
          <Badge variant="secondary" className="h-8 px-3">
            <Users className="h-3 w-3" />
            {participants.length} peserta aktif
          </Badge>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader>
            <CardTitle>Pindai QR peserta</CardTitle>
            <CardDescription>
              Pilih jenis presensi, lalu gunakan kamera atau masukkan token peserta.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="scan-category">Jenis presensi</Label>
              <Select
                id="scan-category"
                value={category}
                onChange={(event) => {
                  setCategory(event.target.value as QrType)
                  setResult(null)
                }}
              >
                {(
                  ['attendance', 'sports', 'dhuha', 'meal'] as QrType[]
                ).map((value) => (
                  <option key={value} value={value}>
                    {value === 'attendance'
                      ? 'Presensi harian (masuk/pulang)'
                      : QR_TYPE_LABELS[value]}
                  </option>
                ))}
              </Select>
              {category === 'attendance' ? (
                <p className="text-[10px] leading-relaxed text-muted-foreground">
                  Presensi harian mencatat jam masuk atau pulang peserta.
                </p>
              ) : liveSession ? (
                <p className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Sesi aktif: {liveSession.name} ({liveSession.startTime}–
                  {liveSession.endTime} WIB)
                </p>
              ) : categorySessions.length ? (
                <p className="text-[10px] leading-relaxed text-amber-600 dark:text-amber-400">
                  Belum ada sesi aktif. Jadwal hari ini:{' '}
                  {categorySessions
                    .map(
                      (activity) =>
                        `${activity.name} (${activity.startTime}–${activity.endTime})`,
                    )
                    .join(', ')}{' '}
                  WIB.
                </p>
              ) : (
                <p className="text-[10px] leading-relaxed text-muted-foreground">
                  Tidak ada sesi {QR_TYPE_LABELS[category]} hari ini.
                </p>
              )}
            </div>

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
                    <Label htmlFor="participant-token">Token QR peserta</Label>
                    <Input
                      id="participant-token"
                      placeholder="LNT-P-XXXX-XXXX"
                      value={token}
                      onChange={(event) => setToken(event.target.value.toUpperCase())}
                      className="h-11 font-mono tracking-wider"
                      autoComplete="off"
                    />
                    <p className="text-[10px] leading-relaxed text-muted-foreground">
                      Token tertera di bawah QR pada halaman QR pribadi peserta.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button type="submit" className="flex-1" disabled={processing}>
                      {processing ? 'Memproses...' : 'Kirim presensi'}
                    </Button>
                    <Button type="button" variant="outline" onClick={fillDemoToken}>
                      <Wand2 className="h-4 w-4" />
                      Isi token peserta
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
                    <p className="text-xs font-bold">Lokasi pemindaian</p>
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
                        Jarak dari titik presensi: {currentDistance} m (maks.{' '}
                        {data.settings.radius} m)
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
                Mode simulasi disediakan untuk demo. Di produksi lokasi asli wajib
                digunakan.
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
                    {result.ok ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <XCircle className="h-5 w-5" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold">
                      {result.ok
                        ? result.kind === 'activity'
                          ? 'Presensi kegiatan berhasil'
                          : 'Presensi berhasil'
                        : 'Presensi gagal'}
                    </p>
                    {scannedName ? (
                      <p className="text-[11px] font-semibold text-muted-foreground">
                        {scannedName}
                      </p>
                    ) : null}
                    <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                      {result.message}
                    </p>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {result.activityName ? (
                        <Badge variant="info">{result.activityName}</Badge>
                      ) : null}
                      {result.status ? (
                        <Badge variant={result.ok ? 'success' : 'danger'}>
                          {result.status}
                        </Badge>
                      ) : null}
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
                <div className="mt-3 border-t border-border/50 pt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setResult(null)
                      setToken('')
                      setScannedName('')
                    }}
                  >
                    Scan peserta lain
                  </Button>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="flex-col items-start justify-between gap-2 sm:flex-row">
              <div>
                <CardTitle>Peserta PKL aktif</CardTitle>
                <CardDescription>
                  {activePeriod?.name ?? 'Belum ada periode aktif'}
                </CardDescription>
              </div>
              <Badge variant="secondary">
                <Users className="h-3 w-3" />
                {participants.length}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-1">
              {participants.map((participant) => {
                const account = data.users.find(
                  (item) => item.id === participant.userId,
                )
                const dailyAttendance = todayAttendance(data, participant.id)
                const categoryRecord =
                  category === 'attendance'
                    ? undefined
                    : data.activityAttendances.find(
                        (item) =>
                          item.participantId === participant.id &&
                          item.date === categoryDate &&
                          categoryActivityIds.has(item.activityId),
                      )
                const isSelf = participant.userId === user.id
                return (
                  <div
                    key={participant.id}
                    className="flex items-center gap-2.5 rounded-xl px-1 py-2"
                  >
                    <Avatar name={account?.name ?? 'Peserta'} size="xs" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-bold">
                        {account?.name}
                        {isSelf ? ' (kamu)' : ''}
                      </p>
                      <p className="text-[9px] text-muted-foreground">
                        NIS {participant.nis} ·{' '}
                        {participant.className}
                      </p>
                    </div>
                    {category === 'attendance' ? (
                      dailyAttendance ? (
                        <AttendanceBadge status={dailyAttendance.status} />
                      ) : (
                        <Badge variant="warning">Belum</Badge>
                      )
                    ) : categoryRecord ? (
                      <Badge variant="success">Hadir</Badge>
                    ) : (
                      <Badge variant="warning">Belum</Badge>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-[10px]"
                      disabled={processing || isSelf}
                      onClick={() => {
                        setToken(participantQrToken(participant.id))
                        setTab('manual')
                        void submitToken(participantQrToken(participant.id))
                      }}
                    >
                      <ScanLine className="h-3 w-3" />
                      Scan
                    </Button>
                  </div>
                )
              })}
              {participants.length === 0 ? (
                <p className="py-6 text-center text-[11px] text-muted-foreground">
                  Belum ada peserta PKL aktif pada periode ini.
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Aturan pemindaian</CardTitle>
              <CardDescription>
                QR peserta dipakai untuk presensi harian dan kegiatan rutin.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {[
                {
                  icon: ShieldCheck,
                  text: 'Hanya Koordinator PKL yang boleh memindai QR peserta. Pembimbing dan guru pembimbing tetap dapat melihat rekap presensi.',
                },
                {
                  icon: Clock3,
                  text: 'Pilih jenis presensi sebelum memindai. Presensi kegiatan hanya dapat dicatat pada hari dan jam sesi yang aktif.',
                },
                {
                  icon: QrCode,
                  text: 'Satu QR mewakili satu akun peserta dan tidak berlaku untuk akun lain.',
                },
                {
                  icon: MapPin,
                  text: `Pemindaian harus berada dalam radius ${data.settings.radius} meter dari titik presensi.`,
                },
                {
                  icon: Clock3,
                  text: `Presensi setelah ${data.settings.lateLimit} WIB otomatis berstatus Terlambat.`,
                },
              ].map((rule) => (
                <div
                  key={rule.text}
                  className="flex gap-2.5 text-[11px] leading-relaxed text-muted-foreground"
                >
                  <rule.icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  {rule.text}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
