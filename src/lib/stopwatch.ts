import type {} from 'vitest'

export interface StopwatchLap {
  number: number
  elapsedMs: number
  splitMs: number
}

/** Existing laps are stored newest-first. The split uses the latest lap. */
export function createStopwatchLap(
  elapsedMs: number,
  existingLaps: readonly StopwatchLap[],
): StopwatchLap {
  const previousElapsed = existingLaps[0]?.elapsedMs ?? 0
  return {
    number: existingLaps.length + 1,
    elapsedMs,
    splitMs: Math.max(0, elapsedMs - previousElapsed),
  }
}
