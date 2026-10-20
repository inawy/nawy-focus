import { useCallback, useEffect, useRef, useState } from 'react'

export type StopwatchPhase = 'idle' | 'running' | 'paused'

/**
 * Count-up stopwatch with millisecond display precision.
 * Wall-clock elapsed time prevents losing time when the browser throttles RAF
 * or the user pauses the stopwatch while the tab is in the background.
 */
export function useStopwatch() {
  const [phase, setPhase] = useState<StopwatchPhase>('idle')
  const [elapsedMs, setElapsedMs] = useState(0)
  const rafRef = useRef<number | null>(null)
  const startedAtRef = useRef(0)
  const baseMsRef = useRef(0)
  const liveMsRef = useRef(0)

  const clearRaf = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  const readElapsed = useCallback(() => {
    if (phase !== 'running') return baseMsRef.current
    return baseMsRef.current + Math.max(0, Date.now() - startedAtRef.current)
  }, [phase])

  useEffect(() => {
    if (phase !== 'running') {
      clearRaf()
      return
    }

    startedAtRef.current = Date.now()
    const tick = () => {
      const next = baseMsRef.current + Math.max(0, Date.now() - startedAtRef.current)
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

  const reset = useCallback(() => {
    clearRaf()
    baseMsRef.current = 0
    liveMsRef.current = 0
    startedAtRef.current = 0
    setElapsedMs(0)
    setPhase('idle')
  }, [clearRaf])

  return {
    phase,
    elapsedMs,
    elapsedSeconds: Math.floor(elapsedMs / 1000),
    start,
    pause,
    resume,
    reset,
  }
}
