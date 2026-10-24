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
import type { FocusSession, SessionKind, TimerState } from '../types'
import { saveSession } from '../db'
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
  /** Prevents concurrent stop calls from saving the same session twice. */
  const stoppingRef = useRef(false)
  /** Set when we finish while the tab is hidden — App can show a banner. */
  const [finishedWhileHidden, setFinishedWhileHidden] = useState(false)
  const [persistenceError, setPersistenceError] = useState<string | null>(null)
  const [hasUnsavedSessions, setHasUnsavedSessions] = useState(false)
  const pendingSessionsRef = useRef<
    Array<{
      session: FocusSession
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
          await saveSession(pending.session)
        } catch {
          setPersistenceError(
            'تعذّر حفظ الجلسة في التخزين المحلي. الجلسة محفوظة مؤقتًا في الصفحة؛ حاول الحفظ مرة أخرى قبل إغلاقها.',
          )
          return
        }
        pendingSessionsRef.current.shift()
        setHasUnsavedSessions(pendingSessionsRef.current.length > 0)
        setPersistenceError(null)
        if (pending.resetAfterSave) {
          setState((current) => {
            const isSameStoppedSession =
              current.phase === 'paused' &&
              current.kind === pending.session.kind &&
              current.startedAt === pending.session.startedAt &&
              current.elapsedSeconds === pending.session.actualSeconds
            return isSameStoppedSession ? resetTimer(current) : current
          })
        }
      }
    } finally {
      savingSessionsRef.current = false
    }
  }, [])

  const persistSession = useCallback(
    async (
      session: Omit<FocusSession, 'id' | 'createdAt'>,
      resetAfterSave = false,
    ) => {
      pendingSessionsRef.current.push({
        session: { ...session, id: crypto.randomUUID(), createdAt: Date.now() },
        resetAfterSave,
      })
      setHasUnsavedSessions(true)
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
      lastTickAtRef.current = performance.now()
      intervalRef.current = window.setInterval(() => {
        const now = performance.now()
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
        const gapSec = (performance.now() - lastTickAtRef.current) / 1000
        if (gapSec < 1.5) return prev
        // Consume only whole seconds and retain the fractional remainder for
        // the next interval instead of silently dropping it on tab return.
        const elapsedWholeSeconds = Math.floor(gapSec)
        if (elapsedWholeSeconds <= 0) return prev
        lastTickAtRef.current += elapsedWholeSeconds * 1000

        // React state updaters must stay pure: determine whether the timer
        // expired during the absence before scheduling the state update.
        const current = stateRef.current
        if (
          current.phase === 'running' &&
          catchUp(current, elapsedWholeSeconds).phase === 'finished'
        ) {
          setFinishedWhileHidden(true)
        }
        return catchUp(prev, elapsedWholeSeconds)
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
    lastTickAtRef.current = performance.now()
    setState((s) => startTimer(s))
  }, [])

  const pause = useCallback(() => {
    setState((s) => pauseTimer(s))
  }, [])

  const resume = useCallback(() => {
    lastTickAtRef.current = performance.now()
    setState((s) => resumeTimer(s))
  }, [])

  const stop = useCallback(async () => {
    if (stoppingRef.current) return
    stoppingRef.current = true
    try {
      setFinishedWhileHidden(false)
      const prev = stateRef.current

      // Catch up before saving: a throttled background interval must not make
      // an early stop persist less time than has actually elapsed.
      let latest = prev
      if (prev.phase === 'running') {
        const now = performance.now()
        const elapsedWholeSeconds = Math.max(
          0,
          Math.floor((now - lastTickAtRef.current) / 1000),
        )
        if (elapsedWholeSeconds > 0) {
          lastTickAtRef.current += elapsedWholeSeconds * 1000
          latest = catchUp(prev, elapsedWholeSeconds)
        }
      }

      // If catch-up reached zero, let the completion effect save it as
      // completed rather than racing it with a second stopped-session write.
      if (latest.phase === 'finished') {
        setState(latest)
        return
      }

      if (latest.elapsedSeconds <= 0) {
        setState(resetTimer(latest))
        return
      }

      // Guard against a duplicate queued stop for the same session.
      const alreadyQueued = pendingSessionsRef.current.some(
        ({ session, resetAfterSave }) =>
          resetAfterSave &&
          session.status === 'stopped' &&
          session.kind === latest.kind &&
          session.startedAt === latest.startedAt,
      )
      if (alreadyQueued) return

      setState(pauseTimer(latest))
      await persistSession(
        {
          intention: latest.intention,
          kind: latest.kind,
          plannedSeconds: latest.plannedSeconds,
          actualSeconds: latest.elapsedSeconds,
          status: 'stopped',
          startedAt: latest.startedAt ?? Date.now(),
          endedAt: Date.now(),
        },
        true,
      )
    } finally {
      stoppingRef.current = false
    }
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
    lastTickAtRef.current = performance.now()
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
    hasUnsavedSessions,
    retrySave,
  }
}
