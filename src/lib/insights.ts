import type { FocusSession } from '../types'

export interface BestHourResult {
  hour: number
  seconds: number
}

/** Best clock hour by total focus seconds (local time). */
export function computeBestHour(sessions: FocusSession[]): BestHourResult | null {
  const byHour = new Map<number, number>()
  for (const s of sessions) {
    if (s.kind !== 'focus') continue
    const hour = new Date(s.startedAt).getHours()
    byHour.set(hour, (byHour.get(hour) ?? 0) + s.actualSeconds)
  }
  let best: BestHourResult | null = null
  for (const [hour, seconds] of byHour) {
    if (!best || seconds > best.seconds) best = { hour, seconds }
  }
  return best && best.seconds > 0 ? best : null
}

export function formatHourLabel(h: number): string {
  if (h === 0) return '12 ص'
  if (h === 12) return '12 م'
  if (h < 12) return `${h} ص`
  return `${h - 12} م`
}

export function sessionSummaryText(session: FocusSession): string {
  const kind = session.kind === 'focus' ? 'تركيز' : 'راحة'
  const intention = session.intention.trim() || '(بلا نية)'
  const mins = Math.round(session.actualSeconds / 60)
  return `${kind} · ${intention} · ${mins} د`
}
