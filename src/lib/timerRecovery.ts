import { catchUp } from './timer'
import type { TimerState } from '../types'

export const TIMER_RECOVERY_KEY = 'nawy-focus:timer-recovery:v1'
const MAX_PLANNED_SECONDS = 3 * 60 * 60
const MAX_RECOVERY_GAP_SECONDS = 24 * 60 * 60

interface TimerRecoverySnapshot {
  version: 1
  savedAt: number
  state: TimerState
}

function isValidSnapshot(value: unknown): value is TimerRecoverySnapshot {
  if (!value || typeof value !== 'object') return false
  const snapshot = value as Partial<TimerRecoverySnapshot>
  const state = snapshot.state
  if (snapshot.version !== 1 || !Number.isFinite(snapshot.savedAt) || !state || typeof state !== 'object') return false
  if (state.phase !== 'running' && state.phase !== 'paused') return false
  if (state.kind !== 'focus' && state.kind !== 'break') return false
  if (typeof state.intention !== 'string' || state.intention.length > 2000) return false
  if (!Number.isFinite(state.plannedSeconds) || state.plannedSeconds < 1 || state.plannedSeconds > MAX_PLANNED_SECONDS) return false
  if (!Number.isFinite(state.remainingSeconds) || state.remainingSeconds < 0 || state.remainingSeconds > state.plannedSeconds) return false
  if (!Number.isFinite(state.elapsedSeconds) || state.elapsedSeconds < 0 || state.elapsedSeconds > state.plannedSeconds) return false
  if (Math.floor(state.remainingSeconds + state.elapsedSeconds) !== Math.floor(state.plannedSeconds)) return false
  if (!Number.isFinite(state.startedAt) || (state.startedAt ?? 0) <= 0) return false
  return true
}

/** Restore a validated snapshot, accounting for time elapsed while a running timer was closed. */
export function recoverTimerSnapshot(raw: string | null, now = Date.now()): TimerState | null {
  if (!raw) return null
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!isValidSnapshot(parsed)) return null
    const state = parsed.state
    if (state.phase === 'paused') return state
    const gapSeconds = Math.min(MAX_RECOVERY_GAP_SECONDS, Math.max(0, Math.floor((now - parsed.savedAt) / 1000)))
    return catchUp(state, gapSeconds)
  } catch {
    return null
  }
}

export function readTimerRecovery(): TimerState | null {
  try {
    return recoverTimerSnapshot(window.localStorage.getItem(TIMER_RECOVERY_KEY))
  } catch {
    return null
  }
}

export function writeTimerRecovery(state: TimerState): void {
  if (state.phase !== 'running' && state.phase !== 'paused') return
  try {
    const snapshot: TimerRecoverySnapshot = { version: 1, savedAt: Date.now(), state }
    window.localStorage.setItem(TIMER_RECOVERY_KEY, JSON.stringify(snapshot))
  } catch {
    // Storage may be disabled or full; timer operation must remain unaffected.
  }
}

export function clearTimerRecovery(): void {
  try {
    window.localStorage.removeItem(TIMER_RECOVERY_KEY)
  } catch {
    // Storage may be disabled; ignore and keep the timer usable.
  }
}
