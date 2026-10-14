import { useEffect } from 'react'
import { DurationPicker } from './components/DurationPicker'
import { HistoryList } from './components/HistoryList'
import { IntentionInput } from './components/IntentionInput'
import { SessionControls } from './components/SessionControls'
import { TimerDisplay } from './components/TimerDisplay'
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

  const { sessions, todaySeconds, loading, refresh } = useSessions()

  useEffect(() => {
    if (state.phase === 'finished' || state.phase === 'idle') {
      void refresh()
    }
  }, [state.phase, refresh])

  const locked = isActive(state.phase)

  return (
    <div className="min-h-dvh bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800/80 px-4 py-4">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <h1 className="text-lg font-semibold tracking-tight text-slate-50">
            ناوي فوكس
          </h1>
          <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs text-slate-400">
            Nawy Focus
          </span>
        </div>
      </header>

      <main className="mx-auto flex max-w-lg flex-col items-center gap-8 px-4 py-8">
        <TimerDisplay
          remainingSeconds={state.remainingSeconds}
          plannedSeconds={state.plannedSeconds}
          phase={state.phase}
        />

        <IntentionInput
          value={state.intention}
          onChange={updateIntention}
          disabled={locked}
        />

        <DurationPicker
          kind={state.kind}
          plannedSeconds={state.plannedSeconds}
          onKindChange={updateKind}
          onSecondsChange={updatePlanned}
          disabled={locked}
        />

        <SessionControls
          phase={state.phase}
          onStart={start}
          onPause={pause}
          onResume={resume}
          onStop={() => void stop()}
          onReset={reset}
        />

        <div className="w-full border-t border-slate-800 pt-6">
          <HistoryList
            sessions={sessions}
            todaySeconds={todaySeconds}
            loading={loading}
          />
        </div>
      </main>
    </div>
  )
}
