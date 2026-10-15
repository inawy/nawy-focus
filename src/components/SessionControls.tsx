import { formatDurationShort } from '../lib/format'
import type { SessionKind, TimerPhase } from '../types'

interface Props {
  phase: TimerPhase
  kind: SessionKind
  plannedSeconds?: number
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
  const primaryFocus =
    'bg-brand-500 text-white shadow-lg shadow-brand-500/25 hover:bg-brand-600'
  const primaryBreak =
    'bg-slate-200 text-slate-900 shadow-lg shadow-black/20 hover:bg-white'
  const secondary =
    'border border-slate-600 text-slate-300 hover:border-slate-400 hover:text-slate-100'

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-3">
      {phase === 'idle' && (
        <button
          type="button"
          onClick={onStart}
          className={`min-h-12 rounded-full px-10 py-3.5 text-base font-semibold transition active:scale-[0.98] ${
            kind === 'break' ? primaryBreak : primaryFocus
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
            className={`min-h-11 rounded-full px-5 py-3 text-sm transition ${secondary}`}
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
              kind === 'break' ? primaryBreak : primaryFocus
            }`}
          >
            متابعة
          </button>
          <button
            type="button"
            onClick={onStop}
            className={`min-h-11 rounded-full px-5 py-3 text-sm transition ${secondary}`}
          >
            إنهاء
          </button>
        </div>
      )}

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
                className={`min-h-12 w-full rounded-full px-7 py-3.5 text-base font-semibold transition active:scale-[0.98] sm:w-auto sm:min-w-[14rem] ${primaryBreak}`}
              >
                ابدأ راحة
              </button>
            )}
            <button
              type="button"
              onClick={onReset}
              className={
                kind === 'focus'
                  ? 'min-h-11 w-full rounded-full border border-brand-500/40 bg-brand-950/40 px-6 py-3 text-sm font-medium text-brand-300 transition hover:border-brand-400 hover:bg-brand-950/60 sm:w-auto sm:min-w-[14rem]'
                  : `min-h-12 w-full rounded-full px-7 py-3.5 text-base font-semibold transition active:scale-[0.98] sm:w-auto sm:min-w-[14rem] ${primaryFocus}`
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
