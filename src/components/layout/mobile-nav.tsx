import { Menu } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { mobileNavForRole } from '@/components/layout/nav-config'
import { useAuth } from '@/providers/auth-provider'
import { cn } from '@/lib/utils'

export function MobileNav({
  onOpenMenu,
  menuOpen,
}: {
  onOpenMenu: () => void
  menuOpen: boolean
}) {
  const { user } = useAuth()
  if (!user) return null

  const items = mobileNavForRole(user.role)

  return (
    <nav
      aria-label="Navigasi utama"
      className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-card/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_30px_-20px_rgba(15,23,42,0.45)] backdrop-blur-xl lg:hidden"
    >
      <div className="mx-auto grid max-w-lg grid-cols-5 px-1.5">
        {items.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'flex min-w-0 flex-col items-center gap-1 px-1 py-2 text-[10px] font-semibold leading-none transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-xl transition-all',
                    isActive ? 'bg-primary/10' : '',
                  )}
                >
                  <item.icon className="h-[18px] w-[18px]" />
                </span>
                <span className="w-full truncate text-center">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}

        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Buka semua menu"
          aria-expanded={menuOpen}
          className={cn(
            'flex min-w-0 flex-col items-center gap-1 px-1 py-2 text-[10px] font-semibold leading-none transition-colors',
            menuOpen ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <span
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-xl transition-all',
              menuOpen && 'bg-primary/10',
            )}
          >
            <Menu className="h-[18px] w-[18px]" />
          </span>
          <span className="w-full truncate text-center">Menu</span>
        </button>
      </div>
    </nav>
  )
}
