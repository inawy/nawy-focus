import { useCallback, useEffect, useRef, useState } from 'react'
import {
  catchUp,
  createIdleState,
  pauseTimer,
  resetTimer,
  resumeTimer,
  setIntention,
  setKind,
  setPlannedSeconds,
  startTimer,
} from '../lib/timer'
import { playCompletionChime, vibrateOnComplete } from '../lib/sound'
import { notifySessionFinished } from '../lib/notify'
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
  const stateRef = useRef(state)
  stateRef.current = state
  const intervalRef = useRef<number | null>(null)
  const savedFinishedRef = useRef(false)
  const lastTickAtRef = useRef<number>(Date.now())
  /** Set when we finish while the tab is hidden — App can show a banner. */
  const [finishedWhileHidden, setFinishedWhileHidden] = useState(false)
  const [persistenceError, setPersistenceError] = useState<string | null>(null)
  const pendingSessionsRef = useRef<
    Array<{
      session: Parameters<typeof addSession>[0]
      resetAfterSave: boolean
    }>
  >([])
  const savingSessionsRef = useRef(false)

  const flushPendingSessions = useCallback(async () => {
    if (savingSessionsRef.current) return
    savingSessionsRef.current = true
    try {
      while (pendingSessionsRef.current.length > 0) {
        const pending = pendingSessionsRef.current[0]
        if (!pending) break
        try {
          await addSession(pending.session)
        } catch {
          setPersistenceError(
            'تعذّر حفظ الجلسة في التخزين المحلي. الجلسة محفوظة مؤقتًا في الصفحة؛ حاول الحفظ مرة أخرى قبل إغلاقها.',
          )
          return
        }
        pendingSessionsRef.current.shift()
        setPersistenceError(null)
        if (pending.resetAfterSave) setState((current) => resetTimer(current))
      }
    } finally {
      savingSessionsRef.current = false
    }
  }, [])

  const persistSession = useCallback(
    async (session: Parameters<typeof addSession>[0], resetAfterSave = false) => {
      pendingSessionsRef.current.push({ session, resetAfterSave })
      await flushPendingSessions()
    },
    [flushPendingSessions],
  )

  const retrySave = useCallback(async () => {
    await flushPendingSessions()
  }, [flushPendingSessions])

  const clearTick = useCallback(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  useEffect(() => {
    if (state.phase === 'running') {
      lastTickAtRef.current = Date.now()
      intervalRef.current = window.setInterval(() => {
        const now = Date.now()
        const elapsedWholeSeconds = Math.floor(
          (now - lastTickAtRef.current) / 1000,
        )
        if (elapsedWholeSeconds <= 0) return
        // Advance by real elapsed time, not one assumed second. Background tabs
        // can throttle intervals for minutes; resetting the timestamp blindly
        // here would silently lose that time.
        lastTickAtRef.current += elapsedWholeSeconds * 1000
        setState((prev) => catchUp(prev, elapsedWholeSeconds))
      }, 1000)
    } else {
      clearTick()
    }
    return clearTick
  }, [state.phase, clearTick])

  // Wall-clock catch-up when returning from background
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState !== 'visible') return
      setState((prev) => {
        if (prev.phase !== 'running') return prev
        const gapSec = (Date.now() - lastTickAtRef.current) / 1000
        if (gapSec < 1.5) return prev
        lastTickAtRef.current = Date.now()
        return catchUp(prev, gapSec)
      })
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  useEffect(() => {
    const base = 'ناوي فوكاس'
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
    vibrateOnComplete()
    notifySessionFinished(state.kind)

    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      setFinishedWhileHidden(true)
    }

    void persistSession({
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
    persistSession,
  ])

  const start = useCallback(() => {
    savedFinishedRef.current = false
    setFinishedWhileHidden(false)
    lastTickAtRef.current = Date.now()
    setState((s) => startTimer(s))
  }, [])

  const pause = useCallback(() => {
    setState((s) => pauseTimer(s))
  }, [])

  const resume = useCallback(() => {
    lastTickAtRef.current = Date.now()
    setState((s) => resumeTimer(s))
  }, [])

  const stop = useCallback(async () => {
    setFinishedWhileHidden(false)
    const prev = stateRef.current
    if (prev.elapsedSeconds <= 0) {
      setState(resetTimer(prev))
      return
    }

    setState((current) => pauseTimer(current))
    await persistSession(
      {
        intention: prev.intention,
        kind: prev.kind,
        plannedSeconds: prev.plannedSeconds,
        actualSeconds: prev.elapsedSeconds,
        status: 'stopped',
        startedAt: prev.startedAt ?? Date.now(),
        endedAt: Date.now(),
      },
      true,
    )
  }, [persistSession])

  const reset = useCallback(() => {
    savedFinishedRef.current = false
    setFinishedWhileHidden(false)
    setState((s) => resetTimer(s))
  }, [])

  /** After a finished focus session: switch to break defaults and start. */
  const startBreak = useCallback(() => {
    savedFinishedRef.current = false
    setFinishedWhileHidden(false)
    const breakSec = loadDefaultBreakSeconds()
    lastTickAtRef.current = Date.now()
    setState(() => {
      let s = createIdleState('break', breakSec)
      s = startTimer(s)
      return s
    })
  }, [])

  const dismissFinishedBanner = useCallback(() => {
    setFinishedWhileHidden(false)
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
    startBreak,
    updateIntention,
    updatePlanned,
    updateKind,
    finishedWhileHidden,
    dismissFinishedBanner,
    persistenceError,
    retrySave,
  }
}
