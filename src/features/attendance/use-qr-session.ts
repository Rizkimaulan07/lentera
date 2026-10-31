import * as React from 'react'
import { createQrSession } from '@/lib/qr'
import type { QrSession, QrType } from '@/types'

export function useQrSession(type: QrType, userId: string, duration: number) {
  const [session, setSession] = React.useState<QrSession | null>(null)
  const [now, setNow] = React.useState(Date.now())

  const refresh = React.useCallback(() => {
    const next = createQrSession(type, userId, duration)
    setSession(next)
    setNow(Date.now())
  }, [type, userId, duration])

  React.useEffect(() => {
    refresh()
  }, [refresh])

  React.useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(interval)
  }, [])

  const secondsLeft = session
    ? Math.max(0, Math.ceil((new Date(session.expiresAt).getTime() - now) / 1000))
    : duration

  React.useEffect(() => {
    if (session && secondsLeft <= 0) refresh()
  }, [secondsLeft, session, refresh])

  return { session, secondsLeft, refresh }
}
