import { describe, expect, it } from 'vitest'
import { createStopwatchLap, type StopwatchLap } from '../src/lib/stopwatch'

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
