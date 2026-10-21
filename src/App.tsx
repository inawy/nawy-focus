import { useCallback, useEffect, useRef, useState } from 'react'
import { ConfirmDialog } from './components/ConfirmDialog'
import { DurationPicker } from './components/DurationPicker'
import { HistoryList } from './components/HistoryList'
import { IntentionInput } from './components/IntentionInput'
import { ModeTabs, type AppMode } from './components/ModeTabs'
import { SessionControls } from './components/SessionControls'
import {
  SessionTypeChips,
  SESSION_PRESETS,
  type SessionPreset,
} from './components/SessionTypeChips'
import { TimerDisplay } from './components/TimerDisplay'
import { usePwaInstall } from './hooks/usePwaInstall'
import { useSessions } from './hooks/useSessions'
import { useStopwatch } from './hooks/useStopwatch'
import { useTheme } from './hooks/useTheme'
import { useTimer } from './hooks/useTimer'
import { useWakeLock } from './hooks/useWakeLock'
import { playCompletionChime } from './lib/sound'
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
  loadInstallBannerDismissed,
  saveInstallBannerDismissed,
  type AutoBreakMode,
} from './lib/prefs'
import {
  getNotificationPermission,
  requestNotificationPermission,
} from './lib/notify'

function formatStopwatchLap(milliseconds: number) {
  const total = Math.max(0, Math.floor(milliseconds))
  const minutes = Math.floor(total / 60_000)
  const seconds = Math.floor((total % 60_000) / 1000)
  const centiseconds = Math.floor((total % 1000) / 10)
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`
}

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
    persistenceError,
    retrySave,
  } = useTimer()

  const [appMode, setAppMode] = useState<AppMode>('session')
  const [presetId, setPresetId] = useState<string>('focus')
  const stopwatch = useStopwatch()

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
    storageError,
    refresh,
    removeSession,
    copySessionText,
    downloadBackup,
    downloadCsv,
    uploadBackup,
    backupMessage,
  } = useSessions()

  const { cycleTheme, label: themeLabel } = useTheme()
  const {
    showInstall,
    install: installPwa,
    iosHint,
    dismissIosHint,
    isIos,
  } = usePwaInstall()

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
  const [confirmAction, setConfirmAction] = useState<'stop' | 'reset' | null>(
    null,
  )
  const [notice, setNotice] = useState<{ title: string; body: string } | null>(
    null,
  )
  const [installDismissed, setInstallDismissed] = useState(() =>
    loadInstallBannerDismissed(),
  )
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
            return null
          }
          return prev - 1
        })
      }, 1000)
    }
    return clearAutoBreakTimer
  }, [state.phase, state.kind, autoBreak, clearAutoBreakTimer, startBreak])

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
      setConfirmAction('stop')
      return
    }
    stop()
  }, [state.elapsedSeconds, stop])

  const sessionFocus = isActive(state.phase)
  const activePreset =
    SESSION_PRESETS.find((p) => p.id === presetId) ?? {
      id: 'focus',
      label: 'تركيز',
      kind: 'focus' as const,
      minutes: 25,
      tone: 'brand' as const,
      icon: '◎',
    }

  useWakeLock(state.phase === 'running' || stopwatch.phase === 'running')

  const handleStart = useCallback(() => {
    start()
  }, [start])

  const handleStartBreak = useCallback(() => {
    clearAutoBreakTimer()
    startBreak()
  }, [clearAutoBreakTimer, startBreak])

  const handleReset = useCallback(() => {
    if (isActive(state.phase) || state.elapsedSeconds > 0) {
      setConfirmAction('reset')
      return
    }
    reset()
  }, [state.phase, state.elapsedSeconds, reset])

  const handleResume = useCallback(() => {
    resume()
  }, [resume])

  const handleModeChange = useCallback(
    (mode: AppMode) => {
      if (mode === appMode) return
      if (
        isActive(state.phase) ||
        stopwatch.phase === 'running' ||
        stopwatch.phase === 'paused'
      ) {
        return
      }
      setAppMode(mode)
    },
    [appMode, state.phase, stopwatch.phase],
  )

  const handlePreset = useCallback(
    (preset: SessionPreset) => {
      setPresetId(preset.id)
      updateKind(preset.kind)
      if (preset.minutes) updatePlanned(preset.minutes * 60)
      if (preset.intention !== undefined) updateIntention(preset.intention)
      else if (preset.id === 'focus') updateIntention('')
    },
    [updateKind, updatePlanned, updateIntention],
  )

  const handleTimerPrimary = useCallback(() => {
    if (appMode === 'stopwatch') {
      if (stopwatch.phase === 'running') stopwatch.pause()
      else if (stopwatch.phase === 'paused') stopwatch.resume()
      else stopwatch.start()
      return
    }
    if (state.phase === 'idle') handleStart()
    else if (state.phase === 'running') pause()
    else if (state.phase === 'paused') handleResume()
    else if (state.phase === 'finished') handleReset()
  }, [
    appMode,
    stopwatch,
    state.phase,
    handleStart,
    pause,
    handleResume,
    handleReset,
  ])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName
      if (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        (e.target as HTMLElement)?.isContentEditable
      ) {
        return
      }
      if (e.key === 'Escape') {
        if (settingsOpen) {
          setSettingsOpen(false)
          return
        }
        if (confirmAction) {
          setConfirmAction(null)
          return
        }
        if (notice) {
          setNotice(null)
          return
        }
        if (isActive(state.phase)) {
          e.preventDefault()
          requestStop()
        }
        return
      }
      if (e.key === ' ' || e.code === 'Space') {
        // Preserve native Space behavior for focused controls and disclosure widgets.
        if (
          (e.target as HTMLElement | null)?.closest(
            'button, a, select, summary, [role="button"], [role="tab"], [role="menuitem"]',
          )
        ) {
          return
        }
        e.preventDefault()
        if (appMode === 'stopwatch') {
          if (stopwatch.phase === 'idle') stopwatch.start()
          else if (stopwatch.phase === 'running') stopwatch.pause()
          else if (stopwatch.phase === 'paused') stopwatch.resume()
          return
        }
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
    appMode,
    stopwatch,
    settingsOpen,
    confirmAction,
    notice,
    handleStart,
    handleResume,
    handleReset,
    pause,
    requestStop,
  ])

  const toggleSound = () => {
    setSoundOn((v) => {
      const next = !v
      saveSoundEnabled(next)
      if (next) playCompletionChime()
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
        setNotice({
          title: 'تعذّر تفعيل الإشعارات',
          body:
            perm === 'denied'
              ? 'الإشعارات محظورة من إعدادات المتصفح. يمكنك تفعيلها لاحقاً من إعدادات الموقع في المتصفح.'
              : 'لم يُمنح إذن الإشعارات.',
        })
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
    <div className="app-shell min-h-dvh">
      <header
        className="app-header sticky top-0 z-20 w-full overflow-x-clip px-3 pt-[max(0.5rem,env(safe-area-inset-top))] pb-3 sm:px-4"
      >
        <div className="mx-auto flex w-full min-w-0 max-w-md items-center justify-between gap-1.5">
          <h1
            className="flex min-w-0 items-center gap-2 text-base font-semibold tracking-tight"
          >
            <img
              src="./icons/icon.svg"
              alt=""
              width={28}
              height={28}
              className="h-7 w-7 shrink-0 rounded-[7px] shadow-[0_0_16px_rgba(61,123,255,0.35)]"
              aria-hidden
            />
            <span className="truncate">ناوي فوكاس</span>
          </h1>

          <div className="flex shrink-0 items-center gap-1" ref={settingsRef}>
            <button
              type="button"
              onClick={cycleTheme}
              className="btn-chrome min-w-11"
              title={`المظهر: ${themeLabel}`}
              aria-label={`المظهر الحالي: ${themeLabel}`}
            >
              {themeLabel === 'ليل' ? '◐' : themeLabel === 'نهار' ? '○' : '◎'}
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setSettingsOpen((v) => !v)}
                className={`btn-chrome relative min-w-11 px-2 text-base ${
                  settingsOpen ? 'ring-1 ring-brand-500/40' : ''
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
                  className="app-menu absolute end-0 top-full z-30 mt-2 w-[min(14rem,calc(100vw-1.5rem))] rounded-2xl p-1.5"
                  role="menu"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={toggleSound}
                    className="flex min-h-11 w-full items-center justify-between gap-2 rounded-xl px-3 text-sm transition hover:opacity-90"
                    aria-pressed={soundOn}
                  >
                    <span>الصوت</span>
                    <span
                      className={`text-xs font-medium ${
                        soundOn ? 'text-brand-500' : 'text-slate-500'
                      }`}
                    >
                      {soundOn ? 'مفعّل' : 'متوقف'}
                    </span>
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={toggleVibrate}
                    className="flex min-h-11 w-full items-center justify-between gap-2 rounded-xl px-3 text-sm transition hover:opacity-90"
                    aria-pressed={vibrateOn}
                  >
                    <span>الاهتزاز</span>
                    <span
                      className={`text-xs font-medium ${
                        vibrateOn ? 'text-brand-500' : 'text-slate-500'
                      }`}
                    >
                      {vibrateOn ? 'مفعّل' : 'متوقف'}
                    </span>
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={toggleAutoBreak}
                    className={`flex min-h-11 w-full items-center justify-between gap-2 rounded-xl px-3 text-sm transition hover:opacity-90 ${
                      autoBreak === 'auto' ? 'text-brand-500' : ''
                    }`}
                    aria-pressed={autoBreak === 'auto'}
                  >
                    <span>راحة تلقائية</span>
                    <span className="text-xs text-slate-500">
                      {autoBreak === 'auto' ? 'مفعّل' : 'متوقف'}
                    </span>
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => void toggleNotifications()}
                    className={`flex min-h-11 w-full items-center justify-between gap-2 rounded-xl px-3 text-sm transition hover:opacity-90 ${
                      notifyOn ? 'text-amber-500' : ''
                    }`}
                    aria-pressed={notifyOn}
                  >
                    <span>إشعار</span>
                    <span className="text-xs text-slate-500">
                      {notifyOn ? 'مفعّل' : 'متوقف'}
                    </span>
                  </button>
                  <div className="my-1 h-px bg-current opacity-10" />
                  <button
                    type="button"
                    role="menuitem"
                    onClick={cycleTheme}
                    className="flex min-h-11 w-full items-center justify-between gap-2 rounded-xl px-3 text-sm transition hover:opacity-90"
                    title="ليل / نهار / تلقائي"
                  >
                    <span>المظهر</span>
                    <span className="text-xs font-medium text-brand-500">
                      {themeLabel}
                    </span>
                  </button>
                  {showInstall && (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => void installPwa()}
                      className="flex min-h-11 w-full items-center justify-between gap-2 rounded-xl px-3 text-sm transition hover:opacity-90"
                    >
                      <span>تثبيت التطبيق</span>
                      <span className="text-xs text-brand-500">PWA</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main
        className="mx-auto flex w-full min-w-0 max-w-md flex-col items-center gap-4 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4 sm:gap-5 sm:px-5 sm:pt-6"
      >

        {persistenceError && (
          <div
            className="w-full max-w-sm rounded-2xl border border-amber-500/30 bg-amber-950/20 px-4 py-3 text-start text-sm text-amber-200"
            role="alert"
          >
            <p>{persistenceError}</p>
            <button
              type="button"
              onClick={() => void retrySave()}
              className="mt-2 min-h-10 rounded-xl border border-amber-500/30 px-3 text-xs font-medium transition hover:bg-amber-500/10"
            >
              إعادة محاولة الحفظ
            </button>
          </div>
        )}
        {finishedWhileHidden && state.phase === 'finished' && appMode === 'session' && (
          <div
            className="w-full max-w-sm rounded-2xl border border-amber-500/30 bg-amber-950/30 px-4 py-3 text-center text-sm text-amber-100"
            role="status"
          >
            انتهت الجلسة أثناء عدم وجودك في الصفحة.
            <button
              type="button"
              onClick={dismissFinishedBanner}
              className="ms-2 underline opacity-80 hover:opacity-100"
            >
              حسناً
            </button>
          </div>
        )}

        {showInstall &&
          !installDismissed &&
          !sessionFocus &&
          appMode === 'session' &&
          state.phase === 'idle' && (
            <div className="install-banner flex w-full max-w-sm items-center gap-2 px-3 py-2">
              <p className="min-w-0 flex-1 text-start text-[12px] text-slate-500">
                {isIos
                  ? 'أضفه إلى الشاشة الرئيسية من قائمة المشاركة في Safari'
                  : 'ثبّت التطبيق للوصول إليه بسرعة'}
              </p>
              <button
                type="button"
                onClick={() => void installPwa()}
                className="btn-chrome shrink-0 border-brand-500/30 text-brand-500"
              >
                تثبيت
              </button>
              <button
                type="button"
                onClick={() => {
                  saveInstallBannerDismissed(true)
                  setInstallDismissed(true)
                }}
                className="btn-chrome min-w-9 shrink-0 px-2"
                aria-label="إغلاق"
                title="إغلاق"
              >
                ×
              </button>
            </div>
          )}

        {iosHint && (
          <div
            className="install-banner w-full max-w-sm rounded-2xl px-4 py-3 text-sm"
            role="status"
          >
            <p>
              على آيفون: اضغط مشاركة في Safari ثم «إضافة إلى الشاشة الرئيسية».
            </p>
            <button
              type="button"
              className="mt-2 text-xs text-brand-500 underline"
              onClick={dismissIosHint}
            >
              حسناً
            </button>
          </div>
        )}

        {autoBreakCountdown !== null && appMode === 'session' && (
          <div
            className="w-full max-w-sm rounded-2xl border border-brand-500/25 bg-brand-950/40 px-4 py-4 shadow-[0_0_40px_-16px_rgba(61,123,255,0.35)] sm:px-5"
            role="status"
            aria-live="polite"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-brand-100">
                تبدأ الراحة خلال
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
                بدء الآن
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

        <ModeTabs
          mode={appMode}
          onChange={handleModeChange}
          disabled={isActive(state.phase) || stopwatch.phase === 'running' || stopwatch.phase === 'paused'}
        />

        {appMode === 'session' ? (
          <>
            <TimerDisplay
              seconds={state.remainingSeconds}
              phase={state.phase}
              kind={state.kind}
              progress={
                state.plannedSeconds > 0
                  ? 1 - state.remainingSeconds / state.plannedSeconds
                  : 0
              }
              accent={activePreset.tone}
              activityLabel={
                state.phase === 'idle' || state.phase === 'finished'
                  ? activePreset.label
                  : undefined
              }
              activityIcon={activePreset.icon}
              onPrimary={handleTimerPrimary}
              primaryLabel={
                state.phase === 'running'
                  ? 'إيقاف مؤقت'
                  : state.phase === 'paused'
                    ? 'استئناف'
                    : state.phase === 'finished'
                      ? 'جلسة جديدة'
                      : 'بدء'
              }
              onReset={
                state.phase === 'running' ||
                state.phase === 'paused' ||
                state.phase === 'finished'
                  ? handleReset
                  : undefined
              }
              onSecondary={
                state.phase === 'running' || state.phase === 'paused'
                  ? requestStop
                  : undefined
              }
              secondaryIcon="■"
              secondaryLabel="إنهاء"
            />

            {state.phase !== 'finished' && (
          sessionFocus ? (
            <section
              className="session-live-summary surface-panel w-full max-w-sm"
              aria-label="ملخص الجلسة الحالية"
              role="status"
            >
              <div className="flex items-center gap-3">
                <span className={`session-live-mark ${state.kind === 'break' ? 'session-live-mark-break' : ''}`} aria-hidden>
                  {state.kind === 'break' ? '☕' : '•/'}
                </span>
                <div className="min-w-0 flex-1 text-start">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-sm font-semibold">
                      {state.kind === 'break' ? 'وقت الراحة' : 'جلسة تركيز'}
                    </h2>
                    <span className={`session-live-status ${state.phase === 'paused' ? 'session-live-status-paused' : ''}`}>
                      {state.phase === 'paused' ? 'متوقفة مؤقتًا' : 'قيد التشغيل'}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-xs text-slate-500">
                    {state.intention.trim() || (state.kind === 'break' ? 'استراحة قصيرة لنفسك' : 'كل انتباهك للحاجة اللي اخترتها')}
                  </p>
                </div>
                <div className="shrink-0 text-end">
                  <p className="font-mono text-sm font-semibold tabular-nums" dir="ltr">
                    {Math.round(state.plannedSeconds / 60)} <span className="text-xs font-normal text-slate-500">د</span>
                  </p>
                  <p className="mt-0.5 text-[10px] text-slate-500">المدة</p>
                </div>
              </div>
            </section>
          ) : (
            <section className="session-editor surface-panel w-full max-w-md p-4 sm:p-5" aria-label="إعداد الجلسة">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold">جهّز جلستك</h2>
                  <p className="mt-1 text-xs leading-5 text-slate-500">اختار نوع الجلسة ومدتها، وحدد ناوي تركز على إيه.</p>
                </div>
                <span className="session-editor-mark" aria-hidden>•/</span>
              </div>
              <div className="flex flex-col gap-4">
                <div className="session-editor-section">
                  <p className="session-editor-label">نوع الجلسة</p>
                  <SessionTypeChips
                    kind={state.kind}
                    intention={state.intention}
                    selectedId={presetId}
                    onSelect={handlePreset}
                  />
                </div>
                <div className="session-editor-section">
                  <p className="session-editor-label">المدة</p>
                  <DurationPicker
                    kind={state.kind}
                    plannedSeconds={state.plannedSeconds}
                    onKindChange={updateKind}
                    onSecondsChange={updatePlanned}
                  />
                </div>
                <div className="session-editor-section">
                  <IntentionInput
                    value={state.intention}
                    onChange={updateIntention}
                    suggestions={recentIntentions}
                    onSubmit={handleStart}
                  />
                </div>
              </div>
            </section>
          )
        )}

            {(state.phase === 'finished' || state.phase === 'paused') && (
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
            )}
          </>
        ) : (
          <>
            <TimerDisplay
              milliseconds={stopwatch.elapsedMs}
              phase={stopwatch.phase}
              kind="stopwatch"
              showMs
              onPrimary={handleTimerPrimary}
              primaryLabel={
                stopwatch.phase === 'running'
                  ? 'إيقاف مؤقت'
                  : stopwatch.phase === 'paused'
                    ? 'استئناف'
                    : 'بدء'
              }
              onReset={
                stopwatch.phase !== 'idle' ? stopwatch.reset : undefined
              }
              onSecondary={
                stopwatch.phase !== 'idle' ? stopwatch.recordLap : undefined
              }
              secondaryIcon="＋"
              secondaryLabel="تسجيل لفة"
            />
            {stopwatch.phase === 'idle' && (
              <p className="text-center text-[11px] text-slate-600">
                اضغط التشغيل لبدء القياس
              </p>
            )}
            {stopwatch.laps.length > 0 && (
              <section className="stopwatch-laps surface-panel w-full max-w-sm overflow-hidden" aria-label="لفات ساعة الإيقاف">
                <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
                  <h2 className="text-sm font-semibold">اللفات</h2>
                  <span className="text-xs text-slate-500">{stopwatch.laps.length} لفة</span>
                </div>
                <div className="max-h-56 overflow-y-auto" role="list">
                  {stopwatch.laps.map((lap, index) => (
                    <div
                      key={lap.number}
                      role="listitem"
                      className={`stopwatch-lap-row flex flex-col gap-2.5 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-4 ${index === 0 ? 'stopwatch-lap-latest' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="stopwatch-lap-number flex h-7 min-w-7 items-center justify-center rounded-full bg-white/5 px-2 text-xs font-semibold tabular-nums text-slate-400">
                          {lap.number}
                        </span>
                        <span className="text-sm text-slate-500">اللفة {lap.number}</span>
                      </div>
                      <div className="flex items-center gap-4 font-mono text-sm tabular-nums" dir="ltr">
                        <span className="text-slate-500">{formatStopwatchLap(lap.splitMs)}</span>
                        <span className="font-semibold text-slate-200">{formatStopwatchLap(lap.elapsedMs)}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div dir="ltr" className="flex justify-between px-4 py-2 text-[10px] text-slate-600">
                  <span>زمن اللفة</span>
                  <span>الوقت الإجمالي</span>
                </div>
              </section>
            )}
          </>
        )}

        {appMode === 'session' && state.phase === 'idle' && (
          <p className="hidden text-center text-[11px] text-slate-600 opacity-60 sm:block">
            مسافة: بدء / إيقاف · Esc: إنهاء
          </p>
        )}

        {appMode === 'session' && !sessionFocus && storageError && (
          <div
            className="w-full max-w-sm rounded-2xl border border-amber-500/30 bg-amber-950/20 px-4 py-3 text-start text-sm text-amber-200"
            role="alert"
          >
            <p>{storageError}</p>
            <button
              type="button"
              onClick={() => void refresh()}
              className="mt-2 min-h-10 rounded-xl border border-amber-500/30 px-3 text-xs font-medium transition hover:bg-amber-500/10"
            >
              إعادة المحاولة
            </button>
          </div>
        )}

        {appMode === 'session' && !sessionFocus && (
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

        {appMode === 'session' && !sessionFocus && state.phase === 'idle' && (
          <footer className="mt-1 pb-3 text-center text-[11px] text-slate-600 opacity-70">
            <a
              href="https://nawy.to/focus"
              className="underline-offset-2 transition hover:text-slate-400 hover:underline"
              rel="noopener noreferrer"
            >
              nawy.to/focus
            </a>
            <span className="mx-1.5 opacity-40">·</span>
            <span className="tabular-nums opacity-50">v0.2.0</span>
          </footer>
        )}
      </main>

      <ConfirmDialog
        open={confirmAction === 'stop'}
        title="إنهاء الجلسة؟"
        body="سيتم حفظ الوقت المستغرق في هذه الجلسة."
        confirmLabel="إنهاء وحفظ"
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => {
          setConfirmAction(null)
          stop()
        }}
      />
      <ConfirmDialog
        open={confirmAction === 'reset'}
        title="إعادة التعيين؟"
        body="لن يُحفظ وقت هذه الجلسة."
        confirmLabel="إعادة التعيين"
        danger
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => {
          setConfirmAction(null)
          reset()
        }}
      />
      <ConfirmDialog
        open={notice !== null}
        title={notice?.title ?? ''}
        body={notice?.body}
        confirmLabel="حسناً"
        notice
        onCancel={() => setNotice(null)}
        onConfirm={() => setNotice(null)}
      />
    </div>
  )
}
