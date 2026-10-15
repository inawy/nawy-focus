import type { SessionKind, TimerPhase } from '../types'

interface Props {
  phase: TimerPhase
  kind: SessionKind
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onStop: () => void
  onReset: () => void
  onStartBreak?: () => void
}

export function SessionControls({
  phase,
  kind,
  onStart,
  onPause,
  onResume,
  onStop,
  onReset,
  onStartBreak,
}: Props) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      {phase === 'idle' && (
        <button
          type="button"
          onClick={onStart}
          className={`min-h-12 rounded-full px-8 py-3.5 text-base font-semibold shadow-lg transition active:scale-[0.98] ${
            kind === 'break'
              ? 'bg-sky-500 text-slate-950 shadow-sky-500/25 hover:bg-sky-400'
              : 'bg-emerald-500 text-slate-950 shadow-emerald-500/25 hover:bg-emerald-400'
          }`}
        >
          {kind === 'break' ? 'ابدأ الراحة' : 'ابدأ التركيز'}
        </button>
      )}

      {phase === 'running' && (
        <>
          <button
            type="button"
            onClick={onPause}
            className="min-h-12 rounded-full bg-slate-100 px-7 py-3.5 text-base font-semibold text-slate-900 transition hover:bg-white active:scale-[0.98]"
          >
            إيقاف مؤقت
          </button>
          <button
            type="button"
            onClick={onStop}
            className="min-h-11 rounded-full border border-slate-600 px-5 py-3 text-sm text-slate-300 transition hover:border-slate-400 hover:text-slate-100"
          >
            إنهاء
          </button>
        </>
      )}

      {phase === 'paused' && (
        <>
          <button
            type="button"
            onClick={onResume}
            className={`min-h-12 rounded-full px-7 py-3.5 text-base font-semibold transition active:scale-[0.98] ${
              kind === 'break'
                ? 'bg-sky-500 text-slate-950 hover:bg-sky-400'
                : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
            }`}
          >
            متابعة
          </button>
          <button
            type="button"
            onClick={onStop}
            className="min-h-11 rounded-full border border-slate-600 px-5 py-3 text-sm text-slate-300 transition hover:border-slate-400 hover:text-slate-100"
          >
            إنهاء
          </button>
        </>
      )}

      {phase === 'finished' && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {kind === 'focus' && onStartBreak && (
            <button
              type="button"
              onClick={onStartBreak}
              className="min-h-12 rounded-full bg-sky-500 px-7 py-3.5 text-base font-semibold text-slate-950 shadow-lg shadow-sky-500/25 transition hover:bg-sky-400 active:scale-[0.98]"
            >
              ابدأ راحة
            </button>
          )}
          <button
            type="button"
            onClick={onReset}
            className="min-h-12 rounded-full bg-emerald-500 px-7 py-3.5 text-base font-semibold text-slate-950 transition hover:bg-emerald-400 active:scale-[0.98]"
          >
            جلسة جديدة
          </button>
        </div>
      )}
    </div>
  )
}
