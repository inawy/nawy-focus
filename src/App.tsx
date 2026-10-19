import { useCallback, useEffect, useRef, useState } from 'react'
import { ConfirmDialog } from './components/ConfirmDialog'
import { DurationPicker } from './components/DurationPicker'
import { HistoryList } from './components/HistoryList'
import { IntentionInput } from './components/IntentionInput'
import { SessionControls } from './components/SessionControls'
import { TimerDisplay } from './components/TimerDisplay'
import { useFullscreen } from './hooks/useFullscreen'
import { usePwaInstall } from './hooks/usePwaInstall'
import { useSessions } from './hooks/useSessions'
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
      setConfirmAction('stop')
      return
    }
    stop()
  }, [state.elapsedSeconds, stop])

  const locked = isActive(state.phase) || state.phase === 'finished'
  const sessionFocus = isActive(state.phase)

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
      setConfirmAction('reset')
      return
    }
    reset()
  }, [state.phase, state.elapsedSeconds, reset])

  const handleResume = useCallback(() => {
    resume()
    void enterFs()
  }, [resume, enterFs])

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
    confirmAction,
    notice,
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
          title: 'تعذر تفعيل الإشعارات',
          body:
            perm === 'denied'
              ? 'الإشعارات محظورة من إعدادات المتصفح. يمكنك تفعيلها لاحقاً من إعدادات الموقع.'
              : 'لم يتم منح إذن الإشعارات.',
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
        className={`app-header sticky top-0 z-20 w-full overflow-x-clip px-3 pt-[max(0.5rem,env(safe-area-inset-top))] transition-all duration-300 sm:px-4 ${
          sessionFocus ? 'pb-2' : 'pb-3'
        }`}
      >
        <div className="mx-auto flex w-full min-w-0 max-w-md items-center justify-between gap-1.5">
          <h1
            className={`flex min-w-0 items-center gap-2 font-semibold tracking-tight transition-all duration-300 ${
              sessionFocus ? 'text-[15px] opacity-60' : 'text-base'
            }`}
          >
            <img
              src="./icons/icon.svg"
              alt=""
              width={28}
              height={28}
              className={`shrink-0 rounded-[7px] shadow-[0_0_16px_rgba(61,123,255,0.35)] transition-all duration-300 ${
                sessionFocus ? 'h-5 w-5' : 'h-7 w-7'
              }`}
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
            <button
              type="button"
              onClick={() => void toggleFs()}
              className="btn-chrome hidden min-[380px]:inline-flex"
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
                    onClick={() => void toggleFs()}
                    className="flex min-h-11 w-full items-center justify-between gap-2 rounded-xl px-3 text-sm transition hover:opacity-90 min-[380px]:hidden"
                  >
                    <span>ملء الشاشة</span>
                    <span className="text-xs text-slate-500">
                      {fullscreen ? 'تشغيل' : 'إيقاف'}
                    </span>
                  </button>
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
                      {soundOn ? 'تشغيل' : 'إيقاف'}
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
                      {vibrateOn ? 'تشغيل' : 'إيقاف'}
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
                      {autoBreak === 'auto' ? 'تشغيل' : 'إيقاف'}
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
                      {notifyOn ? 'تشغيل' : 'إيقاف'}
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
        className={`mx-auto flex w-full min-w-0 max-w-md flex-col items-center px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4 transition-all duration-300 sm:px-5 sm:pt-6 ${
          state.phase === 'finished'
            ? 'gap-4 sm:gap-5'
            : sessionFocus
              ? 'gap-3'
              : 'gap-3.5 sm:gap-4'
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

        {showInstall &&
          !installDismissed &&
          !sessionFocus &&
          state.phase === 'idle' && (
            <div className="install-banner flex w-full max-w-sm items-center gap-2 px-3 py-2">
              <p className="min-w-0 flex-1 text-start text-[12px] text-slate-500">
                {isIos
                  ? 'ثبّته من مشاركة Safari على الشاشة الرئيسية'
                  : 'ثبّت التطبيق للوصول السريع'}
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
                aria-label="إخفاء"
                title="إخفاء"
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

        {autoBreakCountdown !== null && (
          <div
            className="w-full max-w-sm rounded-2xl border border-brand-500/25 bg-brand-950/40 px-4 py-4 shadow-[0_0_40px_-16px_rgba(61,123,255,0.35)] sm:px-5"
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

        {sessionFocus ? (
          state.intention ? (
            <p className="max-w-sm px-1 text-center text-xs text-slate-500">
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
            onSubmit={handleStart}
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
          <p className="hidden text-center text-[11px] text-slate-600 opacity-60 sm:block">
            مسافة للبدء · F ملء الشاشة · Esc إنهاء
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

        {!sessionFocus && state.phase === 'idle' && (
          <footer className="mt-1 pb-3 text-center text-[11px] text-slate-600 opacity-70">
            <a
              href="https://nawy.to/focus"
              className="underline-offset-2 transition hover:text-slate-400 hover:underline"
              rel="noopener noreferrer"
            >
              nawy.to/focus
            </a>
          </footer>
        )}
      </main>

      <ConfirmDialog
        open={confirmAction === 'stop'}
        title="إنهاء الجلسة؟"
        body="سيُحفظ الوقت الذي قضيته حتى الآن."
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
        body="سيُفقد الوقت الحالي لهذه الجلسة."
        confirmLabel="إعادة تعيين"
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
