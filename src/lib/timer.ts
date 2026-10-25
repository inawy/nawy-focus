import type { SessionKind, TimerPhase, TimerState } from '../types'

/** Pure timer state machine — easy to unit test */

const MIN_PLANNED_SECONDS = 60
const MAX_PLANNED_SECONDS = 3 * 60 * 60
const DEFAULT_PLANNED_SECONDS = 25 * 60

function normalizeInitialSeconds(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return DEFAULT_PLANNED_SECONDS
  return Math.max(1, Math.min(Math.floor(value), MAX_PLANNED_SECONDS))
}

function normalizePlannedSeconds(value: number): number {
  return Math.max(MIN_PLANNED_SECONDS, Math.min(Math.floor(value), MAX_PLANNED_SECONDS))
}

export function createIdleState(
  kind: SessionKind = 'focus',
  plannedSeconds = DEFAULT_PLANNED_SECONDS,
): TimerState {
  const planned = normalizeInitialSeconds(plannedSeconds)
  return {
    phase: 'idle',
    kind,
    intention: '',
    plannedSeconds: planned,
    remainingSeconds: planned,
    elapsedSeconds: 0,
    startedAt: null,
  }
}

/** Build a new idle session as one atomic state, avoiding stale preset values. */
export function createConfiguredIdleState(
  kind: SessionKind,
  plannedSeconds: number,
  intention = '',
): TimerState {
  return { ...createIdleState(kind, plannedSeconds), intention }
}

export function startTimer(state: TimerState, now = Date.now()): TimerState {
  if (state.phase === 'running') return state
  return {
    ...state,
    phase: 'running',
    remainingSeconds: state.remainingSeconds || state.plannedSeconds,
    startedAt: state.startedAt ?? now,
  }
}

export function pauseTimer(state: TimerState): TimerState {
  if (state.phase !== 'running') return state
  return { ...state, phase: 'paused' }
}

export function resumeTimer(state: TimerState): TimerState {
  if (state.phase !== 'paused') return state
  return { ...state, phase: 'running' }
}

export function tick(
  state: TimerState,
  deltaSeconds = 1,
): TimerState {
  if (state.phase !== 'running') return state

  // Ignore invalid/negative deltas so a bad caller cannot add time or corrupt elapsed time.
  const delta = Number.isFinite(deltaSeconds)
    ? Math.max(0, Math.floor(deltaSeconds))
    : 0
  if (delta === 0) return state

  const nextRemaining = Math.max(0, state.remainingSeconds - delta)
  const nextElapsed = state.elapsedSeconds + (state.remainingSeconds - nextRemaining)

  if (nextRemaining <= 0) {
    return {
      ...state,
      phase: 'finished',
      remainingSeconds: 0,
      elapsedSeconds: nextElapsed,
    }
  }

  return {
    ...state,
    remainingSeconds: nextRemaining,
    elapsedSeconds: nextElapsed,
  }
}

export function resetTimer(state: TimerState): TimerState {
  return createIdleState(state.kind, state.plannedSeconds)
}

/** Do not trim while typing — spaces must stay until save/start. */
export function setIntention(state: TimerState, intention: string): TimerState {
  return { ...state, intention }
}

export function setPlannedSeconds(
  state: TimerState,
  plannedSeconds: number,
): TimerState {
  if (state.phase === 'running' || state.phase === 'paused') return state
  if (!Number.isFinite(plannedSeconds)) return state

  const clamped = normalizePlannedSeconds(plannedSeconds)
  return {
    ...state,
    plannedSeconds: clamped,
    remainingSeconds: clamped,
    elapsedSeconds: 0,
  }
}

export function setKind(state: TimerState, kind: SessionKind): TimerState {
  if (state.phase === 'running' || state.phase === 'paused') return state
  return { ...state, kind }
}

export function isActive(phase: TimerPhase): boolean {
  return phase === 'running' || phase === 'paused'
}

/**
 * Catch up wall-clock time after the tab was backgrounded
 * (browsers throttle setInterval).
 */
export function catchUp(state: TimerState, elapsedRealSeconds: number): TimerState {
  if (state.phase !== 'running' || !Number.isFinite(elapsedRealSeconds) || elapsedRealSeconds <= 0) return state
  return tick(state, Math.floor(elapsedRealSeconds))
}
