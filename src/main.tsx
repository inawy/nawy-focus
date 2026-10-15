import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'

const root = document.getElementById('root')
if (!root) throw new Error('Root element #root not found')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

/**
 * Auto-update PWA:
 * - checks for a new service worker on load and every hour
 * - when a new version is found, activates it and reloads once
 *   so the user always lands on the latest deploy
 */
registerSW({
  immediate: true,
  onRegisteredSW(swUrl, registration) {
    if (!registration) return

    const check = () => {
      void registration.update()
    }

    // Re-check when the tab becomes visible (common after a deploy)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') check()
    })

    // Periodic check while the app stays open
    window.setInterval(check, 60 * 60 * 1000)

    if (import.meta.env.DEV) {
      console.info('[pwa] registered', swUrl)
    }
  },
  onNeedRefresh() {
    // autoUpdate + skipWaiting: reload to pick up the new shell
    window.location.reload()
  },
  onOfflineReady() {
    if (import.meta.env.DEV) {
      console.info('[pwa] ready to work offline')
    }
  },
})
