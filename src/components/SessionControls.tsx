import { formatDurationShort } from '../lib/format'
import type { SessionKind, TimerPhase } from '../types'

interface Props {
  phase: TimerPhase
  kind: SessionKind
  /** Planned length of the session that just finished (for U7 message) */
  plannedSeconds?: number
  /** Actual elapsed of the finished session */
  elapsedSeconds?: number
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
  plannedSeconds = 0,
  elapsedSeconds = 0,
  onStart,
  onPause,
  onResume,
  onStop,
  onReset,
  onStartBreak,
}: Props) {
  return (
    <div className="flex w-full max-w-md flex-col items-center gap-3">
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
        <div className="flex flex-wrap items-center justify-center gap-3">
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
        </div>
      )}

      {phase === 'paused' && (
        <div className="flex flex-wrap items-center justify-center gap-3">
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
        </div>
      )}

      {/* U7: finished screen — clear primary / secondary actions */}
      {phase === 'finished' && (
        <div className="flex w-full flex-col items-center gap-4">
          <p className="text-center text-sm text-slate-300">
            {kind === 'focus' ? (
              <>
                أحسنت — انتهت جلسة التركيز
                {(elapsedSeconds > 0 || plannedSeconds > 0) && (
                  <span className="mt-0.5 block text-xs text-slate-500">
                    {formatDurationShort(
                      elapsedSeconds > 0 ? elapsedSeconds : plannedSeconds,
                    )}
                  </span>
                )}
              </>
            ) : (
              <>
                انتهت الراحة — جاهز لجلسة جديدة
                {(elapsedSeconds > 0 || plannedSeconds > 0) && (
                  <span className="mt-0.5 block text-xs text-slate-500">
                    {formatDurationShort(
                      elapsedSeconds > 0 ? elapsedSeconds : plannedSeconds,
                    )}
                  </span>
                )}
              </>
            )}
          </p>

          <div className="flex w-full flex-col items-stretch gap-2.5 sm:items-center">
            {kind === 'focus' && onStartBreak && (
              <button
                type="button"
                onClick={onStartBreak}
                className="min-h-12 w-full rounded-full bg-sky-500 px-7 py-3.5 text-base font-semibold text-slate-950 shadow-lg shadow-sky-500/25 transition hover:bg-sky-400 active:scale-[0.98] sm:w-auto sm:min-w-[14rem]"
              >
                ابدأ راحة
              </button>
            )}
            <button
              type="button"
              onClick={onReset}
              className={
                kind === 'focus'
                  ? 'min-h-11 w-full rounded-full border border-emerald-600/50 bg-emerald-950/30 px-6 py-3 text-sm font-medium text-emerald-200 transition hover:border-emerald-500 hover:bg-emerald-950/50 sm:w-auto sm:min-w-[14rem]'
                  : 'min-h-12 w-full rounded-full bg-emerald-500 px-7 py-3.5 text-base font-semibold text-slate-950 shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-400 active:scale-[0.98] sm:w-auto sm:min-w-[14rem]'
              }
            >
              جلسة تركيز جديدة
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
