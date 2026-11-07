import type { Role } from '@/types'

/**
 * Pengesahan administratif (izin, jurnal, dan presensi manual) hanya boleh
 * dilakukan oleh Koordinator PKL. Akun koordinator menggunakan role `admin`.
 */
export function canApprove(role: Role) {
  return role === 'admin'
}

export const APPROVAL_ONLY_NOTE =
  'Pengesahan hanya dapat dilakukan oleh Koordinator PKL.'
