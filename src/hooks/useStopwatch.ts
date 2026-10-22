import { useCallback, useEffect, useRef, useState } from 'react'
import {
  createStopwatchLap,
  getStopwatchElapsed,
  type StopwatchLap,
} from '../lib/stopwatch'

export type StopwatchPhase = 'idle' | 'running' | 'paused'

/**
 * Count-up stopwatch with millisecond display precision and lap/split tracking.
 * Wall-clock elapsed time prevents losing time when the browser throttles RAF.
 */
export function useStopwatch() {
  const [phase, setPhase] = useState<StopwatchPhase>('idle')
  const [elapsedMs, setElapsedMs] = useState(0)
  const [laps, setLaps] = useState<StopwatchLap[]>([])
  const rafRef = useRef<number | null>(null)
  const startedAtRef = useRef(0)
  const baseMsRef = useRef(0)
  const liveMsRef = useRef(0)
  const lapsRef = useRef<StopwatchLap[]>([])

  const clearRaf = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  const readElapsed = useCallback(() => {
    if (phase !== 'running') return baseMsRef.current
    return getStopwatchElapsed(
      baseMsRef.current,
      startedAtRef.current,
      Date.now(),
      liveMsRef.current,
    )
  }, [phase])

  useEffect(() => {
    if (phase !== 'running') {
      clearRaf()
      return
    }

    startedAtRef.current = Date.now()
    const tick = () => {
      const next = getStopwatchElapsed(
        baseMsRef.current,
        startedAtRef.current,
        Date.now(),
        liveMsRef.current,
      )
      liveMsRef.current = next
      setElapsedMs(next)
      rafRef.current = requestAnimationFrame(tick)
    }
    liveMsRef.current = baseMsRef.current
    rafRef.current = requestAnimationFrame(tick)
    return clearRaf
  }, [phase, clearRaf])

  const start = useCallback(() => {
    baseMsRef.current = 0
    liveMsRef.current = 0
    lapsRef.current = []
    setLaps([])
    setElapsedMs(0)
    setPhase('running')
  }, [])

  const pause = useCallback(() => {
    const exactElapsed = readElapsed()
    baseMsRef.current = exactElapsed
    liveMsRef.current = exactElapsed
    setElapsedMs(exactElapsed)
    setPhase('paused')
  }, [readElapsed])

  const resume = useCallback(() => {
    setPhase('running')
  }, [])

  const recordLap = useCallback(() => {
    if (phase === 'idle') return
    const exactElapsed = readElapsed()
    const lap = createStopwatchLap(exactElapsed, lapsRef.current)
    const nextLaps = [lap, ...lapsRef.current]
    lapsRef.current = nextLaps
    setLaps(nextLaps)
    return lap
  }, [phase, readElapsed])

  const reset = useCallback(() => {
    clearRaf()
    baseMsRef.current = 0
    liveMsRef.current = 0
    startedAtRef.current = 0
    lapsRef.current = []
    setLaps([])
    setElapsedMs(0)
    setPhase('idle')
  }, [clearRaf])

  return {
    phase,
    elapsedMs,
    elapsedSeconds: Math.floor(elapsedMs / 1000),
    laps,
    start,
    pause,
    resume,
    recordLap,
    reset,
  }
}
