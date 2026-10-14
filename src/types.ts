/** Shared domain types for Nawy Focus */

export type SessionKind = 'focus' | 'break'

export type SessionStatus = 'completed' | 'stopped' | 'abandoned'

export interface FocusSession {
  id: string
  /** What the user intended to work on (optional, free text) */
  intention: string
  kind: SessionKind
  /** Planned duration in seconds */
  plannedSeconds: number
  /** Actual focused time in seconds */
  actualSeconds: number
  status: SessionStatus
  startedAt: number
  endedAt: number
  createdAt: number
}

export type TimerPhase = 'idle' | 'running' | 'paused' | 'finished'

export interface TimerState {
  phase: TimerPhase
  kind: SessionKind
  intention: string
  plannedSeconds: number
  /** Remaining seconds when running/paused */
  remainingSeconds: number
  /** Accumulated elapsed focus seconds in this run */
  elapsedSeconds: number
  startedAt: number | null
}

export const DEFAULT_FOCUS_MINUTES = [15, 25, 45, 60] as const
export const DEFAULT_BREAK_MINUTES = [5, 10, 15] as const

export const SCHEMA_VERSION = 1
