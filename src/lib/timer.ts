import type { SessionKind, TimerPhase, TimerState } from '../types'

/** Pure timer state machine — easy to unit test */

export function createIdleState(
  kind: SessionKind = 'focus',
  plannedSeconds = 25 * 60,
): TimerState {
  return {
    phase: 'idle',
    kind,
    intention: '',
    plannedSeconds,
    remainingSeconds: plannedSeconds,
    elapsedSeconds: 0,
    startedAt: null,
  }
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
  const clamped = Math.max(60, Math.min(plannedSeconds, 3 * 60 * 60))
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
