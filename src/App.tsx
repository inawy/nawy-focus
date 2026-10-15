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
    start()
    void enterFs()
  }, [start, enterFs, clearAutoBreakTimer])

  const handleStartBreak = useCallback(() => {
    clearAutoBreakTimer()
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

  return (
    <div className="min-h-dvh bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800/80 px-4 py-4">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-2">
          <h1 className="text-lg font-semibold tracking-tight text-slate-50">
            ناوي فوكاس
          </h1>
          <div className="flex flex-wrap items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={toggleSound}
              className="min-h-11 min-w-11 rounded-lg border border-slate-700 px-2 text-xs text-slate-300 transition hover:border-slate-500 hover:text-slate-100"
              title={soundOn ? 'كتم الصوت' : 'تشغيل الصوت'}
              aria-label={soundOn ? 'كتم الصوت' : 'تشغيل الصوت'}
              aria-pressed={soundOn}
            >
              {soundOn ? '🔊' : '🔇'}
            </button>
            <button
              type="button"
              onClick={toggleVibrate}
              className="min-h-11 min-w-11 rounded-lg border border-slate-700 px-2 text-xs text-slate-300 transition hover:border-slate-500 hover:text-slate-100"
              title={vibrateOn ? 'إيقاف الاهتزاز' : 'تفعيل الاهتزاز'}
              aria-label={vibrateOn ? 'إيقاف الاهتزاز' : 'تفعيل الاهتزاز'}
              aria-pressed={vibrateOn}
            >
              {vibrateOn ? '📳' : '📴'}
            </button>
            <button
              type="button"
              onClick={toggleAutoBreak}
              className={`min-h-11 rounded-lg border px-2 text-xs transition ${
                autoBreak === 'auto'
                  ? 'border-sky-600/60 bg-sky-950/40 text-sky-300'
                  : 'border-slate-700 text-slate-300 hover:border-slate-500 hover:text-slate-100'
              }`}
              title="بدء راحة تلقائياً بعد التركيز"
              aria-pressed={autoBreak === 'auto'}
            >
              راحة تلقائية
            </button>
            <button
              type="button"
              onClick={() => void toggleNotifications()}
              className={`min-h-11 rounded-lg border px-2 text-xs transition ${
                notifyOn
                  ? 'border-amber-600/60 bg-amber-950/30 text-amber-300'
                  : 'border-slate-700 text-slate-300 hover:border-slate-500 hover:text-slate-100'
              }`}
              title="إشعار عند انتهاء الجلسة في الخلفية"
              aria-pressed={notifyOn}
            >
              إشعار
            </button>
            <button
              type="button"
              onClick={() => void toggleFs()}
              className="min-h-11 rounded-lg border border-slate-700 px-2.5 py-1 text-xs text-slate-300 transition hover:border-slate-500 hover:text-slate-100"
              title="ملء الشاشة (F)"
            >
              {fullscreen ? 'خروج' : 'ملء الشاشة'}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-lg flex-col items-center gap-8 px-4 py-8">
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
            className="w-full max-w-md rounded-xl border border-sky-500/40 bg-sky-950/40 px-4 py-3 text-center text-sm text-sky-100"
            role="status"
          >
            ستبدأ الراحة خلال {autoBreakCountdown}ث…
            <button
              type="button"
              onClick={clearAutoBreakTimer}
              className="ms-2 underline opacity-80 hover:opacity-100"
            >
              إلغاء
            </button>
          </div>
        )}

        <TimerDisplay
          remainingSeconds={state.remainingSeconds}
          plannedSeconds={state.plannedSeconds}
          phase={state.phase}
          kind={state.kind}
        />

        {locked && state.intention ? (
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

        <DurationPicker
          kind={state.kind}
          plannedSeconds={state.plannedSeconds}
          onKindChange={updateKind}
          onSecondsChange={updatePlanned}
          disabled={locked}
        />

        <SessionControls
          phase={state.phase}
          kind={state.kind}
          onStart={handleStart}
          onPause={pause}
          onResume={resume}
          onStop={requestStop}
          onReset={handleReset}
          onStartBreak={handleStartBreak}
        />

        <p className="text-center text-[11px] text-slate-600">
          مسافة: ابدأ / إيقاف · F: ملء الشاشة · Esc: إنهاء
        </p>

        <div className="w-full border-t border-slate-800 pt-6">
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
      </main>
    </div>
  )
}
