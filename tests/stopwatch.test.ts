import { describe, expect, it } from 'vitest'
import {
  createStopwatchLap,
  getStopwatchElapsed,
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
})
