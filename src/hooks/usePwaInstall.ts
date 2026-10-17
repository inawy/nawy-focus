import { useCallback, useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  const nav = window.navigator as Navigator & { standalone?: boolean }
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    nav.standalone === true
  )
}

/**
 * Captures `beforeinstallprompt` and exposes install() for a user gesture.
 * On iOS Safari the event never fires — show manual tip instead.
 */
export function usePwaInstall() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  )
  const [installed, setInstalled] = useState(() => isStandalone())
  const [iosHint, setIosHint] = useState(false)

  useEffect(() => {
    if (isStandalone()) {
      setInstalled(true)
      return
    }

    const onBip = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => {
      setInstalled(true)
      setDeferred(null)
      setIosHint(false)
    }

    window.addEventListener('beforeinstallprompt', onBip)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBip)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const canInstall = !installed && deferred !== null

  const isIos =
    typeof navigator !== 'undefined' &&
    /iphone|ipad|ipod/i.test(navigator.userAgent)

  const showInstall =
    !installed && (canInstall || (isIos && !isStandalone()))

  const install = useCallback(async () => {
    if (deferred) {
      await deferred.prompt()
      const choice = await deferred.userChoice
      if (choice.outcome === 'accepted') {
        setInstalled(true)
        setDeferred(null)
      }
      return
    }
    if (isIos) {
      setIosHint(true)
    }
  }, [deferred, isIos])

  const dismissIosHint = useCallback(() => setIosHint(false), [])

  return {
    canInstall,
    showInstall,
    installed,
    install,
    iosHint,
    dismissIosHint,
    isIos,
  }
}
