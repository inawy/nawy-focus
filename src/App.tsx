import { useCallback, useEffect, useRef, useState } from 'react'
import { DurationPicker } from './components/DurationPicker'
import { HistoryList } from './components/HistoryList'
import { IntentionInput } from './components/IntentionInput'
import { SessionControls } from './components/SessionControls'
import { TimerDisplay } from './components/TimerDisplay'
import { useFullscreen } from './hooks/useFullscreen'
import { useSessions } from './hooks/useSessions'
import { useTimer } from './hooks/useTimer'
import { useWakeLock } from './hooks/useWakeLock'
import { formatDurationShort } from './lib/format'
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

  useEffect(() => {
    if (isActive(state.phase)) setSettingsOpen(false)
  }, [state.phase])

  const requestStop = useCallback(() => {
    if (state.elapsedSeconds > 0) {
      const ok = window.confirm('إنهاء الجلسة الآن وحفظ الوقت المقضي؟')
      if (!ok) return
    }
    stop()
  }, [state.elapsedSeconds, stop])

  const locked = isActive(state.phase) || state.phase === 'finished'
  const sessionFocus = isActive(state.phase)

  // Prevent screen sleep during an active session (mobile-friendly)
  useWakeLock(state.phase === 'running')

  const handleStart = useCallback(() => {
    start()
    void enterFs()
  }, [start, enterFs])

  const handleStartBreak = useCallback(() => {
    clearAutoBreakTimer()
    startBreak()
    void enterFs()
  }, [clearAutoBreakTimer, startBreak, enterFs])

  const handleReset = useCallback(() => {
    if (isActive(state.phase) || state.elapsedSeconds > 0) {
      const ok = window.confirm('إعادة تعيين المؤقت؟ سيُفقد الوقت الحالي.')
      if (!ok) return
    }
    reset()
  }, [state.phase, state.elapsedSeconds, reset])

  const handleResume = useCallback(() => {
    resume()
    void enterFs()
  }, [resume, enterFs])

  // Global shortcuts: Space start/pause/resume, Esc stop/close, F fullscreen
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) {
        return
      }
      if (e.key === 'Escape') {
        if (settingsOpen) {
          setSettingsOpen(false)
          return
        }
        if (isActive(state.phase)) {
          e.preventDefault()
          requestStop()
        }
        return
      }
      if (e.key === 'f' || e.key === 'F' || e.key === 'ء') {
        e.preventDefault()
        void toggleFs()
        return
      }
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault()
        if (state.phase === 'idle') handleStart()
        else if (state.phase === 'running') pause()
        else if (state.phase === 'paused') handleResume()
        else if (state.phase === 'finished') handleReset()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [
    state.phase,
    settingsOpen,
    handleStart,
    handleResume,
    handleReset,
    pause,
    requestStop,
    toggleFs,
  ])

  const toggleSound = () => {
    setSoundOn((v) => {
      const next = !v
      saveSoundEnabled(next)
      return next
    })
  }
  const toggleVibrate = () => {
    setVibrateOn((v) => {
      const next = !v
      saveVibrateEnabled(next)
      return next
    })
  }
  const toggleAutoBreak = () => {
    setAutoBreak((v) => {
      const next: AutoBreakMode = v === 'auto' ? 'off' : 'auto'
      saveAutoBreakMode(next)
      return next
    })
  }
  const toggleNotifications = async () => {
    if (!notifyOn) {
      const granted = await requestNotificationPermission()
      if (!granted) {
        const perm = getNotificationPermission()
        window.alert(
          perm === 'denied'
            ? 'الإشعارات محظورة من إعدادات المتصفح'
            : 'لم يتم منح إذن الإشعارات',
        )
        return
      }
    }
    setNotifyOn((v) => {
      const next = !v
      saveNotificationsEnabled(next)
      return next
    })
  }

  const settingsActiveCount =
    (soundOn ? 0 : 1) +
    (vibrateOn ? 0 : 1) +
    (autoBreak === 'auto' ? 1 : 0) +
    (notifyOn ? 1 : 0)

  return (
    <div className="min-h-dvh text-slate-100">
      <header
        className={`sticky top-0 z-20 border-b border-white/[0.06] bg-[#0e0e10]/70 px-4 pt-[max(0.5rem,env(safe-area-inset-top))] backdrop-blur-xl transition-all duration-300 ${
          sessionFocus ? 'pb-2.5' : 'pb-3.5'
        }`}
      >
        <div className="mx-auto flex max-w-md items-center justify-between gap-2">
          <h1
            className={`flex items-center gap-2 font-semibold tracking-tight text-slate-50 transition-all duration-300 ${
              sessionFocus ? 'text-[15px] opacity-60' : 'text-base'
            }`}
          >
            <img
              src="./icons/icon.svg"
              alt=""
              width={28}
              height={28}
              className={`rounded-[7px] shadow-[0_0_16px_rgba(61,123,255,0.35)] transition-all duration-300 ${
                sessionFocus ? 'h-5 w-5' : 'h-7 w-7'
              }`}
              aria-hidden
            />
            ناوي فوكاس
          </h1>

          <div className="flex items-center gap-1.5" ref={settingsRef}>
            <button
              type="button"
              onClick={() => void toggleFs()}
              className="btn-chrome"
              title="ملء الشاشة (F)"
              aria-label={fullscreen ? 'خروج من ملء الشاشة' : 'ملء الشاشة'}
            >
              {fullscreen ? 'خروج' : 'ملء الشاشة'}
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setSettingsOpen((v) => !v)}
                className={`btn-chrome relative min-w-11 px-2 text-base ${
                  settingsOpen ? 'border-white/25 bg-white/10 text-slate-50' : ''
                }`}
                title="الإعدادات"
                aria-label="الإعدادات"
                aria-expanded={settingsOpen}
                aria-haspopup="true"
              >
                ⋯
                {settingsActiveCount > 0 && !settingsOpen && (
                  <span
                    className="absolute -top-0.5 -start-0.5 h-2 w-2 rounded-full bg-brand-500"
                    aria-hidden
                  />
                )}
              </button>

              {settingsOpen && (
                <div
                  className="absolute end-0 top-full z-30 mt-2 w-56 rounded-2xl border border-white/10 bg-[#1c1c1e]/95 p-1.5 shadow-2xl shadow-black/50 backdrop-blur-xl"
                  role="menu"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={toggleSound}
                    className="flex min-h-11 w-full items-center justify-between gap-2 rounded-xl px-3 text-sm text-slate-200 transition hover:bg-white/[0.06]"
                    aria-pressed={soundOn}
                  >
                    <span>الصوت</span>
                    <span
                      className={`text-xs font-medium ${
                        soundOn ? 'text-brand-300' : 'text-slate-500'
                      }`}
                    >
                      {soundOn ? 'تشغيل' : 'إيقاف'}
                    </span>
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={toggleVibrate}
                    className="flex min-h-11 w-full items-center justify-between gap-2 rounded-xl px-3 text-sm text-slate-200 transition hover:bg-white/[0.06]"
                    aria-pressed={vibrateOn}
                  >
                    <span>الاهتزاز</span>
                    <span
                      className={`text-xs font-medium ${
                        vibrateOn ? 'text-brand-300' : 'text-slate-500'
                      }`}
                    >
                      {vibrateOn ? 'تشغيل' : 'إيقاف'}
                    </span>
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={toggleAutoBreak}
                    className={`flex min-h-11 w-full items-center justify-between gap-2 rounded-xl px-3 text-sm transition hover:bg-white/[0.06] ${
                      autoBreak === 'auto' ? 'text-brand-300' : 'text-slate-200'
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
                    className={`flex min-h-11 w-full items-center justify-between gap-2 rounded-xl px-3 text-sm transition hover:bg-white/[0.06] ${
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
        className={`mx-auto flex max-w-md flex-col items-center px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-6 transition-all duration-300 ${
          state.phase === 'finished'
            ? 'gap-5'
            : sessionFocus
              ? 'gap-3'
              : 'gap-6'
        }`}
      >
        {finishedWhileHidden && state.phase === 'finished' && (
          <div
            className="w-full max-w-sm rounded-2xl border border-amber-500/30 bg-amber-950/30 px-4 py-3 text-center text-sm text-amber-100"
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
            className="w-full max-w-sm rounded-2xl border border-brand-500/25 bg-brand-950/40 px-5 py-4 shadow-[0_0_40px_-16px_rgba(61,123,255,0.35)]"
            role="status"
            aria-live="polite"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-brand-100">
                ستبدأ الراحة خلال
              </p>
              <span className="font-mono text-2xl font-semibold tabular-nums text-brand-200">
                {autoBreakCountdown}
                <span className="ms-0.5 text-sm font-normal text-brand-400/80">
                  ث
                </span>
              </span>
            </div>
            <div
              className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/40"
              aria-hidden
            >
              <div
                className="h-full rounded-full bg-brand-500 transition-[width] duration-1000 linear"
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
            <div className="mt-3 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={handleStartBreak}
                className="btn-chrome border-brand-500/40 text-brand-200"
              >
                ابدأ الآن
              </button>
              <button
                type="button"
                onClick={clearAutoBreakTimer}
                className="btn-chrome"
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

        {state.phase === 'idle' && todaySeconds > 0 && (
          <p className="text-center text-[12px] text-slate-500" aria-live="polite">
            اليوم {formatDurationShort(todaySeconds)}
            {todayFocusCount > 0 ? ` · ${todayFocusCount} جلسة` : ''}
          </p>
        )}

        {sessionFocus ? (
          state.intention ? (
            <p className="max-w-sm text-center text-xs text-slate-500">
              {state.intention}
            </p>
          ) : null
        ) : state.phase === 'finished' ? null : locked && state.intention ? (
          <p className="max-w-sm text-center text-sm text-slate-400">
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
          onResume={handleResume}
          onStop={requestStop}
          onReset={handleReset}
          onStartBreak={handleStartBreak}
        />

        {state.phase === 'idle' && (
          <p className="hidden text-center text-[11px] text-slate-600 sm:block">
            مفتاح المسافة للبدء · F لملء الشاشة · Esc للإنهاء
          </p>
        )}

        {!sessionFocus && (
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
            onExport={downloadBackup}
            onExportCsv={downloadCsv}
            onImportFile={uploadBackup}
            onDelete={removeSession}
            onCopySession={copySessionText}
            backupMessage={backupMessage}
          />
        )}

        {!sessionFocus && (
          <footer className="mt-2 pb-4 text-center text-[11px] text-slate-600">
            <p className="mb-1">جزء من منظومة ناوي للإنتاجية</p>
            <a
              href="https://nawy.to/focus"
              className="text-slate-500 underline-offset-2 transition hover:text-slate-400 hover:underline"
              rel="noopener noreferrer"
            >
              nawy.to/focus
            </a>
          </footer>
        )}
      </main>
    </div>
  )
}
