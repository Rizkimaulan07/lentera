import * as React from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { MobileNav } from '@/components/layout/mobile-nav'

export function AppLayout() {
  const [menuOpen, setMenuOpen] = React.useState(false)
  const location = useLocation()

  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [location.pathname])

  React.useEffect(() => {
    if (!menuOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previous
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [menuOpen])

  return (
    <div className="min-h-svh bg-background">
      <div className="no-print fixed inset-y-0 left-0 z-40 hidden lg:block">
        <Sidebar />
      </div>

      {menuOpen ? (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Menu navigasi"
        >
          <div
            className="absolute inset-0 animate-fade-in bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />
          <div className="relative h-full w-[268px] max-w-[85vw] animate-slide-in-left shadow-2xl">
            <Sidebar
              onNavigate={() => setMenuOpen(false)}
              onClose={() => setMenuOpen(false)}
            />
          </div>
        </div>
      ) : null}

      <div className="lg:pl-[268px]">
        <Header onOpenMenu={() => setMenuOpen(true)} />
        <main className="mx-auto w-full max-w-[1440px] px-4 pb-24 pt-5 sm:px-6 sm:pt-6 lg:px-8 lg:pb-10">
          <Outlet />
        </main>
        <footer className="no-print mx-auto hidden max-w-[1440px] items-center justify-between px-4 pb-6 text-[10px] text-muted-foreground sm:px-6 lg:flex lg:px-8">
          <span>LENTERA — Len Internship Realtime Attendance</span>
          <span>PT Len Industri (Persero) · Demo MVP</span>
        </footer>
      </div>

      <MobileNav menuOpen={menuOpen} onOpenMenu={() => setMenuOpen(true)} />
    </div>
  )
}
