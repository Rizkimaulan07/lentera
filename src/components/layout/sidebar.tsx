import { NavLink } from 'react-router-dom'
import { LogOut, ShieldCheck, Sparkles, X } from 'lucide-react'
import { Brand } from '@/components/brand/logo'
import { Avatar } from '@/components/ui/avatar'
import { useAuth } from '@/providers/auth-provider'
import { useData } from '@/providers/data-provider'
import { navForRole } from '@/components/layout/nav-config'
import { cn, getParticipantByUserId, roleLabels } from '@/lib/utils'

export function Sidebar({
  onNavigate,
  onClose,
  className,
}: {
  onNavigate?: () => void
  onClose?: () => void
  className?: string
}) {
  const { user, logout } = useAuth()
  const { data } = useData()
  if (!user) return null

  const groups = navForRole(user.role)
  const participant = getParticipantByUserId(data.participants, user.id)
  const activePeriod = data.periods.find((period) => period.active)
  const division = data.divisions.find(
    (item) => item.id === (participant?.divisionId ?? user.divisionId),
  )
  const school = data.schools.find(
    (item) => item.id === (participant?.schoolId ?? user.schoolId),
  )
  const contextLabel =
    user.role === 'participant'
      ? division?.name ?? 'Peserta PKL'
      : user.role === 'admin'
        ? 'Semua divisi & sekolah'
        : user.role === 'teacher'
          ? school?.name ?? 'Guru pembimbing'
          : division?.name ?? 'Pembimbing industri'

  return (
    <aside
      className={cn(
        'flex h-full w-[268px] max-w-[85vw] flex-col border-r border-sidebar-border bg-sidebar pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] text-sidebar-foreground',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2 px-5 pb-4 pt-5">
        <Brand light />
        <div className="flex items-center gap-1">
          <span className="rounded-full border border-sidebar-border bg-sidebar-accent px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-accent">
            MVP
          </span>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup menu"
              className="rounded-lg p-2 text-sidebar-muted transition-colors hover:bg-sidebar-accent hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>

      <div className="mx-3 mb-4 rounded-2xl border border-sidebar-border bg-sidebar-accent/70 p-3.5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-3.5 w-3.5 text-accent" />
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-sidebar-muted">
            {roleLabels[user.role]}
          </p>
        </div>
        <p className="mt-2 text-sm font-bold leading-tight text-white">{user.name}</p>
        <p className="mt-1 line-clamp-1 text-[11px] text-sidebar-muted">{contextLabel}</p>
        {activePeriod ? (
          <p className="mt-2 flex items-center gap-1.5 border-t border-sidebar-border pt-2 text-[10px] text-sidebar-muted">
            <Sparkles className="h-3 w-3 text-accent" />
            {activePeriod.name}
          </p>
        ) : null}
      </div>

      <nav
        aria-label="Menu aplikasi"
        className="flex-1 space-y-4 overflow-y-auto overscroll-contain px-3 pb-5"
      >
        {groups.map((group) => (
          <div key={group.label}>
            <p className="mb-1.5 px-3 text-[9px] font-bold uppercase tracking-[0.18em] text-sidebar-muted/80">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  end={item.end}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-all',
                      isActive
                        ? 'bg-sidebar-accent text-white shadow-sm ring-1 ring-white/5'
                        : 'text-sidebar-muted hover:bg-sidebar-accent/60 hover:text-white',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon
                        className={cn(
                          'h-[18px] w-[18px] shrink-0 transition-colors',
                          isActive ? 'text-accent' : 'text-sidebar-muted group-hover:text-white',
                        )}
                      />
                      <span className="truncate">{item.label}</span>
                      {isActive ? (
                        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-accent" />
                      ) : null}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-2.5 rounded-xl px-2 py-2">
          <Avatar name={user.name} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-white">{user.name}</p>
            <p className="truncate text-[10px] text-sidebar-muted">@{user.username}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="rounded-lg p-2 text-sidebar-muted transition-colors hover:bg-sidebar-accent hover:text-white"
            aria-label="Keluar"
            title="Keluar"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-1 px-2 text-[9px] text-sidebar-muted/70">
          LENTERA · PT Len Industri (Persero)
        </p>
      </div>
    </aside>
  )
}
