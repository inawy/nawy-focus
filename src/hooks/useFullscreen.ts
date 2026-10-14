import { useCallback, useEffect, useState } from 'react'
import {
  enterFullscreen,
  exitFullscreen,
  isFullscreenActive,
  toggleFullscreen,
} from '../lib/fullscreen'

export function useFullscreen() {
  const [active, setActive] = useState(false)

  useEffect(() => {
    const sync = () => setActive(isFullscreenActive())
    sync()
    document.addEventListener('fullscreenchange', sync)
    document.addEventListener('webkitfullscreenchange', sync as EventListener)
    return () => {
      document.removeEventListener('fullscreenchange', sync)
      document.removeEventListener('webkitfullscreenchange', sync as EventListener)
    }
  }, [])

  const enter = useCallback(async () => {
    try {
      await enterFullscreen()
    } catch {
      // user denied or unsupported
    }
  }, [])

  const exit = useCallback(async () => {
    try {
      await exitFullscreen()
    } catch {
      // ignore
    }
  }, [])

  const toggle = useCallback(async () => {
    try {
      await toggleFullscreen()
    } catch {
      // ignore
    }
  }, [])

  return { active, enter, exit, toggle }
}
