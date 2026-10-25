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
  const baseIsValid = Number.isFinite(baseMs)
  const safeBase = baseIsValid ? Math.max(0, baseMs) : 0
  const safeLast = Number.isFinite(lastElapsedMs)
    ? Math.max(0, lastElapsedMs)
    : safeBase
  // An invalid base means the current run cannot be trusted. Do not let a
  // seemingly valid clock delta turn corrupted elapsed state into real time.
  const clockDelta =
    baseIsValid && Number.isFinite(now) && Number.isFinite(startedAt)
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

/** Format a lap as MM:SS.cc, adding HH when the elapsed time reaches an hour. */
export function formatStopwatchLap(milliseconds: number): string {
  const total = Number.isFinite(milliseconds)
    ? Math.max(0, Math.floor(milliseconds))
    : 0
  const hours = Math.floor(total / 3_600_000)
  const minutes = Math.floor((total % 3_600_000) / 60_000)
  const seconds = Math.floor((total % 60_000) / 1000)
  const centiseconds = Math.floor((total % 1000) / 10)
  const clock = hours > 0
    ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
    : String(minutes + hours * 60).padStart(2, '0')
  return `${clock}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`
}
