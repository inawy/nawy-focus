import { describe, expect, it } from 'vitest'
import {
  createStopwatchLap,
  getStopwatchElapsed,
  formatStopwatchLap,
  type StopwatchLap,
} from '../src/lib/stopwatch'

describe('stopwatch elapsed time', () => {
  it('calculates elapsed time from the current run and accumulated base', () => {
    expect(getStopwatchElapsed(5_000, 10_000, 13_250)).toBe(8_250)
  })

  it('does not go backwards if the system clock moves backwards', () => {
    expect(getStopwatchElapsed(5_000, 10_000, 9_000, 7_000)).toBe(7_000)
  })

  it('never returns a negative elapsed duration', () => {
    expect(getStopwatchElapsed(0, 10_000, 9_000)).toBe(0)
  })

  it('preserves the last valid elapsed time if a clock reading is invalid', () => {
    expect(getStopwatchElapsed(5_000, 10_000, Number.NaN, 7_000)).toBe(7_000)
    expect(getStopwatchElapsed(5_000, Number.NaN, 13_000, 6_000)).toBe(6_000)
  })

  it('normalizes invalid or negative elapsed inputs', () => {
    expect(getStopwatchElapsed(Number.NaN, 0, 10_000)).toBe(0)
    expect(getStopwatchElapsed(Number.NaN, 0, 10_000, 7_000)).toBe(7_000)
    expect(getStopwatchElapsed(-2_000, 0, 1_000)).toBe(1_000)
  })
})

describe('stopwatch lap splits', () => {
  it('calculates each split from the immediately preceding lap', () => {
    const first = createStopwatchLap(10_000, [])
    const second = createStopwatchLap(25_000, [first])
    const third = createStopwatchLap(31_000, [second, first])

    expect(first).toEqual({ number: 1, elapsedMs: 10_000, splitMs: 10_000 })
    expect(second).toEqual({ number: 2, elapsedMs: 25_000, splitMs: 15_000 })
    expect(third).toEqual({ number: 3, elapsedMs: 31_000, splitMs: 6_000 })
  })

  it('never reports a negative split', () => {
    const previous: StopwatchLap = { number: 1, elapsedMs: 12_000, splitMs: 12_000 }
    expect(createStopwatchLap(9_000, [previous]).splitMs).toBe(0)
  })

  it('normalizes an invalid elapsed reading when recording a lap', () => {
    expect(createStopwatchLap(Number.NaN, [])).toEqual({
      number: 1,
      elapsedMs: 0,
      splitMs: 0,
    })
  })
})

describe('stopwatch lap formatting', () => {
  it('formats short laps as minutes, seconds, and centiseconds', () => {
    expect(formatStopwatchLap(65_432)).toBe('01:05.43')
  })

  it('adds an hours segment when a lap reaches one hour', () => {
    expect(formatStopwatchLap(3_661_234)).toBe('01:01:01.12')
  })

  it('normalizes invalid lap times instead of displaying NaN', () => {
    expect(formatStopwatchLap(Number.NaN)).toBe('00:00.00')
  })
})
