import { useCallback, useEffect } from 'react'
import { DurationPicker } from './components/DurationPicker'
import { HistoryList } from './components/HistoryList'
import { IntentionInput } from './components/IntentionInput'
import { SessionControls } from './components/SessionControls'
import { TimerDisplay } from './components/TimerDisplay'
import { useFullscreen } from './hooks/useFullscreen'
import { useSessions } from './hooks/useSessions'
import { useTimer } from './hooks/useTimer'
import { isActive } from './lib/timer'

export default function App() {
  const {
    state,
    start,
    pause,
    resume,
    stop,
    reset,
    updateIntention,
    updatePlanned,
    updateKind,
  } = useTimer()

  const {
    sessions,
    filter,
    setFilter,
    todaySeconds,
    weekSeconds,
    loading,
    refresh,
    downloadBackup,
    uploadBackup,
    backupMessage,
  } = useSessions()

  const { active: fullscreen, enter: enterFs, exit: exitFs, toggle: toggleFs } =
    useFullscreen()

  useEffect(() => {
    if (state.phase === 'finished' || state.phase === 'idle') {
      void refresh()
    }
  }, [state.phase, refresh])

  // Exit fullscreen when session ends
  useEffect(() => {
    if (state.phase === 'finished' || state.phase === 'idle') {
      void exitFs()
    }
  }, [state.phase, exitFs])

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
    void stop()
  }, [state.elapsedSeconds, stop])

  const handleStart = useCallback(() => {
    start()
    void enterFs()
  }, [start, enterFs])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        if (state.phase === 'idle') handleStart()
        else if (state.phase === 'running') pause()
        else if (state.phase === 'paused') resume()
        else if (state.phase === 'finished') reset()
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
    handleStart,
    pause,
    resume,
    reset,
    requestStop,
    fullscreen,
    exitFs,
    toggleFs,
  ])

  const locked = isActive(state.phase)

  return (
    <div className="min-h-dvh bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800/80 px-4 py-4">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-2">
          <h1 className="text-lg font-semibold tracking-tight text-slate-50">
            ناوي فوكس
          </h1>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void toggleFs()}
              className="rounded-lg border border-slate-700 px-2.5 py-1 text-xs text-slate-300 transition hover:border-slate-500 hover:text-slate-100"
              title="ملء الشاشة (F)"
            >
              {fullscreen ? 'خروج من ملء الشاشة' : 'ملء الشاشة'}
            </button>
            <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs text-slate-400">
              Nawy Focus
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-lg flex-col items-center gap-8 px-4 py-8">
        <TimerDisplay
          remainingSeconds={state.remainingSeconds}
          plannedSeconds={state.plannedSeconds}
          phase={state.phase}
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
          onStart={handleStart}
          onPause={pause}
          onResume={resume}
          onStop={requestStop}
          onReset={reset}
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
            loading={loading}
            onExport={() => void downloadBackup()}
            onImportFile={(f) => void uploadBackup(f)}
            backupMessage={backupMessage}
          />
        </div>
      </main>
    </div>
  )
}
