import { useCallback, useEffect, useRef, useState } from 'react'

export type StopwatchPhase = 'idle' | 'running' | 'paused'

/**
 * Count-up stopwatch with millisecond precision (Avast-style MM:SS.MS).
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

  useEffect(() => {
    if (phase !== 'running') {
      clearRaf()
      return
    }
    startedAtRef.current = performance.now()
    const tick = () => {
      const now = performance.now()
      const next = baseMsRef.current + (now - startedAtRef.current)
      liveMsRef.current = next
      setElapsedMs(next)
      rafRef.current = requestAnimationFrame(tick)
    }
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
    baseMsRef.current = liveMsRef.current
    setElapsedMs(liveMsRef.current)
    setPhase('paused')
  }, [])

  const resume = useCallback(() => {
    setPhase('running')
  }, [])

  const reset = useCallback(() => {
    clearRaf()
    baseMsRef.current = 0
    liveMsRef.current = 0
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
