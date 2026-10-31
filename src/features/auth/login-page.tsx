import * as React from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  Loader2,
  LockKeyhole,
  MapPin,
  QrCode,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import { Brand, LogoMark } from '@/components/brand/logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/providers/auth-provider'
import { DEMO_ACCOUNTS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { Role } from '@/types'

const roleIcons: Record<Role, typeof UserRound> = {
  participant: GraduationCap,
  supervisor: Users,
  teacher: ShieldCheck,
  admin: Sparkles,
}

const roleTone: Record<Role, string> = {
  participant: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  supervisor: 'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300',
  teacher: 'border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300',
  admin: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
}

export function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [identifier, setIdentifier] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [showPassword, setShowPassword] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  const [selectedDemo, setSelectedDemo] = React.useState<string | null>(null)

  if (user) return <Navigate to="/" replace />

  const fillDemo = (account: (typeof DEMO_ACCOUNTS)[number]) => {
    setIdentifier(account.username)
    setPassword(account.password)
    setSelectedDemo(account.username)
    setError('')
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    window.setTimeout(() => {
      const result = login(identifier, password)
      setLoading(false)
      if (!result.ok) {
        setError(result.message)
        return
      }
      toast.success(result.message)
      navigate('/')
    }, 450)
  }

  return (
    <div className="min-h-svh bg-background lg:grid lg:grid-cols-[1.08fr_0.92fr]">
      <section className="relative hidden overflow-hidden bg-[#2a0307] px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between xl:px-16">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-24 top-16 h-[520px] w-[520px] rounded-full bg-[#c8102e]/50 blur-[120px]" />
          <div className="absolute -left-24 bottom-0 h-[360px] w-[360px] rounded-full bg-white/10 blur-[100px]" />
          <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.5)_1px,transparent_1px)] [background-size:56px_56px]" />
          <div className="absolute left-[52%] top-[22%] h-[2px] w-[60%] origin-left rotate-[18deg] bg-gradient-to-r from-rose-200/50 to-transparent blur-[1px]" />
          <div className="absolute left-[52%] top-[24%] h-[36%] w-[70%] origin-left rotate-[18deg] bg-gradient-to-r from-rose-200/10 to-transparent blur-2xl" />
        </div>

        <div className="relative">
          <Brand light />
        </div>

        <div className="relative max-w-xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-rose-100 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" />
            Program PKL PT Len Industri (Persero)
          </div>
          <h1 className="text-balance text-4xl font-extrabold leading-[1.08] tracking-tight xl:text-[54px]">
            Satu cahaya untuk seluruh perjalanan PKL.
          </h1>
          <p className="mt-5 max-w-lg text-sm leading-relaxed text-rose-100/75 xl:text-base">
            Presensi QR, izin, jurnal, dan penilaian dalam satu aplikasi yang
            rapi, transparan, dan mudah dipantau dari mana saja.
          </p>

          <div className="mt-9 grid gap-3 sm:grid-cols-3">
            {[
              {
                icon: QrCode,
                title: 'QR dinamis',
                text: 'Token berganti tiap 45 detik.',
              },
              {
                icon: MapPin,
                title: 'Geofence',
                text: 'Validasi lokasi di area PT Len.',
              },
              {
                icon: CheckCircle2,
                title: 'Rekap otomatis',
                text: 'Data siap diekspor kapan saja.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm"
              >
                <item.icon className="h-5 w-5 text-rose-200" />
                <p className="mt-3 text-xs font-bold">{item.title}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-rose-100/60">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center justify-between border-t border-white/10 pt-6 text-[11px] text-rose-100/60">
          <span>LENTERA — Len Internship Realtime Attendance</span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Sistem siap
          </span>
        </div>
      </section>

      <section className="relative flex min-h-svh flex-col justify-center px-4 pb-[calc(env(safe-area-inset-bottom)+2rem)] pt-[calc(env(safe-area-inset-top)+2rem)] sm:px-8 lg:px-12 xl:px-20">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-primary/[0.06] to-transparent lg:hidden" />
        <div className="relative mx-auto w-full max-w-[430px]">
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <Brand />
            <span className="rounded-full border border-border bg-card px-2.5 py-1 text-[10px] font-bold text-muted-foreground">
              Demo MVP
            </span>
          </div>

          <div className="mb-7">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
              Selamat datang kembali
            </p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight">Masuk ke LENTERA</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Gunakan email, username, atau NIS yang terdaftar.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identifier">Email / Username / NIS</Label>
              <div className="relative">
                <UserRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="identifier"
                  autoComplete="username"
                  placeholder="contoh: nabila atau 221001"
                  className="h-11 pl-10"
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Kata sandi</Label>
                <Link
                  to="/forgot-password"
                  className="text-[11px] font-bold text-primary hover:underline"
                >
                  Lupa kata sandi?
                </Link>
              </div>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Masukkan kata sandi"
                  className="h-11 pl-10 pr-11"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error ? (
              <div className="flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3.5 py-2.5 text-xs font-medium text-rose-700 dark:text-rose-300">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </div>
            ) : null}

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Memeriksa akun...
                </>
              ) : (
                <>
                  Masuk ke dashboard
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <div className="my-7 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Akun demo
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            {DEMO_ACCOUNTS.map((account) => {
              const Icon = roleIcons[account.role]
              const selected = selectedDemo === account.username
              return (
                <button
                  key={account.username}
                  type="button"
                  onClick={() => fillDemo(account)}
                  className={cn(
                    'rounded-xl border bg-card p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-md',
                    selected
                      ? 'border-primary/50 ring-2 ring-primary/15'
                      : 'border-border/80',
                  )}
                >
                  <span
                    className={cn(
                      'inline-flex h-7 w-7 items-center justify-center rounded-lg border',
                      roleTone[account.role],
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="mt-2 block text-[11px] font-bold leading-tight">
                    {account.name}
                  </span>
                  <span className="mt-0.5 block text-[9px] leading-tight text-muted-foreground">
                    {account.hint}
                  </span>
                </button>
              )
            })}
          </div>

          <p className="mt-3 text-center text-[10px] leading-relaxed text-muted-foreground">
            Semua akun demo memakai kata sandi{' '}
            <span className="rounded bg-muted px-1.5 py-0.5 font-mono font-bold text-foreground">
              lentera123
            </span>
          </p>

          <div className="mt-8 flex items-center justify-center gap-2 text-[10px] text-muted-foreground">
            <LogoMark className="h-4 w-7 rounded-md p-0.5" />
            <span>PT Len Industri (Persero) · Bandung, Indonesia</span>
          </div>
        </div>
      </section>
    </div>
  )
}
