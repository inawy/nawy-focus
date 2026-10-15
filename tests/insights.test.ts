import { describe, expect, it } from 'vitest'
import {
  bestFocusHour,
  formatHourLabel,
  formatSessionShareText,
} from '../src/lib/insights'
import type { FocusSession } from '../src/types'

function session(
  partial: Partial<FocusSession> & Pick<FocusSession, 'startedAt' | 'actualSeconds'>,
): FocusSession {
  return {
    id: crypto.randomUUID?.() ?? String(Math.random()),
    intention: '',
    kind: 'focus',
    plannedSeconds: 25 * 60,
    status: 'completed',
    endedAt: partial.startedAt + partial.actualSeconds * 1000,
    createdAt: partial.startedAt,
    ...partial,
  }
}

describe('bestFocusHour', () => {
  it('returns null with fewer than 20 focus sessions', () => {
    const rows = Array.from({ length: 19 }, (_, i) =>
      session({
        startedAt: new Date(2026, 0, 1, 9, 0, 0).getTime() + i * 1000,
        actualSeconds: 600,
      }),
    )
    expect(bestFocusHour(rows)).toBeNull()
  })

  it('picks the hour with most focus seconds', () => {
    const rows: FocusSession[] = []
    for (let i = 0; i < 15; i++) {
      rows.push(
        session({
          startedAt: new Date(2026, 0, 1 + i, 9, 10, 0).getTime(),
          actualSeconds: 600,
        }),
      )
    }
    for (let i = 0; i < 10; i++) {
      rows.push(
        session({
          startedAt: new Date(2026, 0, 1 + i, 14, 0, 0).getTime(),
          actualSeconds: 1800,
        }),
      )
    }
    expect(rows.length).toBe(25)
    const best = bestFocusHour(rows)
    expect(best).not.toBeNull()
    expect(best!.hour).toBe(14)
    expect(best!.sessions).toBe(10)
    expect(best!.seconds).toBe(10 * 1800)
  })

  it('ignores break sessions', () => {
    const rows: FocusSession[] = []
    for (let i = 0; i < 20; i++) {
      rows.push(
        session({
          kind: 'focus',
          startedAt: new Date(2026, 0, 1 + i, 8, 0, 0).getTime(),
          actualSeconds: 300,
        }),
      )
    }
    for (let i = 0; i < 30; i++) {
      rows.push(
        session({
          kind: 'break',
          startedAt: new Date(2026, 0, 1 + i, 20, 0, 0).getTime(),
          actualSeconds: 9999,
        }),
      )
    }
    const best = bestFocusHour(rows)
    expect(best!.hour).toBe(8)
  })
})

describe('formatHourLabel', () => {
  it('formats am/pm style in Arabic markers', () => {
    expect(formatHourLabel(0)).toBe('12 ص')
    expect(formatHourLabel(9)).toBe('9 ص')
    expect(formatHourLabel(12)).toBe('12 م')
    expect(formatHourLabel(14)).toBe('2 م')
  })
})

describe('formatSessionShareText', () => {
  it('includes intention and duration', () => {
    const text = formatSessionShareText({
      intention: 'كتابة تقرير',
      kind: 'focus',
      actualSeconds: 1500,
      plannedSeconds: 1500,
      startedAt: Date.UTC(2026, 0, 15, 10, 0, 0),
      status: 'completed',
    })
    expect(text).toContain('كتابة تقرير')
    expect(text).toContain('تركيز')
    expect(text).toContain('25 د')
  })
})
