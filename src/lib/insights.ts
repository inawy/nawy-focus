/** Pure local insights — no React, no I/O */

import type { FocusSession } from '../types'

export interface BestHourResult {
  /** Local hour 0–23 */
  hour: number
  /** Total focus seconds in that hour bucket */
  seconds: number
  /** Number of focus sessions that started in that hour */
  sessions: number
}

const MIN_SESSIONS_FOR_BEST_HOUR = 20

/**
 * Best local clock hour for focus work, based on session start time.
 * Returns null until we have enough focus sessions (≥ 20).
 */
export function bestFocusHour(
  sessions: FocusSession[],
  minSessions = MIN_SESSIONS_FOR_BEST_HOUR,
): BestHourResult | null {
  const focus = sessions.filter((s) => s.kind === 'focus' && s.actualSeconds > 0)
  if (focus.length < minSessions) return null

  const buckets = new Array<{ seconds: number; sessions: number }>(24)
  for (let i = 0; i < 24; i++) buckets[i] = { seconds: 0, sessions: 0 }

  for (const s of focus) {
    const hour = new Date(s.startedAt).getHours()
    const b = buckets[hour]!
    b.seconds += s.actualSeconds
    b.sessions += 1
  }

  let bestHour = 0
  let bestSeconds = -1
  for (let h = 0; h < 24; h++) {
    const sec = buckets[h]!.seconds
    if (sec > bestSeconds) {
      bestSeconds = sec
      bestHour = h
    }
  }

  if (bestSeconds <= 0) return null

  return {
    hour: bestHour,
    seconds: bestSeconds,
    sessions: buckets[bestHour]!.sessions,
  }
}

/** Arabic label like «9 ص» / «14 م» for a 0–23 hour. */
export function formatHourLabel(hour: number): string {
  const h = ((Math.floor(hour) % 24) + 24) % 24
  if (h === 0) return '12 ص'
  if (h < 12) return `${h} ص`
  if (h === 12) return '12 م'
  return `${h - 12} م`
}

/**
 * Plain-text summary of a completed session for pasting into Nawy / notes.
 * Local-only — no network.
 */
export function formatSessionShareText(session: {
  intention: string
  kind: 'focus' | 'break'
  actualSeconds: number
  plannedSeconds: number
  startedAt: number
  status: string
}): string {
  const mins = Math.round(session.actualSeconds / 60)
  const planned = Math.round(session.plannedSeconds / 60)
  const kind = session.kind === 'focus' ? 'تركيز' : 'راحة'
  const intention = session.intention.trim() || '(بدون نية)'
  const when = new Date(session.startedAt).toLocaleString('ar')
  return [
    `ناوي فوكاس · ${kind}`,
    `النية: ${intention}`,
    `الوقت: ${mins} د (مخطط ${planned} د)`,
    `الحالة: ${session.status}`,
    `البداية: ${when}`,
  ].join('\n')
}
