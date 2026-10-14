/** Fullscreen helpers — browser differences handled */

export function isFullscreenActive(): boolean {
  return Boolean(document.fullscreenElement)
}

export async function enterFullscreen(el: HTMLElement = document.documentElement): Promise<void> {
  if (isFullscreenActive()) return
  const anyEl = el as HTMLElement & {
    webkitRequestFullscreen?: () => Promise<void> | void
  }
  if (el.requestFullscreen) {
    await el.requestFullscreen()
  } else if (anyEl.webkitRequestFullscreen) {
    await anyEl.webkitRequestFullscreen()
  }
}

export async function exitFullscreen(): Promise<void> {
  if (!isFullscreenActive()) return
  const doc = document as Document & {
    webkitExitFullscreen?: () => Promise<void> | void
  }
  if (document.exitFullscreen) {
    await document.exitFullscreen()
  } else if (doc.webkitExitFullscreen) {
    await doc.webkitExitFullscreen()
  }
}

export async function toggleFullscreen(el: HTMLElement = document.documentElement): Promise<boolean> {
  if (isFullscreenActive()) {
    await exitFullscreen()
    return false
  }
  await enterFullscreen(el)
  return true
}
