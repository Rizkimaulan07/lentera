import {
  Award,
  BarChart3,
  Building2,
  CalendarCheck,
  ClipboardCheck,
  Dumbbell,
  FileText,
  GraduationCap,
  IdCard,
  LayoutDashboard,
  Megaphone,
  QrCode,
  ScanLine,
  ScanQrCode,
  ScrollText,
  Settings,
  Users,
  UserRound,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Role } from '@/types'

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  roles: Role[]
  end?: boolean
  badge?: string
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

const allRoles: Role[] = ['admin', 'supervisor', 'teacher', 'participant']

export const navGroups: NavGroup[] = [
  {
    label: 'Utama',
    items: [
      {
        label: 'Dashboard',
        href: '/',
        icon: LayoutDashboard,
        roles: allRoles,
        end: true,
      },
      {
        label: 'Scan QR',
        href: '/scan',
        icon: ScanLine,
        roles: ['participant'],
      },
      {
        label: 'QR Saya',
        href: '/my-qr',
        icon: IdCard,
        roles: ['participant'],
      },
      {
        label: 'Scan Peserta',
        href: '/scan-peserta',
        icon: ScanQrCode,
        roles: ['supervisor', 'teacher', 'admin'],
      },
      {
        label: 'Tampilkan QR',
        href: '/qr',
        icon: QrCode,
        roles: ['supervisor', 'admin'],
      },
      {
        label: 'Presensi & Rekap',
        href: '/attendance',
        icon: CalendarCheck,
        roles: allRoles,
      },
      {
        label: 'Kegiatan Rutin',
        href: '/activities',
        icon: Dumbbell,
        roles: allRoles,
      },
    ],
  },
  {
    label: 'Pembinaan',
    items: [
      {
        label: 'Peserta Bimbingan',
        href: '/participants',
        icon: Users,
        roles: ['supervisor', 'teacher', 'admin'],
      },
      {
        label: 'Perizinan',
        href: '/leaves',
        icon: FileText,
        roles: allRoles,
      },
      {
        label: 'Jurnal Harian',
        href: '/journals',
        icon: ClipboardCheck,
        roles: allRoles,
      },
      {
        label: 'Penilaian',
        href: '/assessments',
        icon: Award,
        roles: allRoles,
      },
      {
        label: 'Laporan',
        href: '/reports',
        icon: BarChart3,
        roles: ['supervisor', 'teacher', 'admin'],
      },
    ],
  },
  {
    label: 'Administrasi',
    items: [
      {
        label: 'Pengguna',
        href: '/admin/users',
        icon: GraduationCap,
        roles: ['admin'],
      },
      {
        label: 'Master Data',
        href: '/admin/master',
        icon: Building2,
        roles: ['admin'],
      },
      {
        label: 'Pengaturan',
        href: '/admin/settings',
        icon: Settings,
        roles: ['admin'],
      },
      {
        label: 'Pengumuman',
        href: '/announcements',
        icon: Megaphone,
        roles: allRoles,
      },
      {
        label: 'Log Aktivitas',
        href: '/admin/logs',
        icon: ScrollText,
        roles: ['admin'],
      },
    ],
  },
  {
    label: 'Akun',
    items: [
      {
        label: 'Profil Saya',
        href: '/profile',
        icon: UserRound,
        roles: allRoles,
      },
    ],
  },
]

export function navForRole(role: Role): NavGroup[] {
  return navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.roles.includes(role)),
    }))
    .filter((group) => group.items.length > 0)
}

export function findNavItem(pathname: string): NavItem | undefined {
  const all = navGroups.flatMap((group) => group.items)
  return all
    .filter((item) => item.href !== '/' && pathname.startsWith(item.href))
    .sort((a, b) => b.href.length - a.href.length)[0]
}

const mobilePaths: Record<Role, string[]> = {
  participant: ['/', '/scan', '/my-qr', '/journals'],
  supervisor: ['/', '/attendance', '/participants', '/reports'],
  teacher: ['/', '/attendance', '/participants', '/journals'],
  admin: ['/', '/attendance', '/participants', '/admin/users'],
}

const mobileLabels: Record<string, string> = {
  '/': 'Beranda',
  '/scan': 'Scan',
  '/my-qr': 'QR Saya',
  '/attendance': 'Presensi',
  '/participants': 'Peserta',
  '/reports': 'Laporan',
  '/journals': 'Jurnal',
  '/admin/users': 'Pengguna',
}

const allNavItems = navGroups.flatMap((group) => group.items)

/** Four role-specific shortcuts for the bottom bar; the fifth slot opens the full menu. */
export function mobileNavForRole(role: Role): NavItem[] {
  return mobilePaths[role]
    .map((href) => allNavItems.find((item) => item.href === href && item.roles.includes(role)))
    .filter((item): item is NavItem => Boolean(item))
    .map((item) => ({ ...item, label: mobileLabels[item.href] ?? item.label }))
}
