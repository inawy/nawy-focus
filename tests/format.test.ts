import { describe, expect, it } from 'vitest'
import { formatDurationShort, formatTime, startOfWeek } from '../src/lib/format'

describe('format', () => {
  it('formats clock time', () => {
    expect(formatTime(125)).toBe('02:05')
    expect(formatTime(0)).toBe('00:00')
  })

  it('formats short arabic duration', () => {
    expect(formatDurationShort(45)).toBe('45ث')
    expect(formatDurationShort(120)).toBe('2د')
  })

  it('startOfWeek is sunday local midnight', () => {
    const wed = new Date(2026, 9, 14, 15, 30).getTime()
    const start = startOfWeek(wed)
    const d = new Date(start)
    expect(d.getDay()).toBe(0)
    expect(d.getHours()).toBe(0)
  })
})
