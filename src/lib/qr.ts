import type { QrSession, QrType } from '@/types'

const QR_KEY = 'lentera.qr.sessions.v1'
const TOKEN_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function randomChunk(length: number) {
  const values = new Uint32Array(length)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(values)
  } else {
    for (let i = 0; i < length; i += 1) values[i] = Math.floor(Math.random() * 1_000_000)
  }
  return Array.from(values, (value) => TOKEN_CHARS[value % TOKEN_CHARS.length]).join('')
}

export function createQrToken() {
  return `LNT-${randomChunk(4)}-${randomChunk(4)}`
}

type QrStore = Partial<Record<QrType, QrSession>>

export function readQrSessions(): QrStore {
  try {
    const raw = localStorage.getItem(QR_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as QrStore
  } catch {
    return {}
  }
}

function writeQrSessions(store: QrStore) {
  localStorage.setItem(QR_KEY, JSON.stringify(store))
}

export function createQrSession(
  type: QrType,
  createdBy: string,
  durationSeconds: number,
): QrSession {
  const now = new Date()
  const session: QrSession = {
    token: createQrToken(),
    type,
    createdBy,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + durationSeconds * 1000).toISOString(),
  }
  const store = readQrSessions()
  store[type] = session
  writeQrSessions(store)
  return session
}

export function findQrSession(token: string): QrSession | undefined {
  const normalized = token.trim().toUpperCase()
  return Object.values(readQrSessions()).find(
    (session) => session?.token.toUpperCase() === normalized,
  )
}

export function validateQrToken(token: string): {
  session?: QrSession
  error?: string
} {
  if (!token.trim()) {
    return { error: 'Masukkan token QR terlebih dahulu.' }
  }
  const session = findQrSession(token)
  if (!session) {
    return {
      error:
        'Token QR tidak dikenali. Pastikan kamu memindai QR terbaru dari layar pembimbing.',
    }
  }
  if (new Date(session.expiresAt).getTime() < Date.now()) {
    return {
      error:
        'QR sudah kedaluwarsa. Minta pembimbing memperbarui QR di layar, lalu coba lagi.',
    }
  }
  return { session }
}

export function activeQrSession(type: QrType): QrSession | undefined {
  const session = readQrSessions()[type]
  if (!session) return undefined
  if (new Date(session.expiresAt).getTime() < Date.now()) return undefined
  return session
}
