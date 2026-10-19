import type { SessionKind } from '../types'

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported'
  }
  return Notification.permission
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false
  }
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  try {
    const result = await Notification.requestPermission()
    return result === 'granted'
  } catch {
    return false
  }
}

export function notifySessionComplete(kind: SessionKind): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return
  if (Notification.permission !== 'granted') return
  try {
    const title = kind === 'focus' ? 'اكتملت جلسة التركيز' : 'انتهت فترة الراحة'
    const body =
      kind === 'focus'
        ? 'حان وقت راحة قصيرة'
        : 'يمكنك بدء جلسة تركيز جديدة'
    const n = new Notification(title, {
      body,
      icon: './icons/icon-192.png',
      badge: './icons/icon-192.png',
      tag: 'nawy-focus-complete',
      silent: false,
    })
    n.onclick = () => {
      window.focus()
      n.close()
    }
  } catch {
    // ignore
  }
}
