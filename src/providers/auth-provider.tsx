import * as React from 'react'
import { useData } from '@/providers/data-provider'
import type { User } from '@/types'

const AUTH_KEY = 'lentera.auth.v1'

interface AuthContextValue {
  user: User | null
  login: (
    identifier: string,
    password: string,
  ) => { ok: boolean; message: string }
  logout: () => void
}

const AuthContext = React.createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data } = useData()
  const [userId, setUserId] = React.useState<string | null>(() =>
    localStorage.getItem(AUTH_KEY),
  )

  const user = React.useMemo(
    () => data.users.find((item) => item.id === userId) ?? null,
    [data.users, userId],
  )

  React.useEffect(() => {
    if (userId && !user) {
      localStorage.removeItem(AUTH_KEY)
      setUserId(null)
    }
  }, [userId, user])

  const login = (identifier: string, password: string) => {
    const value = identifier.trim().toLowerCase()
    const participant = data.participants.find(
      (item) => item.nis.toLowerCase() === value,
    )
    const found =
      data.users.find(
        (item) =>
          item.username.toLowerCase() === value ||
          item.email.toLowerCase() === value ||
          (participant && item.id === participant.userId),
      ) ?? null

    if (!found) {
      return {
        ok: false,
        message: 'Akun tidak ditemukan. Periksa email, username, atau NIS kamu.',
      }
    }
    if (!found.active) {
      return {
        ok: false,
        message: 'Akun ini sedang nonaktif. Hubungi admin PKL.',
      }
    }
    if (found.password !== password) {
      return { ok: false, message: 'Kata sandi salah. Silakan coba lagi.' }
    }

    localStorage.setItem(AUTH_KEY, found.id)
    setUserId(found.id)
    return { ok: true, message: `Selamat datang, ${found.name.split(' ')[0]}!` }
  }

  const logout = React.useCallback(() => {
    localStorage.removeItem(AUTH_KEY)
    setUserId(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = React.useContext(AuthContext)
  if (!context) throw new Error('useAuth harus dipakai di dalam AuthProvider')
  return context
}
