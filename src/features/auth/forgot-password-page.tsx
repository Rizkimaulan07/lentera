import * as React from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Loader2, Mail } from 'lucide-react'
import { Brand } from '@/components/brand/logo'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function ForgotPasswordPage() {
  const [email, setEmail] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [sent, setSent] = React.useState(false)

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    window.setTimeout(() => {
      setLoading(false)
      setSent(true)
    }, 600)
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background px-4 pb-[calc(env(safe-area-inset-bottom)+2.5rem)] pt-[calc(env(safe-area-inset-top)+2.5rem)]">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Brand />
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-xl shadow-slate-900/5 sm:p-8">
          {sent ? (
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/12 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h1 className="mt-4 text-xl font-extrabold">Periksa email kamu</h1>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Instruksi reset kata sandi sudah dikirim ke{' '}
                <span className="font-semibold text-foreground">{email}</span>. Pada
                versi demo ini, tautan tidak benar-benar dikirim.
              </p>
              <Link
                to="/login"
                className={buttonVariants({ variant: 'outline', className: 'mt-5 w-full' })}
              >
                <ArrowLeft className="h-4 w-4" />
                Kembali ke halaman masuk
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
                  Pemulihan akun
                </p>
                <h1 className="mt-2 text-2xl font-extrabold tracking-tight">
                  Lupa kata sandi?
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Masukkan email terdaftar. Kami akan mengirimkan tautan untuk membuat
                  kata sandi baru.
                </p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email terdaftar</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="nama@sekolah.sch.id"
                      className="h-11 pl-10"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Mengirim...
                    </>
                  ) : (
                    'Kirim tautan reset'
                  )}
                </Button>
              </form>
              <Link
                to="/login"
                className={buttonVariants({ variant: 'ghost', className: 'mt-3 w-full' })}
              >
                <ArrowLeft className="h-4 w-4" />
                Kembali ke halaman masuk
              </Link>
            </>
          )}
        </div>
        <p className="mt-6 text-center text-[10px] text-muted-foreground">
          LENTERA · PT Len Industri (Persero)
        </p>
      </div>
    </div>
  )
}
