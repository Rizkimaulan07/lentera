import * as React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Bell,
  CheckCheck,
  ChevronDown,
  LogOut,
  Menu,
  Moon,
  Settings,
  Sun,
  UserRound,
} from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/providers/auth-provider'
import { useData } from '@/providers/data-provider'
import { useTheme } from '@/providers/theme-provider'
import { findNavItem } from '@/components/layout/nav-config'
import { cn, roleLabels, timeAgo, todayLabel } from '@/lib/utils'
import { toast } from 'sonner'

function useClickOutside(
  refs: React.RefObject<HTMLElement | null>[],
  onOutside: () => void,
) {
  React.useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (
        refs.every(
          (ref) => !ref.current || !ref.current.contains(event.target as Node),
        )
      ) {
        onOutside()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [refs, onOutside])
}

export function Header({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { user, logout } = useAuth()
  const { data, markNotificationRead, markAllNotificationsRead } = useData()
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const [notifOpen, setNotifOpen] = React.useState(false)
  const [profileOpen, setProfileOpen] = React.useState(false)
  const notifRef = React.useRef<HTMLDivElement>(null)
  const profileRef = React.useRef<HTMLDivElement>(null)

  useClickOutside([notifRef, profileRef], () => {
    setNotifOpen(false)
    setProfileOpen(false)
  })

  if (!user) return null

  const notifications = data.notifications
    .filter((item) => item.userId === user.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  const unread = notifications.filter((item) => !item.read).length
  const activeItem = findNavItem(location.pathname)
  const title =
    location.pathname === '/'
      ? 'Dashboard'
      : activeItem?.label ?? 'LENTERA'

  const handleLogout = () => {
    logout()
    toast.success('Kamu sudah keluar dari LENTERA.')
    navigate('/login')
  }

  return (
    <header className="no-print sticky top-0 z-30 border-b border-border/70 bg-background/80 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-2.5 px-4 sm:gap-3 sm:px-6 lg:px-8">
        <Button
          variant="ghost"
          size="icon"
          className="-ml-1 shrink-0 lg:hidden"
          onClick={onOpenMenu}
          aria-label="Buka menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold sm:text-base">{title}</p>
          <p className="hidden text-[11px] text-muted-foreground sm:block">{todayLabel()}</p>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="Ganti tema"
            title={theme === 'dark' ? 'Mode terang' : 'Mode gelap'}
          >
            {theme === 'dark' ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
          </Button>

          <div className="relative" ref={notifRef}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setNotifOpen((open) => !open)
                setProfileOpen(false)
              }}
              aria-label="Notifikasi"
              aria-expanded={notifOpen}
              aria-haspopup="true"
              className="relative"
            >
              <Bell className="h-[18px] w-[18px]" />
              {unread > 0 ? (
                <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-extrabold text-primary-foreground ring-2 ring-background">
                  {unread > 9 ? '9+' : unread}
                </span>
              ) : null}
            </Button>

            {notifOpen ? (
              <div className="fixed inset-x-4 top-[calc(env(safe-area-inset-top)+4.5rem)] z-50 animate-fade-up overflow-hidden rounded-2xl border border-border bg-card shadow-2xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-[min(92vw,360px)]">
                <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
                  <div>
                    <p className="text-sm font-bold">Notifikasi</p>
                    <p className="text-[11px] text-muted-foreground">
                      {unread} belum dibaca
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => markAllNotificationsRead(user.id)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    Tandai semua
                  </button>
                </div>
                <div className="max-h-[min(55svh,380px)] overflow-y-auto overscroll-contain">
                  {notifications.length === 0 ? (
                    <p className="px-4 py-10 text-center text-xs text-muted-foreground">
                      Belum ada notifikasi.
                    </p>
                  ) : (
                    notifications.slice(0, 12).map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          markNotificationRead(item.id)
                          setNotifOpen(false)
                          if (item.href) navigate(item.href)
                        }}
                        className={cn(
                          'flex w-full gap-3 border-b border-border/50 px-4 py-3 text-left transition-colors last:border-0 hover:bg-muted/50',
                          !item.read && 'bg-primary/[0.035]',
                        )}
                      >
                        <span
                          className={cn(
                            'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                            item.read ? 'bg-muted-foreground/25' : 'bg-primary',
                          )}
                        />
                        <span className="min-w-0">
                          <span className="block truncate text-xs font-bold">{item.title}</span>
                          <span className="mt-0.5 line-clamp-2 block text-[11px] leading-relaxed text-muted-foreground">
                            {item.body}
                          </span>
                          <span className="mt-1 block text-[10px] text-muted-foreground/70">
                            {timeAgo(item.createdAt)}
                          </span>
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            ) : null}
          </div>

          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => {
                setProfileOpen((open) => !open)
                setNotifOpen(false)
              }}
              aria-label="Buka menu profil"
              aria-expanded={profileOpen}
              aria-haspopup="true"
              className="flex items-center gap-2 rounded-xl border border-border/70 bg-card py-1 pl-1 pr-2 transition-colors hover:bg-muted/50"
            >
              <Avatar name={user.name} size="sm" />
              <span className="hidden max-w-[120px] text-left sm:block">
                <span className="block truncate text-xs font-bold leading-tight">{user.name}</span>
                <span className="block truncate text-[9px] text-muted-foreground">
                  {roleLabels[user.role]}
                </span>
              </span>
              <ChevronDown className="hidden h-3.5 w-3.5 text-muted-foreground sm:block" />
            </button>

            {profileOpen ? (
              <div className="fixed inset-x-4 top-[calc(env(safe-area-inset-top)+4.5rem)] z-50 animate-fade-up overflow-hidden rounded-2xl border border-border bg-card shadow-2xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-56">
                <div className="border-b border-border/70 px-4 py-3">
                  <p className="truncate text-sm font-bold">{user.name}</p>
                  <p className="truncate text-[11px] text-muted-foreground">@{user.username}</p>
                </div>
                <div className="p-1.5">
                  <Link
                    to="/profile"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold hover:bg-muted"
                  >
                    <UserRound className="h-4 w-4 text-muted-foreground" />
                    Profil saya
                  </Link>
                  {user.role === 'admin' ? (
                    <Link
                      to="/admin/settings"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold hover:bg-muted"
                    >
                      <Settings className="h-4 w-4 text-muted-foreground" />
                      Pengaturan sistem
                    </Link>
                  ) : null}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-500/10 dark:text-rose-400"
                  >
                    <LogOut className="h-4 w-4" />
                    Keluar
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  )
}
