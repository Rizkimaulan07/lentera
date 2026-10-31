import { Link } from 'react-router-dom'
import { ArrowLeft, Compass, Home, LogIn } from 'lucide-react'
import { Brand } from '@/components/brand/logo'
import { buttonVariants } from '@/components/ui/button'
import { useAuth } from '@/providers/auth-provider'

export function NotFoundPage() {
  const { user } = useAuth()

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-lg text-center">
        <div className="mb-8 flex justify-center">
          <Brand />
        </div>
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-8 shadow-xl shadow-slate-900/5 sm:p-10">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-16 h-48 w-48 rounded-full bg-amber-400/10 blur-3xl" />
          <div className="relative">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Compass className="h-8 w-8" />
            </div>
            <p className="mt-5 text-5xl font-extrabold tracking-tight text-primary">404</p>
            <h1 className="mt-2 text-xl font-extrabold tracking-tight sm:text-2xl">
              Halaman tidak ditemukan
            </h1>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Alamat yang kamu buka mungkin salah, sudah dipindahkan, atau belum tersedia
              pada versi demo LENTERA.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
              {user ? (
                <Link to="/" className={buttonVariants()}>
                  <Home className="h-4 w-4" />
                  Kembali ke dashboard
                </Link>
              ) : (
                <Link to="/login" className={buttonVariants()}>
                  <LogIn className="h-4 w-4" />
                  Masuk ke LENTERA
                </Link>
              )}
              <button
                type="button"
                onClick={() => window.history.back()}
                className={buttonVariants({ variant: 'outline' })}
              >
                <ArrowLeft className="h-4 w-4" />
                Halaman sebelumnya
              </button>
            </div>
          </div>
        </div>
        <p className="mt-6 text-[10px] text-muted-foreground">
          LENTERA · PT Len Industri (Persero)
        </p>
      </div>
    </div>
  )
}
