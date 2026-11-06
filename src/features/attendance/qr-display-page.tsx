import * as React from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { format, getDay } from 'date-fns'
import {
  Check,
  Clock3,
  Copy,
  Expand,
  MapPin,
  QrCode,
  RefreshCw,
  ScanLine,
  ShieldCheck,
  Timer,
  Users,
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
import { PageHeader } from '@/components/shared/page-header'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AttendanceBadge } from '@/components/shared/status-badge'
import { useAuth } from '@/providers/auth-provider'
import { useData } from '@/providers/data-provider'
import { useQrSession } from '@/features/attendance/use-qr-session'
import { ACTIVITY_TYPE_LABELS, QR_TYPE_LABELS } from '@/lib/constants'
import { participantsForSupervisor } from '@/lib/analytics'
import { cn, formatTime, todayKey } from '@/lib/utils'
import type { QrType } from '@/types'

export function QrDisplayPage() {
  const { user } = useAuth()
  const { data } = useData()
  const [type, setType] = React.useState<QrType>('attendance')
  const [copied, setCopied] = React.useState(false)
  const qrCardRef = React.useRef<HTMLDivElement>(null)
  const duration = data.settings.qrDuration
  const { session, secondsLeft, refresh } = useQrSession(
    type,
    user?.id ?? '',
    duration,
  )

  if (!user) return null

  const today = todayKey()
  const now = new Date()
  const currentTime = format(now, 'HH:mm')

  const participantIds =
    user.role === 'supervisor'
      ? participantsForSupervisor(data, user.id).map((item) => item.id)
      : data.participants.map((item) => item.id)

  const typeActivities = data.activities.filter(
    (item) => item.type === type && item.active,
  )
  const activityIds = new Set(typeActivities.map((item) => item.id))
  const todayActivities = typeActivities.filter((item) =>
    item.days.includes(getDay(now)),
  )
  const currentActivity = todayActivities.find(
    (item) => currentTime >= item.startTime && currentTime <= item.endTime,
  )
  const attendanceToday = data.attendances.filter(
    (item) => item.date === today && participantIds.includes(item.participantId),
  )
  const activityToday = data.activityAttendances.filter(
    (item) =>
      item.date === today &&
      participantIds.includes(item.participantId) &&
      (type === 'attendance' || activityIds.has(item.activityId)),
  )
  const scannedCount =
    type === 'attendance'
      ? new Set(
          attendanceToday
            .filter((item) => item.checkIn)
            .map((item) => item.participantId),
        ).size
      : new Set(
          activityToday
            .filter((item) => item.status === 'present')
            .map((item) => item.participantId),
        ).size
  const targetCount = participantIds.length

  const copyToken = async () => {
    if (!session) return
    try {
      await navigator.clipboard.writeText(session.token)
      setCopied(true)
      toast.success('Token QR disalin ke clipboard.')
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Gagal menyalin token. Salin manual dari kode di bawah.')
    }
  }

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await qrCardRef.current?.requestFullscreen()
      } else {
        await document.exitFullscreen()
      }
    } catch {
      toast.error('Browser tidak mendukung mode layar penuh.')
    }
  }

  const progress = (secondsLeft / duration) * 100
  const circumference = 2 * Math.PI * 15.5

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        eyebrow="Presensi QR"
        title="Tampilkan QR presensi"
        description="Tampilkan halaman ini di laptop, tablet, atau monitor area kerja. Token berganti otomatis agar tidak bisa dibagikan."
        actions={
          <Badge variant="success" className="h-8 px-3">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            Sesi aktif
          </Badge>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="overflow-hidden">
          <CardHeader className="flex-col items-start justify-between gap-2 sm:flex-row sm:items-center sm:gap-3">
            <div>
              <CardTitle>Jenis QR</CardTitle>
              <CardDescription>Pilih jenis presensi yang ingin ditampilkan.</CardDescription>
            </div>
            <Badge variant="secondary">
              <Timer className="h-3 w-3" />
              {duration} detik
            </Badge>
          </CardHeader>
          <CardContent>
            <Tabs value={type} onValueChange={(value) => setType(value as QrType)}>
              <TabsList className="w-full">
                {(Object.keys(QR_TYPE_LABELS) as QrType[]).map((item) => (
                  <TabsTrigger key={item} value={item} className="flex-1">
                    {QR_TYPE_LABELS[item]}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <div
              ref={qrCardRef}
              className="mt-5 flex flex-col items-center rounded-3xl border border-border/70 bg-gradient-to-b from-muted/40 to-card px-4 py-6"
            >
              <div className="mb-4 flex w-full items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <QrCode className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {QR_TYPE_LABELS[type]}
                    </p>
                    <p className="text-[10px] text-muted-foreground">PT Len Industri · Bandung</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1.5">
                  <span className="relative flex h-8 w-8 items-center justify-center">
                    <svg viewBox="0 0 36 36" className="absolute h-8 w-8 -rotate-90">
                      <circle
                        cx="18"
                        cy="18"
                        r="15.5"
                        fill="none"
                        stroke="var(--muted)"
                        strokeWidth="3"
                      />
                      <circle
                        cx="18"
                        cy="18"
                        r="15.5"
                        fill="none"
                        stroke={secondsLeft <= 10 ? 'var(--danger)' : 'var(--accent)'}
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray={`${(progress / 100) * circumference} ${circumference}`}
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <span className="text-[10px] font-extrabold">{secondsLeft}</span>
                  </span>
                  <span className="pr-1 text-[9px] leading-tight text-muted-foreground">
                    Token
                    <br />
                    berlaku
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-border/70 bg-white p-3 shadow-lg shadow-slate-900/5">
                {session ? (
                  <QRCodeSVG
                    value={session.token}
                    size={232}
                    level="M"
                    bgColor="#ffffff"
                    fgColor="#07182b"
                    marginSize={1}
                  />
                ) : (
                  <div className="flex h-[232px] w-[232px] items-center justify-center text-xs text-muted-foreground">
                    Menyiapkan QR...
                  </div>
                )}
              </div>

              <p className="mt-4 text-center text-[11px] text-muted-foreground">
                Scan dengan menu <span className="font-bold text-foreground">Scan QR</span> di
                aplikasi peserta.
              </p>

              <div className="mt-3 flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 font-mono text-[11px] font-bold tracking-wider">
                {session?.token ?? 'LNT-••••-••••'}
                <button
                  type="button"
                  onClick={copyToken}
                  className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label="Salin token"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>

              <div className="mt-5 flex w-full max-w-sm flex-col gap-2 sm:flex-row">
                <Button variant="outline" className="flex-1" onClick={refresh}>
                  <RefreshCw className="h-4 w-4" />
                  Perbarui token
                </Button>
                <Button variant="secondary" className="flex-1" onClick={toggleFullscreen}>
                  <Expand className="h-4 w-4" />
                  Layar penuh
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ringkasan sesi</CardTitle>
              <CardDescription>
                {type === 'attendance'
                  ? 'Peserta yang sudah presensi harian hari ini.'
                  : `Kehadiran ${ACTIVITY_TYPE_LABELS[type]} hari ini.`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-emerald-500/[0.08] p-3">
                  <p className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
                    Sudah scan
                  </p>
                  <p className="mt-1 text-2xl font-extrabold">{scannedCount}</p>
                </div>
                <div className="rounded-xl bg-muted/60 p-3">
                  <p className="text-[10px] font-semibold text-muted-foreground">Belum scan</p>
                  <p className="mt-1 text-2xl font-extrabold">{Math.max(0, targetCount - scannedCount)}</p>
                </div>
              </div>

              {type !== 'attendance' ? (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Sesi hari ini
                  </p>
                  {todayActivities.length ? (
                    todayActivities.map((item) => {
                      const isLive = currentActivity?.id === item.id
                      return (
                        <div
                          key={item.id}
                          className="flex items-center justify-between gap-2 rounded-xl border border-border/70 px-3 py-2"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-[11px] font-bold">{item.name}</p>
                            <p className="flex items-center gap-1 text-[9px] text-muted-foreground">
                              <Clock3 className="h-3 w-3" />
                              {item.startTime} – {item.endTime} WIB
                            </p>
                          </div>
                          <Badge variant={isLive ? 'success' : 'secondary'}>
                            {isLive
                              ? 'Berlangsung'
                              : currentTime > item.endTime
                                ? 'Selesai'
                                : 'Terjadwal'}
                          </Badge>
                        </div>
                      )
                    })
                  ) : (
                    <p className="rounded-xl bg-muted/50 p-3 text-[10px] text-muted-foreground">
                      Tidak ada sesi {ACTIVITY_TYPE_LABELS[type]} hari ini.
                    </p>
                  )}
                </div>
              ) : null}

              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Petunjuk
                </p>
                {[
                  'Tampilkan QR di area kerja peserta.',
                  'Minta peserta membuka menu Scan QR.',
                  'QR kegiatan hanya bisa discan pada jam sesi.',
                  'Jangan bagikan screenshot QR ke grup chat.',
                ].map((text, index) => (
                  <div key={text} className="flex gap-2 text-[11px] leading-relaxed text-muted-foreground">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[9px] font-extrabold text-primary">
                      {index + 1}
                    </span>
                    {text}
                  </div>
                ))}
              </div>

              <div className="flex items-start gap-2 rounded-xl border border-sky-500/20 bg-sky-500/[0.06] p-3 text-[10px] leading-relaxed text-sky-800 dark:text-sky-300">
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Validasi token, radius lokasi, jam, dan duplikasi dilakukan di server. QR di
                halaman ini adalah simulasi MVP.
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
              <div>
                <CardTitle>Scan terakhir</CardTitle>
                <CardDescription>Pembaruan langsung dari peserta.</CardDescription>
              </div>
              <Badge variant="secondary">
                <Users className="h-3 w-3" />
                {targetCount}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-1">
              {type === 'attendance'
                ? attendanceToday
                    .filter((item) => item.checkIn)
                    .sort((a, b) => (b.checkIn ?? '').localeCompare(a.checkIn ?? ''))
                    .slice(0, 5)
                    .map((item) => {
                      const participant = data.participants.find(
                        (candidate) => candidate.id === item.participantId,
                      )
                      const student = data.users.find(
                        (candidate) => candidate.id === participant?.userId,
                      )
                      return (
                        <div key={item.id} className="flex items-center gap-2.5 rounded-xl px-1 py-2">
                          <Avatar name={student?.name ?? 'Peserta'} size="xs" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[11px] font-bold">{student?.name}</p>
                            <p className="text-[9px] text-muted-foreground">
                              {item.checkIn} WIB
                            </p>
                          </div>
                          <AttendanceBadge status={item.status} />
                        </div>
                      )
                    })
                : activityToday
                    .filter((item) => item.status === 'present')
                    .sort((a, b) =>
                      (b.scannedAt ?? '').localeCompare(a.scannedAt ?? ''),
                    )
                    .slice(0, 5)
                    .map((item) => {
                      const participant = data.participants.find(
                        (candidate) => candidate.id === item.participantId,
                      )
                      const student = data.users.find(
                        (candidate) => candidate.id === participant?.userId,
                      )
                      const recordActivity = typeActivities.find(
                        (candidate) => candidate.id === item.activityId,
                      )
                      return (
                        <div key={item.id} className="flex items-center gap-2.5 rounded-xl px-1 py-2">
                          <Avatar name={student?.name ?? 'Peserta'} size="xs" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[11px] font-bold">{student?.name}</p>
                            <p className="text-[9px] text-muted-foreground">
                              {recordActivity?.name ?? ACTIVITY_TYPE_LABELS[type]} ·{' '}
                              {item.scannedAt ? formatTime(item.scannedAt) : '-'} WIB
                            </p>
                          </div>
                          <Badge variant="success">Hadir</Badge>
                        </div>
                      )
                    })}
              {((type === 'attendance' && attendanceToday.length === 0) ||
                (type !== 'attendance' && activityToday.length === 0)) && (
                <p className="py-6 text-center text-[11px] text-muted-foreground">
                  Belum ada peserta yang scan hari ini.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardContent className="grid gap-4 p-5 sm:grid-cols-3">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <MapPin className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[10px] text-muted-foreground">Titik presensi</p>
              <p className="text-xs font-bold">
                {data.settings.latitude.toFixed(4)}, {data.settings.longitude.toFixed(4)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Clock3 className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[10px] text-muted-foreground">Jam masuk & pulang</p>
              <p className="text-xs font-bold">
                {data.settings.checkInStart} – {data.settings.checkOutTime} WIB
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ScanLine className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[10px] text-muted-foreground">Radius geofence</p>
              <p className="text-xs font-bold">{data.settings.radius} meter</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <p className={cn('text-center text-[10px] text-muted-foreground')}>
        Dibuat oleh {user.name} · {QR_TYPE_LABELS[type]} · token diperbarui otomatis
      </p>
    </div>
  )
}
