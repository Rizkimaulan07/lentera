import type { Participant } from '@/types'

/**
 * Token QR identitas peserta.
 *
 * Token diturunkan secara deterministik dari `participantId` sehingga QR tetap
 * sama di perangkat mana pun (pada MVP yang belum memakai backend). Untuk
 * produksi, token wajib dibuat dan divalidasi di server.
 */
const TOKEN_SALT = 'lentera.pkl.2026'

const QR_TOKEN_PATTERN = /LNT-P-[A-Z0-9]{4}-[A-Z0-9]{4}/i

function hashChunk(value: string) {
  let hash = 5381
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) + hash + value.charCodeAt(index)) >>> 0
  }
  return hash.toString(36).toUpperCase().padStart(7, '0')
}

export function participantQrToken(participantId: string) {
  const left = hashChunk(`${TOKEN_SALT}:${participantId}:left`).slice(-4)
  const right = hashChunk(`${TOKEN_SALT}:${participantId}:right`).slice(-4)
  return `LNT-P-${left}-${right}`
}

export interface ParticipantQrPayload {
  kind: 'participant'
  participantId: string
  nis: string
  token: string
}

export function buildParticipantQrValue(participant: Participant) {
  const payload: ParticipantQrPayload = {
    kind: 'participant',
    participantId: participant.id,
    nis: participant.nis,
    token: participantQrToken(participant.id),
  }
  return JSON.stringify(payload)
}

export function parseParticipantQr(raw: string) {
  const trimmed = raw.trim()
  if (!trimmed) return null

  try {
    const parsed = JSON.parse(trimmed) as Partial<ParticipantQrPayload>
    if (
      parsed.kind === 'participant' &&
      typeof parsed.participantId === 'string' &&
      typeof parsed.token === 'string'
    ) {
      return {
        participantId: parsed.participantId,
        token: parsed.token.toUpperCase(),
      }
    }
  } catch {
    // Bukan JSON: lanjutkan sebagai token mentah.
  }

  const match = trimmed.match(QR_TOKEN_PATTERN)
  if (!match) return null
  return { token: match[0].toUpperCase() }
}

export function isParticipantQrToken(participantId: string, token: string) {
  return participantQrToken(participantId) === token.trim().toUpperCase()
}

export function findParticipantByQrToken(
  participants: Participant[],
  token: string,
) {
  const normalized = token.trim().toUpperCase()
  return participants.find(
    (participant) => participantQrToken(participant.id) === normalized,
  )
}
