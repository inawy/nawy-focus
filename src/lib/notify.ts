/**
 * Optional desktop notifications when a session ends in a background tab.
 * iOS Safari often blocks these — failures are silent by design.
 */

import { loadNotificationsEnabled } from './prefs'

export type NotificationPermissionState =
  | 'unsupported'
  | 'default'
  | 'granted'
  | 'denied'

export function getNotificationPermission(): NotificationPermissionState {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported'
  }
  return Notification.permission as 'default' | 'granted' | 'denied'
}

/** Ask the user once. Returns true if granted. */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  try {
    const result = await Notification.requestPermission()
    return result === 'granted'
  } catch {
    return false
  }
}

export function canNotify(): boolean {
  return (
    loadNotificationsEnabled() &&
    getNotificationPermission() === 'granted' &&
    typeof document !== 'undefined' &&
    document.visibilityState === 'hidden'
  )
}

export function notifySessionFinished(kind: 'focus' | 'break'): void {
  if (!canNotify()) return
  try {
    const title = kind === 'focus' ? 'اكتملت جلسة التركيز' : 'انتهت فترة الراحة'
    const body =
      kind === 'focus'
        ? 'حان وقت راحة قصيرة'
        : 'يمكنك بدء جلسة تركيز جديدة'
    const n = new Notification(title, {
      body,
      icon: './icons/icon-192.png',
      tag: 'nawy-focus-session-end',
      silent: false,
    })
    n.onclick = () => {
      window.focus()
      n.close()
    }
  } catch {
    // blocked / unsupported
  }
}
