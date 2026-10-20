import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import './ux-polish.css'
import App from './App.tsx'

const root = document.getElementById('root')
if (!root) throw new Error('Root element #root not found')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

/**
 * Keep installed and open clients fresh:
 * - activate updated service workers automatically
 * - check on startup, tab return, focus, and every 30 seconds while visible
 * - version the document URL after an update to avoid a stale HTML shell
 */
let updateReloadStarted = false

function reloadWithFreshDocumentUrl() {
  if (updateReloadStarted) return
  updateReloadStarted = true
  const url = new URL(window.location.href)
  url.searchParams.set('v', '6')
  window.location.replace(url.toString())
}

registerSW({
  immediate: true,
  onRegisteredSW(_swUrl, registration) {
    if (!registration) return

    const checkForUpdate = () => {
      if (document.visibilityState === 'visible') {
        void registration.update().catch(() => {
          // Offline or temporarily unavailable: retry on the next visibility check.
        })
      }
    }

    // Re-check immediately after registration and whenever the user returns.
    checkForUpdate()
    document.addEventListener('visibilitychange', checkForUpdate)
    window.addEventListener('focus', checkForUpdate)
    window.addEventListener('pageshow', checkForUpdate)

    // Keep an open tab current without waiting an hour.
    window.setInterval(checkForUpdate, 30_000)

    if (import.meta.env.DEV) {
      console.info('[pwa] registered', _swUrl)
    }
  },
  onNeedRefresh() {
    reloadWithFreshDocumentUrl()
  },
  onOfflineReady() {
    if (import.meta.env.DEV) {
      console.info('[pwa] ready to work offline')
    }
  },
})
