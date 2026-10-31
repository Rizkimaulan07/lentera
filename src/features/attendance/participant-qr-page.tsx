import * as React from 'react'
import { Link } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import {
  BadgeCheck,
  Building2,
  CalendarCheck,
  Check,
  Copy,
  GraduationCap,
  Info,
  QrCode,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import { toast } from 'sonner'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { PageHeader } from '@/components/shared/page-header'
import { AttendanceBadge } from '@/components/shared/status-badge'
import { useAuth } from '@/providers/auth-provider'
import { useData } from '@/providers/data-provider'
import { todayAttendance } from '@/lib/analytics'
import {
  buildParticipantQrValue,
  participantQrToken,
} from '@/lib/participant-qr'
import { cn, formatDate, getParticipantByUserId } from '@/lib/utils'

export function ParticipantQrPage() {
  const { user } = useAuth()
  const { data } = useData()
  const [copied, setCopied] = React.useState(false)

  if (!user) return null

  const participant = getParticipantByUserId(data.participants, user.id)
  if (!participant) {
    return (
      <Card className="p-8 text-center text-sm text-muted-foreground">
        Halaman QR pribadi hanya tersedia untuk akun peserta PKL.
      </Card>
    )
  }

  const token = participantQrToken(participant.id)
  const qrValue = buildParticipantQrValue(participant)
  const today = todayAttendance(data, participant.id)
  const account = data.users.find((item) => item.id === participant.userId)
  const period = data.periods.find((item) => item.id === participant.periodId)
  const division = data.divisions.find((item) => item.id === participant.divisionId)
  const school = data.schools.find((item) => item.id === participant.schoolId)
  const supervisor = data.users.find((item) => item.id === participant.supervisorId)

  const statusText = (() => {
    if (!today) return 'Belum presensi hari ini'
    if (today.status === 'leave') return 'Izin tercatat'
    if (today.status === 'sick') return 'Sakit tercatat'
    if (today.checkIn && today.checkOut) return 'Presensi lengkap'
    return `Sudah masuk pukul ${today.checkIn}`
  })()

  const copyToken = async () => {
    try {
      await navigator.clipboard.writeText(token)
      setCopied(true)
      toast.success('Token QR peserta disalin.')
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Gagal menyalin token. Salin manual dari kode di bawah.')
    }
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        eyebrow="Identitas PKL"
        title="QR peserta saya"
        description="Tunjukkan QR ini kepada pembimbing atau guru pembimbing untuk mencatat kehadiran. QR bersifat pribadi, jangan dibagikan."
        actions={
          <Badge variant={today ? 'success' : 'warning'} className="h-8 px-3">
            <span
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                today ? 'bg-emerald-500' : 'bg-amber-500',
              )}
            />
            {statusText}
          </Badge>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>QR pribadi</CardTitle>
            <CardDescription>
              Pindai QR ini dari menu <span className="font-semibold text-foreground">Scan Peserta</span> milik pembimbing.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center rounded-3xl border border-border/70 bg-gradient-to-b from-muted/40 to-card px-4 py-6">
              <div className="mb-4 flex w-full items-center justify-between gap-3 px-1">
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <QrCode className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Kartu peserta PKL
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {period?.name ?? 'PT Len Industri'}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary">
                  <ShieldCheck className="h-3 w-3" />
                  {account?.active ? 'Aktif' : 'Nonaktif'}
                </Badge>
              </div>

              <div className="rounded-2xl border border-border/70 bg-white p-3 shadow-lg shadow-slate-900/5">
                <QRCodeSVG
                  value={qrValue}
                  size={240}
                  level="M"
                  bgColor="#ffffff"
                  fgColor="#07182b"
                  marginSize={1}
                />
              </div>

              <p className="mt-4 text-center text-sm font-extrabold">{user.name}</p>
              <p className="text-[11px] text-muted-foreground">
                NIS {participant.nis} · {participant.className}
              </p>

              <div className="mt-3 flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 font-mono text-[11px] font-bold tracking-wider">
                {token}
                <button
                  type="button"
                  onClick={copyToken}
                  className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label="Salin token QR"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>

              <p className="mt-4 max-w-xs text-center text-[10px] leading-relaxed text-muted-foreground">
                Token ini mewakili akunmu. Pembimbing memindainya untuk mencatat
                presensi masuk dan pulang.
              </p>

              <div className="mt-5 flex w-full max-w-sm flex-col gap-2 sm:flex-row">
                <Link
                  to="/attendance"
                  className={buttonVariants({ variant: 'outline', className: 'flex-1' })}
                >
                  <CalendarCheck className="h-4 w-4" />
                  Lihat presensi
                </Link>
                <Link
                  to="/scan"
                  className={buttonVariants({ variant: 'secondary', className: 'flex-1' })}
                >
                  <QrCode className="h-4 w-4" />
                  Scan QR area
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="flex-col items-start justify-between gap-2 sm:flex-row">
              <div>
                <CardTitle>Data peserta</CardTitle>
                <CardDescription>
                  {formatDate(new Date(), 'EEEE, d MMMM yyyy')}
                </CardDescription>
              </div>
              {today ? (
                <AttendanceBadge status={today.status} />
              ) : (
                <Badge variant="warning">Belum presensi</Badge>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                {
                  icon: UserRound,
                  label: 'Nama lengkap',
                  value: user.name,
                },
                {
                  icon: BadgeCheck,
                  label: 'NIS',
                  value: participant.nis,
                },
                {
                  icon: GraduationCap,
                  label: 'Sekolah & jurusan',
                  value: `${school?.name ?? '-'} · ${participant.major}`,
                },
                {
                  icon: Building2,
                  label: 'Divisi PKL',
                  value: division?.name ?? '-',
                },
                {
                  icon: ShieldCheck,
                  label: 'Pembimbing industri',
                  value: supervisor?.name ?? '-',
                },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <item.icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground">{item.label}</p>
                    <p className="text-xs font-bold">{item.value}</p>
                  </div>
                </div>
              ))}
              <div className="mt-1 rounded-xl bg-muted/50 p-3 text-[10px] leading-relaxed text-muted-foreground">
                Status hari ini:{' '}
                <span className="font-semibold text-foreground">{statusText}</span>
                {today?.checkOut ? ` · Pulang ${today.checkOut}` : ''}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Info className="h-4 w-4 text-accent-foreground" />
                Cara memakai QR
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                'Datang ke area PT Len pada hari kerja PKL.',
                'Tunjukkan halaman ini kepada pembimbing atau guru pembimbing.',
                'Pembimbing memindai QR melalui menu Scan Peserta.',
                'Presensi masuk dan pulang tercatat otomatis di akunmu.',
              ].map((text, index) => (
                <div
                  key={text}
                  className="flex gap-2 text-[11px] leading-relaxed text-muted-foreground"
                >
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[9px] font-extrabold text-primary">
                    {index + 1}
                  </span>
                  {text}
                </div>
              ))}
              <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-3 text-[10px] leading-relaxed text-amber-800 dark:text-amber-300">
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Jangan membagikan tangkapan layar QR ini. Pada versi produksi token
                peserta ditandatangani dan divalidasi oleh server.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground">
        <Avatar name={user.name} size="xs" />
        {user.name} · @{user.username} · {period?.name ?? 'PKL'}
      </div>
    </div>
  )
}
