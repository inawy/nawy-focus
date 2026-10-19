import { useCallback, useEffect, useRef, useState } from 'react'

export type StopwatchPhase = 'idle' | 'running' | 'paused'

/**
 * Count-up stopwatch — independent from session countdown timer.
 */
export function useStopwatch() {
  const [phase, setPhase] = useState<StopwatchPhase>('idle')
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const intervalRef = useRef<number | null>(null)
  const lastTickAtRef = useRef(Date.now())

  const clearTick = useCallback(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  useEffect(() => {
    if (phase === 'running') {
      lastTickAtRef.current = Date.now()
      intervalRef.current = window.setInterval(() => {
        lastTickAtRef.current = Date.now()
        setElapsedSeconds((s) => s + 1)
      }, 1000)
    } else {
      clearTick()
    }
    return clearTick
  }, [phase, clearTick])

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState !== 'visible' || phase !== 'running') return
      const gap = Math.floor((Date.now() - lastTickAtRef.current) / 1000)
      if (gap >= 2) {
        lastTickAtRef.current = Date.now()
        setElapsedSeconds((s) => s + gap)
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [phase])

  const start = useCallback(() => setPhase('running'), [])
  const pause = useCallback(() => setPhase('paused'), [])
  const resume = useCallback(() => setPhase('running'), [])
  const reset = useCallback(() => {
    setPhase('idle')
    setElapsedSeconds(0)
  }, [])

  return {
    phase,
    elapsedSeconds,
    start,
    pause,
    resume,
    reset,
  }
}
