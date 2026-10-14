import { useCallback, useEffect, useRef, useState } from 'react'
import {
  createIdleState,
  pauseTimer,
  resetTimer,
  resumeTimer,
  setIntention,
  setKind,
  setPlannedSeconds,
  startTimer,
  tick,
} from '../lib/timer'
import { playCompletionChime } from '../lib/sound'
import {
  loadDefaultBreakSeconds,
  loadDefaultFocusSeconds,
  saveDefaultBreakSeconds,
  saveDefaultFocusSeconds,
} from '../lib/prefs'
import type { SessionKind, TimerState } from '../types'
import { addSession } from '../db'
import { formatTime } from '../lib/format'

function initialState(): TimerState {
  return createIdleState('focus', loadDefaultFocusSeconds())
}

/**
 * Owns timer UI state and the 1s interval.
 * Persists a session when the user finishes or stops early.
 */
export function useTimer() {
  const [state, setState] = useState<TimerState>(initialState)
  const intervalRef = useRef<number | null>(null)
  const savedFinishedRef = useRef(false)

  const clearTick = useCallback(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  useEffect(() => {
    if (state.phase === 'running') {
      intervalRef.current = window.setInterval(() => {
        setState((prev) => tick(prev, 1))
      }, 1000)
    } else {
      clearTick()
    }
    return clearTick
  }, [state.phase, clearTick])

  useEffect(() => {
    const base = 'ناوي فوكس'
    if (state.phase === 'running' || state.phase === 'paused') {
      document.title = `${formatTime(state.remainingSeconds)} · ${base}`
    } else if (state.phase === 'finished') {
      document.title = `انتهت الجلسة · ${base}`
    } else {
      document.title = base
    }
  }, [state.phase, state.remainingSeconds])

  useEffect(() => {
    if (state.phase !== 'finished') {
      savedFinishedRef.current = false
      return
    }
    if (savedFinishedRef.current) return
    savedFinishedRef.current = true

    playCompletionChime()

    void addSession({
      intention: state.intention,
      kind: state.kind,
      plannedSeconds: state.plannedSeconds,
      actualSeconds: state.elapsedSeconds,
      status: 'completed',
      startedAt: state.startedAt ?? Date.now(),
      endedAt: Date.now(),
    })
  }, [
    state.phase,
    state.intention,
    state.kind,
    state.plannedSeconds,
    state.elapsedSeconds,
    state.startedAt,
  ])

  const start = useCallback(() => {
    savedFinishedRef.current = false
    setState((s) => startTimer(s))
  }, [])

  const pause = useCallback(() => {
    setState((s) => pauseTimer(s))
  }, [])

  const resume = useCallback(() => {
    setState((s) => resumeTimer(s))
  }, [])

  const stop = useCallback(async () => {
    setState((prev) => {
      if (prev.elapsedSeconds > 0) {
        void addSession({
          intention: prev.intention,
          kind: prev.kind,
          plannedSeconds: prev.plannedSeconds,
          actualSeconds: prev.elapsedSeconds,
          status: 'stopped',
          startedAt: prev.startedAt ?? Date.now(),
          endedAt: Date.now(),
        })
      }
      return resetTimer(prev)
    })
  }, [])

  const reset = useCallback(() => {
    savedFinishedRef.current = false
    setState((s) => resetTimer(s))
  }, [])

  const updateIntention = useCallback((value: string) => {
    setState((s) => setIntention(s, value))
  }, [])

  const updatePlanned = useCallback((seconds: number) => {
    setState((s) => {
      const next = setPlannedSeconds(s, seconds)
      if (next.kind === 'focus') saveDefaultFocusSeconds(next.plannedSeconds)
      else saveDefaultBreakSeconds(next.plannedSeconds)
      return next
    })
  }, [])

  const updateKind = useCallback((kind: SessionKind) => {
    setState((s) => {
      let next = setKind(s, kind)
      if (kind === 'focus') {
        next = setPlannedSeconds(next, loadDefaultFocusSeconds())
      } else {
        next = setPlannedSeconds(next, loadDefaultBreakSeconds())
      }
      return next
    })
  }, [])

  return {
    state,
    start,
    pause,
    resume,
    stop,
    reset,
    updateIntention,
    updatePlanned,
    updateKind,
  }
}
