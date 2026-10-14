import type { TimerPhase } from '../types'

interface Props {
  phase: TimerPhase
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onStop: () => void
  onReset: () => void
}

export function SessionControls({
  phase,
  onStart,
  onPause,
  onResume,
  onStop,
  onReset,
}: Props) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      {phase === 'idle' && (
        <button
          type="button"
          onClick={onStart}
          className="rounded-full bg-emerald-500 px-8 py-3.5 text-base font-semibold text-slate-950 shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-400 active:scale-[0.98]"
        >
          ابدأ التركيز
        </button>
      )}

      {phase === 'running' && (
        <>
          <button
            type="button"
            onClick={onPause}
            className="rounded-full bg-slate-100 px-7 py-3.5 text-base font-semibold text-slate-900 transition hover:bg-white active:scale-[0.98]"
          >
            إيقاف مؤقت
          </button>
          <button
            type="button"
            onClick={onStop}
            className="rounded-full border border-slate-600 px-5 py-3 text-sm text-slate-300 transition hover:border-slate-400 hover:text-slate-100"
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
            className="rounded-full bg-emerald-500 px-7 py-3.5 text-base font-semibold text-slate-950 transition hover:bg-emerald-400 active:scale-[0.98]"
          >
            متابعة
          </button>
          <button
            type="button"
            onClick={onStop}
            className="rounded-full border border-slate-600 px-5 py-3 text-sm text-slate-300 transition hover:border-slate-400 hover:text-slate-100"
          >
            إنهاء
          </button>
        </>
      )}

      {phase === 'finished' && (
        <button
          type="button"
          onClick={onReset}
          className="rounded-full bg-emerald-500 px-8 py-3.5 text-base font-semibold text-slate-950 transition hover:bg-emerald-400 active:scale-[0.98]"
        >
          جلسة جديدة
        </button>
      )}
    </div>
  )
}
