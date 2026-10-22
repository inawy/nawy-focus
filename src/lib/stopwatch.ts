export interface StopwatchLap {
  number: number
  elapsedMs: number
  splitMs: number
}

/**
 * Calculate elapsed time from a monotonic clock and guard against negative or
 * regressing readings (for example, from mocked clocks or precision rounding).
 */
export function getStopwatchElapsed(
  baseMs: number,
  startedAt: number,
  now: number,
  lastElapsedMs = baseMs,
): number {
  const elapsed = baseMs + Math.max(0, now - startedAt)
  return Math.max(0, lastElapsedMs, elapsed)
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
