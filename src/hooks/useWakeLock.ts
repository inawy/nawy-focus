import { useEffect, useRef } from 'react'

type WakeLockSentinelLike = {
  release: () => Promise<void>
  addEventListener: (
    type: 'release',
    listener: () => void,
  ) => void
}

type WakeLockNavigator = Navigator & {
  wakeLock?: {
    request: (type: 'screen') => Promise<WakeLockSentinelLike>
  }
}

/**
 * Keep the screen awake while `active` is true (running session).
 * Silently no-ops when the API is missing or the request is denied.
 */
export function useWakeLock(active: boolean): void {
  const lockRef = useRef<WakeLockSentinelLike | null>(null)

  useEffect(() => {
    if (!active) {
      void lockRef.current?.release().catch(() => {})
      lockRef.current = null
      return
    }

    const nav = navigator as WakeLockNavigator
    if (!nav.wakeLock?.request) return

    let cancelled = false

    const request = async () => {
      try {
        const sentinel = await nav.wakeLock!.request('screen')
        if (cancelled) {
          void sentinel.release().catch(() => {})
          return
        }
        lockRef.current = sentinel
        sentinel.addEventListener('release', () => {
          if (lockRef.current === sentinel) lockRef.current = null
        })
      } catch {
        // denied / unsupported in this context
      }
    }

    void request()

    const onVisible = () => {
      if (
        document.visibilityState === 'visible' &&
        active &&
        !lockRef.current
      ) {
        void request()
      }
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisible)
      void lockRef.current?.release().catch(() => {})
      lockRef.current = null
    }
  }, [active])
}
