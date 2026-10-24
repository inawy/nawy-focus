export interface StopwatchLap {
  number: number
  elapsedMs: number
  splitMs: number
}

/**
 * Calculate elapsed time from a monotonic clock and guard against invalid,
 * negative, or regressing readings.
 */
export function getStopwatchElapsed(
  baseMs: number,
  startedAt: number,
  now: number,
  lastElapsedMs = baseMs,
): number {
  const safeBase = Number.isFinite(baseMs) ? Math.max(0, baseMs) : 0
  const safeLast = Number.isFinite(lastElapsedMs)
    ? Math.max(0, lastElapsedMs)
    : safeBase
  const clockDelta =
    Number.isFinite(now) && Number.isFinite(startedAt)
      ? Math.max(0, now - startedAt)
      : 0
  return Math.max(safeBase + clockDelta, safeLast)
}

/** Existing laps are stored newest-first. The split uses the latest lap. */
export function createStopwatchLap(
  elapsedMs: number,
  existingLaps: readonly StopwatchLap[],
): StopwatchLap {
  const safeElapsed = Number.isFinite(elapsedMs) ? Math.max(0, elapsedMs) : 0
  const previous = existingLaps[0]?.elapsedMs ?? 0
  const previousElapsed = Number.isFinite(previous) ? Math.max(0, previous) : 0
  return {
    number: existingLaps.length + 1,
    elapsedMs: safeElapsed,
    splitMs: Math.max(0, safeElapsed - previousElapsed),
  }
}
