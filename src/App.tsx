import { useCallback, useEffect, useRef, useState } from 'react'
import { DurationPicker } from './components/DurationPicker'
import { HistoryList } from './components/HistoryList'
import { IntentionInput } from './components/IntentionInput'
import { SessionControls } from './components/SessionControls'
import { TimerDisplay } from './components/TimerDisplay'
import { useFullscreen } from './hooks/useFullscreen'
import { useSessions } from './hooks/useSessions'
import { useTimer } from './hooks/useTimer'
import { isActive } from './lib/timer'
import {
  loadAutoBreakDelaySeconds,
  loadAutoBreakMode,
  loadNotificationsEnabled,
  loadSoundEnabled,
  loadVibrateEnabled,
  saveAutoBreakMode,
  saveNotificationsEnabled,
  saveSoundEnabled,
  saveVibrateEnabled,
  type AutoBreakMode,
} from './lib/prefs'
import {
  getNotificationPermission,
  requestNotificationPermission,
} from './lib/notify'

export default function App() {
  const {
    state,
    start,
    pause,
    resume,
    stop,
    reset,
    startBreak,
    updateIntention,
    updatePlanned,
    updateKind,
    finishedWhileHidden,
    dismissFinishedBanner,
  } = useTimer()

  const {
    sessions,
    filter,
    setFilter,
    todaySeconds,
    weekSeconds,
    todayFocusCount,
    weekFocusCount,
    bestHour,
    recentIntentions,
    loading,
    refresh,
    removeSession,
    copySessionText,
    downloadBackup,
    downloadCsv,
    uploadBackup,
    backupMessage,
  } = useSessions()

  const { active: fullscreen, enter: enterFs, exit: exitFs, toggle: toggleFs } =
    useFullscreen()

  const [soundOn, setSoundOn] = useState(() => loadSoundEnabled())
  const [vibrateOn, setVibrateOn] = useState(() => loadVibrateEnabled())
  const [autoBreak, setAutoBreak] = useState<AutoBreakMode>(() =>
    loadAutoBreakMode(),
  )
  const [notifyOn, setNotifyOn] = useState(() => loadNotificationsEnabled())
  const [autoBreakCountdown, setAutoBreakCountdown] = useState<number | null>(
    null,
  )
  const [autoBreakDelayTotal, setAutoBreakDelayTotal] = useState(5)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const settingsRef = useRef<HTMLDivElement | null>(null)
  const autoBreakTimerRef = useRef<number | null>(null)

  const clearAutoBreakTimer = useCallback(() => {
    if (autoBreakTimerRef.current !== null) {
      window.clearInterval(autoBreakTimerRef.current)
      autoBreakTimerRef.current = null
    }
    setAutoBreakCountdown(null)
  }, [])

  useEffect(() => {
    if (state.phase === 'finished' || state.phase === 'idle') {
      void refresh()
    }
  }, [state.phase, refresh])

  useEffect(() => {
    if (state.phase === 'finished' || state.phase === 'idle') {
      void exitFs()
    }
  }, [state.phase, exitFs])

  // B2: auto-start break countdown after focus finishes
  useEffect(() => {
    clearAutoBreakTimer()
    if (
      state.phase === 'finished' &&
      state.kind === 'focus' &&
      autoBreak === 'auto'
    ) {
      const delay = loadAutoBreakDelaySeconds()
      setAutoBreakDelayTotal(delay)
      setAutoBreakCountdown(delay)
      autoBreakTimerRef.current = window.setInterval(() => {
        setAutoBreakCountdown((prev) => {
          if (prev === null) return null
          if (prev <= 1) {
            if (autoBreakTimerRef.current !== null) {
              window.clearInterval(autoBreakTimerRef.current)
              autoBreakTimerRef.current = null
            }
            startBreak()
            void enterFs()
            return null
          }
          return prev - 1
        })
      }, 1000)
    }
    return clearAutoBreakTimer
  }, [state.phase, state.kind, autoBreak, clearAutoBreakTimer, startBreak, enterFs])

  // Dismiss hidden-finish banner when user interacts
  useEffect(() => {
    if (state.phase !== 'finished' && state.phase !== 'idle') {
      dismissFinishedBanner()
    }
  }, [state.phase, dismissFinishedBanner])

  useEffect(() => {
    if (!isActive(state.phase)) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [state.phase])

  // Close settings panel on outside click / Escape
  useEffect(() => {
    if (!settingsOpen) return
    const onPointer = (e: MouseEvent) => {
      if (
        settingsRef.current &&
        !settingsRef.current.contains(e.target as Node)
      ) {
        setSettingsOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSettingsOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [settingsOpen])

  // Collapse settings while a session is active (quieter chrome)
  useEffect(() => {
    if (isActive(state.phase)) setSettingsOpen(false)
  }, [state.phase])

  const requestStop = useCallback(() => {
    if (state.elapsedSeconds > 0) {
      const ok = window.confirm('إنهاء الجلسة الآن وحفظ الوقت المقضي؟')
      if (!ok) return
    }
    clearAutoBreakTimer()
    void stop()
  }, [state.elapsedSeconds, stop, clearAutoBreakTimer])

  const handleStart = useCallback(() => {
    clearAutoBreakTimer()
    setSettingsOpen(false)
    start()
    void enterFs()
  }, [start, enterFs, clearAutoBreakTimer])

  const handleStartBreak = useCallback(() => {
    clearAutoBreakTimer()
    setSettingsOpen(false)
    startBreak()
    void enterFs()
  }, [startBreak, enterFs, clearAutoBreakTimer])

  const handleReset = useCallback(() => {
    clearAutoBreakTimer()
    reset()
  }, [reset, clearAutoBreakTimer])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        if (state.phase === 'idle') handleStart()
        else if (state.phase === 'running') pause()
        else if (state.phase === 'paused') resume()
        else if (state.phase === 'finished') {
          if (state.kind === 'focus') handleStartBreak()
          else handleReset()
        }
      } else if (e.key === 'Escape' && isActive(state.phase)) {
        if (fullscreen) {
          void exitFs()
          return
        }
        e.preventDefault()
        requestStop()
      } else if ((e.key === 'f' || e.key === 'F') && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        void toggleFs()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [
    state.phase,
    state.kind,
    handleStart,
    handleStartBreak,
    handleReset,
    pause,
    resume,
    requestStop,
    fullscreen,
    exitFs,
    toggleFs,
  ])

  const locked = isActive(state.phase)
  const sessionFocus = state.phase === 'running' || state.phase === 'paused'

  const toggleSound = () => {
    const next = !soundOn
    setSoundOn(next)
    saveSoundEnabled(next)
  }

  const toggleVibrate = () => {
    const next = !vibrateOn
    setVibrateOn(next)
    saveVibrateEnabled(next)
  }

  const toggleAutoBreak = () => {
    const next: AutoBreakMode = autoBreak === 'auto' ? 'off' : 'auto'
    setAutoBreak(next)
    saveAutoBreakMode(next)
  }

  const toggleNotifications = async () => {
    if (!notifyOn) {
      const granted = await requestNotificationPermission()
      if (!granted) {
        const perm = getNotificationPermission()
        if (perm === 'denied') {
          window.alert(
            'الإشعارات مرفوضة من المتصفح. فعّلها من إعدادات الموقع إن أردت.',
          )
        } else if (perm === 'unsupported') {
          window.alert('هذا المتصفح لا يدعم إشعارات سطح المكتب.')
        }
        return
      }
      setNotifyOn(true)
      saveNotificationsEnabled(true)
    } else {
      setNotifyOn(false)
      saveNotificationsEnabled(false)
    }
  }

  const settingsActiveCount =
    (soundOn ? 0 : 1) +
    (vibrateOn ? 0 : 1) +
    (autoBreak === 'auto' ? 1 : 0) +
    (notifyOn ? 1 : 0)

  return (
    <div className="min-h-dvh bg-slate-950 text-slate-100">
      <header
        className={`border-b border-slate-800/80 px-4 transition-all duration-300 ${
          sessionFocus ? 'py-2.5' : 'py-4'
        }`}
      >
        <div className="mx-auto flex max-w-lg items-center justify-between gap-2">
          <h1
            className={`font-semibold tracking-tight text-slate-50 transition-all duration-300 ${
              sessionFocus ? 'text-base opacity-70' : 'text-lg'
            }`}
          >
            ناوي فوكاس
          </h1>

          <div className="flex items-center gap-1.5" ref={settingsRef}>
            <button
              type="button"
              onClick={() => void toggleFs()}
              className="min-h-11 rounded-lg border border-slate-700 px-2.5 text-xs text-slate-300 transition hover:border-slate-500 hover:text-slate-100"
              title="ملء الشاشة (F)"
              aria-label={fullscreen ? 'خروج من ملء الشاشة' : 'ملء الشاشة'}
            >
              {fullscreen ? 'خروج' : 'ملء الشاشة'}
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setSettingsOpen((v) => !v)}
                className={`relative min-h-11 min-w-11 rounded-lg border px-2 text-base transition ${
                  settingsOpen
                    ? 'border-slate-500 bg-slate-800 text-slate-100'
                    : 'border-slate-700 text-slate-300 hover:border-slate-500 hover:text-slate-100'
                }`}
                title="الإعدادات"
                aria-label="الإعدادات"
                aria-expanded={settingsOpen}
                aria-haspopup="true"
              >
                ⋯
                {settingsActiveCount > 0 && !settingsOpen && (
                  <span
                    className="absolute -top-0.5 -start-0.5 h-2 w-2 rounded-full bg-sky-400"
                    aria-hidden
                  />
                )}
              </button>

              {settingsOpen && (
                <div
                  className="absolute end-0 top-full z-30 mt-2 w-56 rounded-xl border border-slate-700 bg-slate-900 p-2 shadow-xl shadow-black/40"
                  role="menu"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={toggleSound}
                    className="flex min-h-11 w-full items-center justify-between gap-2 rounded-lg px-3 text-sm text-slate-200 transition hover:bg-slate-800"
                    aria-pressed={soundOn}
                  >
                    <span>الصوت</span>
                    <span className="text-base" aria-hidden>
                      {soundOn ? '🔊' : '🔇'}
                    </span>
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={toggleVibrate}
                    className="flex min-h-11 w-full items-center justify-between gap-2 rounded-lg px-3 text-sm text-slate-200 transition hover:bg-slate-800"
                    aria-pressed={vibrateOn}
                  >
                    <span>الاهتزاز</span>
                    <span className="text-base" aria-hidden>
                      {vibrateOn ? '📳' : '📴'}
                    </span>
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={toggleAutoBreak}
                    className={`flex min-h-11 w-full items-center justify-between gap-2 rounded-lg px-3 text-sm transition hover:bg-slate-800 ${
                      autoBreak === 'auto' ? 'text-sky-300' : 'text-slate-200'
                    }`}
                    aria-pressed={autoBreak === 'auto'}
                  >
                    <span>راحة تلقائية</span>
                    <span className="text-xs text-slate-500">
                      {autoBreak === 'auto' ? 'تشغيل' : 'إيقاف'}
                    </span>
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => void toggleNotifications()}
                    className={`flex min-h-11 w-full items-center justify-between gap-2 rounded-lg px-3 text-sm transition hover:bg-slate-800 ${
                      notifyOn ? 'text-amber-300' : 'text-slate-200'
                    }`}
                    aria-pressed={notifyOn}
                  >
                    <span>إشعار</span>
                    <span className="text-xs text-slate-500">
                      {notifyOn ? 'تشغيل' : 'إيقاف'}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main
        className={`mx-auto flex max-w-lg flex-col items-center px-4 py-8 transition-all duration-300 ${
          sessionFocus ? 'gap-4' : 'gap-8'
        }`}
      >
        {finishedWhileHidden && state.phase === 'finished' && (
          <div
            className="w-full max-w-md rounded-xl border border-amber-500/40 bg-amber-950/40 px-4 py-3 text-center text-sm text-amber-100"
            role="status"
          >
            انتهت الجلسة أثناء غيابك عن التبويب.
            <button
              type="button"
              onClick={dismissFinishedBanner}
              className="ms-2 underline opacity-80 hover:opacity-100"
            >
              حسناً
            </button>
          </div>
        )}

        {autoBreakCountdown !== null && (
          <div
            className="w-full max-w-md rounded-2xl border border-sky-500/40 bg-sky-950/50 px-5 py-4"
            role="status"
            aria-live="polite"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-sky-100">
                ستبدأ الراحة خلال
              </p>
              <span className="font-mono text-2xl font-semibold tabular-nums text-sky-200">
                {autoBreakCountdown}
                <span className="ms-0.5 text-sm font-normal text-sky-400/80">
                  ث
                </span>
              </span>
            </div>
            <div
              className="mt-3 h-2 overflow-hidden rounded-full bg-sky-950"
              aria-hidden
            >
              <div
                className="h-full rounded-full bg-sky-400 transition-[width] duration-1000 linear"
                style={{
                  width: `${Math.max(
                    0,
                    Math.min(
                      100,
                      (autoBreakCountdown / Math.max(1, autoBreakDelayTotal)) *
                        100,
                    ),
                  )}%`,
                }}
              />
            </div>
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={clearAutoBreakTimer}
                className="min-h-10 rounded-lg border border-sky-600/40 px-4 text-sm text-sky-200 transition hover:border-sky-400 hover:bg-sky-900/40 hover:text-sky-50"
              >
                إلغاء
              </button>
            </div>
          </div>
        )}

        <TimerDisplay
          remainingSeconds={state.remainingSeconds}
          plannedSeconds={state.plannedSeconds}
          phase={state.phase}
          kind={state.kind}
        />

        {sessionFocus ? (
          state.intention ? (
            <p className="max-w-md text-center text-xs text-slate-500">
              {state.intention}
            </p>
          ) : null
        ) : state.phase === 'finished' ? null : locked && state.intention ? (
          <p className="max-w-md text-center text-sm text-slate-400">
            <span className="text-slate-500">النية: </span>
            {state.intention}
          </p>
        ) : (
          <IntentionInput
            value={state.intention}
            onChange={updateIntention}
            disabled={locked}
            suggestions={recentIntentions}
          />
        )}

        {!sessionFocus && state.phase !== 'finished' && (
          <DurationPicker
            kind={state.kind}
            plannedSeconds={state.plannedSeconds}
            onKindChange={updateKind}
            onSecondsChange={updatePlanned}
            disabled={locked}
          />
        )}

        <SessionControls
          phase={state.phase}
          kind={state.kind}
          plannedSeconds={state.plannedSeconds}
          elapsedSeconds={state.elapsedSeconds}
          onStart={handleStart}
          onPause={pause}
          onResume={resume}
          onStop={requestStop}
          onReset={handleReset}
          onStartBreak={handleStartBreak}
        />

        {!sessionFocus && (
          <p className="text-center text-[11px] text-slate-600">
            مسافة: ابدأ / إيقاف · F: ملء الشاشة · Esc: إنهاء
          </p>
        )}

        <div
          className={`w-full border-t border-slate-800 pt-6 transition-opacity duration-300 ${
            sessionFocus ? 'pointer-events-none opacity-20' : ''
          }`}
          aria-hidden={sessionFocus}
        >
          <HistoryList
            sessions={sessions}
            filter={filter}
            onFilterChange={setFilter}
            todaySeconds={todaySeconds}
            weekSeconds={weekSeconds}
            todayFocusCount={todayFocusCount}
            weekFocusCount={weekFocusCount}
            bestHour={bestHour}
            loading={loading}
            onExport={() => void downloadBackup()}
            onExportCsv={() => void downloadCsv()}
            onImportFile={(f) => void uploadBackup(f)}
            onDelete={(id) => void removeSession(id)}
            onCopySession={(s) => void copySessionText(s)}
            backupMessage={backupMessage}
          />
        </div>

        {!sessionFocus && (
          <footer className="w-full max-w-md border-t border-slate-800/80 pt-4 pb-2 text-center text-[11px] text-slate-600">
            <p className="mb-1">جزء من منظومة ناوي للإنتاجية</p>
            <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
              <a
                className="text-slate-500 underline-offset-2 hover:text-slate-300 hover:underline"
                href="https://github.com/inawy"
                target="_blank"
                rel="noreferrer"
              >
                GitHub
              </a>
              <a
                className="text-slate-500 underline-offset-2 hover:text-slate-300 hover:underline"
                href="https://nawy.to/focus"
                target="_blank"
                rel="noreferrer"
              >
                nawy.to/focus
              </a>
              <a
                className="text-slate-500 underline-offset-2 hover:text-slate-300 hover:underline"
                href="https://inawy.github.io/nawy-focus/"
                target="_blank"
                rel="noreferrer"
              >
                التطبيق المباشر
              </a>
            </p>
          </footer>
        )}
      </main>
    </div>
  )
}
